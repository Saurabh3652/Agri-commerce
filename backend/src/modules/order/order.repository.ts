import type { OrderListQuery } from "@agri/shared";
import type { ClientSession, QueryFilter } from "mongoose";
import { CounterModel, OrderModel, type OrderRecord } from "./order.model";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildQuery(query: Pick<OrderListQuery, "status" | "q">, customerId?: string): QueryFilter<OrderRecord> {
  const filter: QueryFilter<OrderRecord> = {};
  if (customerId) filter.customerId = customerId;
  if (query.status) filter.status = query.status;
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ orderNumber: pattern }, { "customer.phone": pattern }, { "customer.name": pattern }];
  }
  return filter;
}

export const orderRepository = {
  async nextOrderNumber(prefix: string, session: ClientSession) {
    const counter = await CounterModel.findOneAndUpdate(
      { _id: "order" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after", session },
    );
    return `${prefix}${String(counter.seq).padStart(6, "0")}`;
  },

  findByIdempotencyKey(customerId: string, idempotencyKey: string) {
    return OrderModel.findOne({ customerId, idempotencyKey }).lean<OrderRecord>();
  },

  async create(data: Record<string, unknown>, session: ClientSession) {
    const [order] = await OrderModel.create([data], { session });
    return order!.toObject() as OrderRecord;
  },

  /** Pass customerId to restrict the lookup to that customer's own orders. */
  findOne(id: string, customerId?: string) {
    return OrderModel.findOne({ _id: id, ...(customerId && { customerId }) }).lean<OrderRecord>();
  },

  /** Loads a live document (not lean) so the service can change and save it in a transaction. */
  findForUpdate(id: string, session: ClientSession, customerId?: string) {
    return OrderModel.findOne({ _id: id, ...(customerId && { customerId }) }).session(session);
  },

  list(query: OrderListQuery, customerId?: string) {
    const filter = buildQuery(query, customerId);
    return Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<OrderRecord[]>(),
      OrderModel.countDocuments(filter),
    ]);
  },
};
