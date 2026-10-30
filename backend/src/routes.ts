import { Router } from "express";
import { sendOk } from "./common/http/response";
import { isDatabaseConnected } from "./database/connection";
import { adminRoutes } from "./modules/admin/admin.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { categoryRoutes } from "./modules/category/category.routes";
import { contentRoutes } from "./modules/content/content.routes";
import { customerRoutes } from "./modules/customer/customer.routes";
import { orderRoutes } from "./modules/order/order.routes";
import { productRoutes } from "./modules/product/product.routes";
import { storeRoutes } from "./modules/store/store.routes";

// Every API route lives under /api/v1 so a future mobile app can stay on a fixed version.
export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  sendOk(res, { status: "ok", database: isDatabaseConnected() ? "connected" : "disconnected" });
});

// Public
apiRouter.use("/products", productRoutes);
apiRouter.use("/categories", categoryRoutes);
apiRouter.use("/content", contentRoutes);
apiRouter.use("/store", storeRoutes);

// Signed-in customers
apiRouter.use("/auth", authRoutes);
apiRouter.use("/customers", customerRoutes);
apiRouter.use("/orders", orderRoutes);

// Admins only (role checked inside)
apiRouter.use("/admin", adminRoutes);
