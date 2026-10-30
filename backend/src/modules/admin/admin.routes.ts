import {
  adminProductListQuerySchema,
  deliveryAreaInputSchema,
  idParamSchema,
  orderListQuerySchema,
  pincodeParamSchema,
  productInputSchema,
  storeConfigSchema,
  updateOrderStatusSchema,
  type AdminProductListQuery,
  type DeliveryAreaInput,
  type OrderListQuery,
  type ProductInput,
  type StoreConfig,
  type UpdateOrderStatusInput,
} from "@agri/shared";
import { Router, type Response } from "express";
import { sendOk } from "../../common/http/response";
import { currentUser, requireAuth, requireRole } from "../../common/middleware/auth";
import { validate } from "../../common/middleware/validate";
import { orderService } from "../order/order.service";
import { productService } from "../product/product.service";
import { storeService } from "../store/store.service";
import { adminService } from "./admin.service";

// Mounted at /api/v1/admin. The role check runs once here, before every route below,
// so no admin route can be added without it.
export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole("ADMIN"));

const idOf = (res: Response) => (res.locals.params as { id: string }).id;
const pincodeOf = (res: Response) => (res.locals.params as { pincode: string }).pincode;
const byId = validate(idParamSchema, "params");
const byPincode = validate(pincodeParamSchema, "params");

adminRoutes.get("/dashboard", async (_req, res) => sendOk(res, await adminService.dashboard()));

// Orders
adminRoutes.get("/orders", validate(orderListQuerySchema, "query"), async (_req, res) =>
  sendOk(res, await orderService.list(res.locals.query as OrderListQuery)),
);
adminRoutes.get("/orders/:id", byId, async (_req, res) => sendOk(res, await orderService.get(idOf(res))));
adminRoutes.patch("/orders/:id/status", byId, validate(updateOrderStatusSchema), async (_req, res) =>
  sendOk(res, await orderService.updateStatus(idOf(res), res.locals.body as UpdateOrderStatusInput, currentUser(res).id)),
);

// Products
adminRoutes.get("/products", validate(adminProductListQuerySchema, "query"), async (_req, res) =>
  sendOk(res, await productService.listForAdmin(res.locals.query as AdminProductListQuery)),
);
adminRoutes.get("/products/:id", byId, async (_req, res) => sendOk(res, await productService.getForAdmin(idOf(res))));
adminRoutes.post("/products", validate(productInputSchema), async (_req, res) =>
  sendOk(res, await productService.save(null, res.locals.body as ProductInput), 201),
);
adminRoutes.put("/products/:id", byId, validate(productInputSchema), async (_req, res) =>
  sendOk(res, await productService.save(idOf(res), res.locals.body as ProductInput)),
);

// Store rules and delivery areas
adminRoutes.get("/store/config", async (_req, res) => sendOk(res, await storeService.getConfig()));
adminRoutes.put("/store/config", validate(storeConfigSchema), async (_req, res) =>
  sendOk(res, await storeService.updateConfig(res.locals.body as StoreConfig)),
);
adminRoutes.get("/store/delivery-areas", async (_req, res) => sendOk(res, await storeService.listAreas()));
adminRoutes.put("/store/delivery-areas/:pincode", byPincode, validate(deliveryAreaInputSchema), async (_req, res) =>
  sendOk(res, await storeService.saveArea(pincodeOf(res), res.locals.body as DeliveryAreaInput)),
);
adminRoutes.delete("/store/delivery-areas/:pincode", byPincode, async (_req, res) => {
  await storeService.deleteArea(pincodeOf(res));
  sendOk(res, { deleted: true });
});
