// Read-only reporting queries for the admin dashboard.
import { CustomerModel } from "../customer/customer.model";
import { OrderModel, type OrderRecord } from "../order/order.model";
import { ProductModel } from "../product/product.model";

const notCancelled = { status: { $ne: "CANCELLED" } };

export const adminRepository = {
  async salesSince(since: Date) {
    const [row] = await OrderModel.aggregate<{ revenuePaise: number; orders: number }>([
      { $match: { createdAt: { $gte: since }, ...notCancelled } },
      { $group: { _id: null, revenuePaise: { $sum: "$totalPaise" }, orders: { $sum: 1 } } },
    ]);
    return row ?? { revenuePaise: 0, orders: 0 };
  },

  /** Revenue and order count per calendar day in the store's timezone. */
  dailySales(since: Date, timezone: string) {
    return OrderModel.aggregate<{ _id: string; revenuePaise: number; orders: number }>([
      { $match: { createdAt: { $gte: since }, ...notCancelled } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone } },
          revenuePaise: { $sum: "$totalPaise" },
          orders: { $sum: 1 },
        },
      },
    ]);
  },

  ordersByStatus() {
    return OrderModel.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  },

  topProducts(since: Date, limit: number) {
    return OrderModel.aggregate<{ _id: string; quantity: number; revenuePaise: number }>([
      { $match: { createdAt: { $gte: since }, ...notCancelled } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productName",
          quantity: { $sum: "$items.quantity" },
          revenuePaise: { $sum: "$items.lineTotalPaise" },
        },
      },
      { $sort: { revenuePaise: -1 } },
      { $limit: limit },
    ]);
  },

  lowStock(threshold: number, limit: number) {
    return ProductModel.aggregate<{ _id: unknown; name: string; label: string; stock: number }>([
      { $match: { isActive: true } },
      { $unwind: "$variants" },
      { $match: { "variants.isActive": true, "variants.stock": { $lte: threshold } } },
      { $project: { name: 1, label: "$variants.label", stock: "$variants.stock" } },
      { $sort: { stock: 1 } },
      { $limit: limit },
    ]);
  },

  countCustomers() {
    return CustomerModel.countDocuments({ role: { $ne: "ADMIN" } });
  },

  recentOrders(limit: number) {
    return OrderModel.find().sort({ createdAt: -1 }).limit(limit).lean<OrderRecord[]>();
  },
};
