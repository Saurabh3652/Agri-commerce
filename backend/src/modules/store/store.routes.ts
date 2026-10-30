import { pincodeParamSchema } from "@agri/shared";
import { Router } from "express";
import { sendOk } from "../../common/http/response";
import { validate } from "../../common/middleware/validate";
import { storeService } from "./store.service";

// Mounted at /api/v1/store. Public, read-only. Admin edits live under /api/v1/admin/store.
export const storeRoutes = Router();

storeRoutes.get("/config", async (_req, res) => {
  sendOk(res, await storeService.getConfig());
});

storeRoutes.get("/delivery/:pincode", validate(pincodeParamSchema, "params"), async (_req, res) => {
  const { pincode } = res.locals.params as { pincode: string };
  sendOk(res, await storeService.checkDelivery(pincode));
});
