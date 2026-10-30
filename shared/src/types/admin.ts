import type { OrderStatus } from "../constants";
import type { ProductInput } from "../schemas/admin.schema";
import type { Paise } from "./common";
import type { OrderSummary } from "./order";

export type AdminDashboard = {
  todayOrders: number;
  revenue30DaysPaise: Paise;
  orders30Days: number;
  openOrders: number; // placed + confirmed + packed + shipped
  customers: number;
  ordersByStatus: { status: OrderStatus; count: number }[];
  dailySales: { date: string; revenuePaise: Paise; orders: number }[];
  topProducts: { productName: string; quantity: number; revenuePaise: Paise }[];
  lowStock: { productId: string; productName: string; variantLabel: string; stock: number }[];
  recentOrders: OrderSummary[];
};

/** Product as the admin edits it: every variant (including inactive) and the retailer price. */
export type AdminProduct = Omit<ProductInput, "variants"> & {
  id: string;
  categoryName: string;
  variants: (ProductInput["variants"][number] & { id: string })[];
  updatedAt: string;
};
