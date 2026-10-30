import {
  addressInputSchema,
  addressParamSchema,
  updateProfileSchema,
  type AddressInput,
  type UpdateProfileInput,
} from "@agri/shared";
import { Router, type Response } from "express";
import { sendOk } from "../../common/http/response";
import { currentUser, requireAuth } from "../../common/middleware/auth";
import { validate } from "../../common/middleware/validate";
import { customerService } from "./customer.service";

// Mounted at /api/v1/customers. Every route is "me" only — there is deliberately no
// /customers/:id, so one customer cannot address another's record at all.
export const customerRoutes = Router();

customerRoutes.use(requireAuth);

customerRoutes.get("/me", async (_req, res) => sendOk(res, await customerService.getProfile(currentUser(res).id)));

customerRoutes.patch("/me", validate(updateProfileSchema), async (_req, res) =>
  sendOk(res, await customerService.updateProfile(currentUser(res).id, res.locals.body as UpdateProfileInput)),
);

customerRoutes.post("/me/addresses", validate(addressInputSchema), async (_req, res) =>
  sendOk(res, await customerService.addAddress(currentUser(res).id, res.locals.body as AddressInput), 201),
);

const byAddress = validate(addressParamSchema, "params");
const addressIdOf = (res: Response) => (res.locals.params as { addressId: string }).addressId;

customerRoutes.patch("/me/addresses/:addressId", byAddress, validate(addressInputSchema), async (_req, res) =>
  sendOk(res, await customerService.updateAddress(currentUser(res).id, addressIdOf(res), res.locals.body as AddressInput)),
);

customerRoutes.delete("/me/addresses/:addressId", byAddress, async (_req, res) =>
  sendOk(res, await customerService.removeAddress(currentUser(res).id, addressIdOf(res))),
);
