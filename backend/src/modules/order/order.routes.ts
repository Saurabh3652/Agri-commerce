import {
  checkoutQuoteSchema,
  idParamSchema,
  orderListQuerySchema,
  placeOrderSchema,
  type CheckoutQuoteInput,
  type OrderListQuery,
  type PlaceOrderInput,
} from "@agri/shared";
import { Router } from "express";
import { sendOk } from "../../common/http/response";
import { currentUser, requireAuth } from "../../common/middleware/auth";
import { validate } from "../../common/middleware/validate";
import { orderService } from "./order.service";

// Mounted at /api/v1/orders. Every route acts on the signed-in customer's own orders only;
// the customer id always comes from the session, never from the request.
export const orderRoutes = Router();

orderRoutes.use(requireAuth);

orderRoutes.post("/quote", validate(checkoutQuoteSchema), async (_req, res) => {
  sendOk(res, await orderService.quote(currentUser(res).id, res.locals.body as CheckoutQuoteInput));
});

orderRoutes.post("/", validate(placeOrderSchema), async (_req, res) => {
  sendOk(res, await orderService.place(currentUser(res).id, res.locals.body as PlaceOrderInput), 201);
});

orderRoutes.get("/", validate(orderListQuerySchema, "query"), async (_req, res) => {
  sendOk(res, await orderService.listMine(currentUser(res).id, res.locals.query as OrderListQuery));
});

orderRoutes.get("/:id", validate(idParamSchema, "params"), async (_req, res) => {
  const { id } = res.locals.params as { id: string };
  sendOk(res, await orderService.getMine(currentUser(res).id, id));
});

orderRoutes.post("/:id/cancel", validate(idParamSchema, "params"), async (_req, res) => {
  const { id } = res.locals.params as { id: string };
  sendOk(res, await orderService.cancelMine(currentUser(res).id, id));
});
