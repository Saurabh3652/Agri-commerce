import { formatPaise, type CheckoutQuote, type QuoteLine, type Role } from "@agri/shared";
import type { ClientSession } from "mongoose";
import { productRepository } from "../product/product.repository";
import { storeService } from "../store/store.service";

type CartLine = { variantId: string; quantity: number };

/** Retailers pay the retailer price when one is set; everyone else pays the normal price. */
function priceFor(role: Role, variant: { pricePaise: number; retailerPricePaise?: number | null }) {
  return role === "RETAILER" && variant.retailerPricePaise != null ? variant.retailerPricePaise : variant.pricePaise;
}

/** The same variant added twice becomes one line with the quantities summed. */
function mergeLines(lines: CartLine[]): CartLine[] {
  const quantities = new Map<string, number>();
  for (const { variantId, quantity } of lines) quantities.set(variantId, (quantities.get(variantId) ?? 0) + quantity);
  return [...quantities].map(([variantId, quantity]) => ({ variantId, quantity }));
}

/**
 * Prices a cart from the database, never from what the browser sent, and lists every reason
 * it can't be ordered. Used for both the checkout preview and the real order, so the two
 * can never disagree.
 */
export async function priceCart(
  cartLines: CartLine[],
  role: Role,
  deliveryPincode: string | null,
  session?: ClientSession,
): Promise<CheckoutQuote> {
  const lines = mergeLines(cartLines);
  const [products, config] = await Promise.all([
    productRepository.findByVariantIds(lines.map((l) => l.variantId), session),
    storeService.getConfig(),
  ]);

  const quoteLines: QuoteLine[] = [];
  const problems: string[] = [];

  for (const line of lines) {
    const product = products.find((p) => p.variants.some((v) => v._id.toString() === line.variantId));
    const variant = product?.variants.find((v) => v._id.toString() === line.variantId);

    if (!product || !variant || !product.isActive || !variant.isActive) {
      problems.push("An item in your cart is no longer available. Please remove it.");
      continue;
    }

    const unitPricePaise = priceFor(role, variant);
    let problem: string | null = null;
    if (variant.stock <= 0) problem = "Out of stock";
    else if (line.quantity > variant.stock) problem = `Only ${variant.stock} left`;
    else if (line.quantity > config.maxQuantityPerItem) problem = `Maximum ${config.maxQuantityPerItem} per order`;
    else if (line.quantity < variant.minOrderQty) problem = `Minimum order is ${variant.minOrderQty}`;

    quoteLines.push({
      variantId: line.variantId,
      productId: product._id.toString(),
      productSlug: product.slug,
      productName: product.name,
      variantLabel: variant.label,
      icon: product.icon ?? null,
      unitPricePaise,
      quantity: line.quantity,
      lineTotalPaise: unitPricePaise * line.quantity,
      availableStock: variant.stock,
      problem,
    });
  }

  const subtotalPaise = quoteLines.reduce((sum, l) => sum + l.lineTotalPaise, 0);
  const delivery = deliveryPincode ? await storeService.checkDelivery(deliveryPincode, subtotalPaise) : null;
  const deliveryFeePaise = delivery?.serviceable ? delivery.deliveryFeePaise : 0;
  const totalPaise = subtotalPaise + deliveryFeePaise;

  if (quoteLines.some((l) => l.problem)) problems.push("Please fix the items marked in your cart.");
  if (config.minOrderPaise > 0 && subtotalPaise < config.minOrderPaise) {
    problems.push(`Minimum order value is ${formatPaise(config.minOrderPaise)}.`);
  }
  if (delivery && !delivery.serviceable) problems.push("Sorry, we do not deliver to this pincode yet.");
  if (delivery?.serviceable && !delivery.codAvailable) problems.push("Cash on delivery is not available here.");
  if (config.codMaxOrderPaise > 0 && totalPaise > config.codMaxOrderPaise) {
    problems.push(`Cash on delivery is available for orders up to ${formatPaise(config.codMaxOrderPaise)}.`);
  }

  return {
    lines: quoteLines,
    subtotalPaise,
    deliveryFeePaise,
    totalPaise,
    delivery: delivery && {
      serviceable: delivery.serviceable,
      etaDays: delivery.etaDays,
      codAvailable: delivery.codAvailable,
    },
    problems,
    canPlaceOrder: problems.length === 0 && delivery !== null && quoteLines.length > 0,
  };
}
