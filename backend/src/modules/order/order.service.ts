import {
  CUSTOMER_CANCELLABLE_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  type CheckoutQuote,
  type CheckoutQuoteInput,
  type Order,
  type OrderListQuery,
  type OrderStatus,
  type OrderSummary,
  type Paginated,
  type PlaceOrderInput,
  type Role,
  type UpdateOrderStatusInput,
} from "@agri/shared";
import type { ClientSession } from "mongoose";
import { AppError } from "../../common/errors/app-error";
import { logger } from "../../common/logger";
import { withTransaction } from "../../database/transaction";
import type { AddressRecord } from "../customer/customer.model";
import { customerRepository } from "../customer/customer.repository";
import { productRepository } from "../product/product.repository";
import { storeService } from "../store/store.service";
import { toOrder, toOrderSummary } from "./order.mapper";
import type { OrderRecord } from "./order.model";
import { priceCart } from "./order.pricing";
import { orderRepository } from "./order.repository";

async function loadBuyer(customerId: string, addressId?: string) {
  const customer = await customerRepository.findById(customerId);
  if (!customer) throw AppError.unauthorized();
  const address = addressId
    ? (customer.addresses as AddressRecord[]).find((a) => a._id.toString() === addressId)
    : undefined;
  if (addressId && !address) throw AppError.notFound("Address");
  return { customer, address };
}

function paginate(rows: OrderRecord[], total: number, query: OrderListQuery): Paginated<OrderSummary> {
  return {
    items: rows.map(toOrderSummary),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

/** Puts stock back for every line of an order (used when an order is cancelled). */
async function returnOrderStock(order: Pick<OrderRecord, "items">, session: ClientSession) {
  for (const item of order.items) {
    await productRepository.returnStock(item.variantId.toString(), item.quantity, session);
  }
}

export const orderService = {
  /** Checkout preview: live prices, delivery fee and every reason the order can't go through. */
  async quote(customerId: string, input: CheckoutQuoteInput): Promise<CheckoutQuote> {
    const { customer, address } = await loadBuyer(customerId, input.addressId);
    return priceCart(input.items, customer.role as Role, address?.pincode ?? null);
  },

  async place(customerId: string, input: PlaceOrderInput): Promise<Order> {
    // A retry of the same checkout returns the order it already created.
    const existing = await orderRepository.findByIdempotencyKey(customerId, input.idempotencyKey);
    if (existing) return toOrder(existing);

    const { customer, address } = await loadBuyer(customerId, input.addressId);
    if (!address) throw AppError.notFound("Address");
    const config = await storeService.getConfig();

    const order = await withTransaction(async (session) => {
      // Re-priced inside the transaction, so prices and stock are checked at the moment of purchase.
      const quote = await priceCart(input.items, customer.role as Role, address.pincode, session);
      if (!quote.canPlaceOrder) {
        throw new AppError(409, "CART_CHANGED", quote.problems[0] ?? "Please review your cart.", quote);
      }

      for (const line of quote.lines) {
        const taken = await productRepository.takeStock(line.variantId, line.quantity, session);
        // Throwing here undoes every stock change already made in this transaction.
        if (!taken) throw AppError.conflict("OUT_OF_STOCK", `${line.productName} just sold out. Please update your cart.`);
      }

      const products = await productRepository.findByVariantIds(quote.lines.map((l) => l.variantId), session);
      const skuOf = (variantId: string) =>
        products.flatMap((p) => p.variants).find((v) => v._id.toString() === variantId)?.sku ?? "";

      const { _id: _addressId, isDefault: _isDefault, ...shippingAddress } = address;
      return orderRepository.create(
        {
          orderNumber: await orderRepository.nextOrderNumber(config.orderNumberPrefix, session),
          customerId,
          customer: { name: [customer.firstName, customer.lastName].filter(Boolean).join(" "), phone: customer.phone },
          items: quote.lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            productSlug: line.productSlug,
            productName: line.productName,
            variantLabel: line.variantLabel,
            sku: skuOf(line.variantId),
            unitPricePaise: line.unitPricePaise,
            quantity: line.quantity,
            lineTotalPaise: line.lineTotalPaise,
          })),
          subtotalPaise: quote.subtotalPaise,
          deliveryFeePaise: quote.deliveryFeePaise,
          totalPaise: quote.totalPaise,
          shippingAddress,
          paymentMethod: input.paymentMethod,
          note: input.note ?? null,
          idempotencyKey: input.idempotencyKey,
          history: [{ status: "PLACED", by: customerId }],
        },
        session,
      );
    });

    logger.info({ orderNumber: order.orderNumber, totalPaise: order.totalPaise }, "Order placed");
    return toOrder(order);
  },

  async listMine(customerId: string, query: OrderListQuery): Promise<Paginated<OrderSummary>> {
    const [rows, total] = await orderRepository.list(query, customerId);
    return paginate(rows, total, query);
  },

  async getMine(customerId: string, orderId: string): Promise<Order> {
    const order = await orderRepository.findOne(orderId, customerId);
    if (!order) throw AppError.notFound("Order");
    return toOrder(order);
  },

  /** Customers may cancel only early orders. Stock goes back on the shelf in the same transaction. */
  async cancelMine(customerId: string, orderId: string): Promise<Order> {
    return withTransaction(async (session) => {
      const order = await orderRepository.findForUpdate(orderId, session, customerId);
      if (!order) throw AppError.notFound("Order");
      if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status as OrderStatus)) {
        throw AppError.conflict("CANNOT_CANCEL", "This order is already on its way and can no longer be cancelled.");
      }
      order.status = "CANCELLED";
      order.history.push({ status: "CANCELLED", note: "Cancelled by customer", by: customerId });
      await returnOrderStock(order, session);
      await order.save({ session });
      return toOrder(order.toObject() as OrderRecord);
    });
  },

  // ---------- Admin ----------

  async list(query: OrderListQuery): Promise<Paginated<OrderSummary>> {
    const [rows, total] = await orderRepository.list(query);
    return paginate(rows, total, query);
  },

  async get(orderId: string): Promise<Order> {
    const order = await orderRepository.findOne(orderId);
    if (!order) throw AppError.notFound("Order");
    return toOrder(order);
  },

  /** Moves an order along the state machine in ORDER_STATUS_TRANSITIONS, and nowhere else. */
  async updateStatus(orderId: string, { status, note }: UpdateOrderStatusInput, adminId: string): Promise<Order> {
    return withTransaction(async (session) => {
      const order = await orderRepository.findForUpdate(orderId, session);
      if (!order) throw AppError.notFound("Order");

      const current = order.status as OrderStatus;
      if (!ORDER_STATUS_TRANSITIONS[current].includes(status)) {
        throw AppError.conflict("INVALID_STATUS_CHANGE", `An order that is ${current} cannot become ${status}.`);
      }

      order.status = status;
      order.history.push({ status, note: note ?? null, by: adminId });
      if (status === "CANCELLED") await returnOrderStock(order, session);
      // Cash on delivery is collected when the order is handed over.
      if (status === "DELIVERED" && order.paymentMethod === "COD") order.paymentStatus = "PAID";

      await order.save({ session });
      return toOrder(order.toObject() as OrderRecord);
    });
  },
};
