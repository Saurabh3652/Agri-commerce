import type { Paise } from "../types/common";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** 135000 -> "₹1,350" */
export function formatPaise(paise: Paise): string {
  return inrFormatter.format(paise / 100);
}

/** For admin form inputs, which are typed in rupees: "1350.50" -> 135050. */
export function rupeesToPaise(rupees: number): Paise {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: Paise): number {
  return paise / 100;
}

export function discountPercent(pricePaise: Paise, mrpPaise: Paise): number {
  if (mrpPaise <= 0 || pricePaise >= mrpPaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
