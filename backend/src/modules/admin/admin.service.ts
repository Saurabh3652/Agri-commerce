import { ORDER_STATUSES, type AdminDashboard, type OrderStatus } from "@agri/shared";
import { toOrderSummary } from "../order/order.mapper";
import { storeService } from "../store/store.service";
import { adminRepository } from "./admin.repository";

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_DAYS = 14;
const OPEN_STATUSES: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED"];

/** "2026-10-29" for a date as seen in the store's timezone. */
const dayKey = (date: Date, timezone: string) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);

export const adminService = {
  async dashboard(): Promise<AdminDashboard> {
    const { timezone, lowStockThreshold } = await storeService.getConfig();
    const now = Date.now();
    const since30Days = new Date(now - 30 * DAY_MS);
    const sinceChart = new Date(now - (CHART_DAYS + 1) * DAY_MS);

    const [sales30, daily, byStatus, top, lowStock, customers, recent] = await Promise.all([
      adminRepository.salesSince(since30Days),
      adminRepository.dailySales(sinceChart, timezone),
      adminRepository.ordersByStatus(),
      adminRepository.topProducts(since30Days, 5),
      adminRepository.lowStock(lowStockThreshold, 8),
      adminRepository.countCustomers(),
      adminRepository.recentOrders(6),
    ]);

    // One entry per day, including days with no orders, so the chart has no gaps.
    const dailyByDay = new Map(daily.map((d) => [d._id, d]));
    const dailySales = Array.from({ length: CHART_DAYS }, (_, i) => {
      const date = dayKey(new Date(now - (CHART_DAYS - 1 - i) * DAY_MS), timezone);
      const day = dailyByDay.get(date);
      return { date, revenuePaise: day?.revenuePaise ?? 0, orders: day?.orders ?? 0 };
    });

    const countFor = (status: OrderStatus) => byStatus.find((s) => s._id === status)?.count ?? 0;

    return {
      todayOrders: dailySales.at(-1)?.orders ?? 0,
      revenue30DaysPaise: sales30.revenuePaise,
      orders30Days: sales30.orders,
      openOrders: OPEN_STATUSES.reduce((sum, status) => sum + countFor(status), 0),
      customers,
      ordersByStatus: ORDER_STATUSES.map((status) => ({ status, count: countFor(status) })),
      dailySales,
      topProducts: top.map((t) => ({ productName: t._id, quantity: t.quantity, revenuePaise: t.revenuePaise })),
      lowStock: lowStock.map((v) => ({
        productId: String(v._id),
        productName: v.name,
        variantLabel: v.label,
        stock: v.stock,
      })),
      recentOrders: recent.map(toOrderSummary),
    };
  },
};
