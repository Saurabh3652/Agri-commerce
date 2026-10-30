import { productListQuerySchema, type ProductListQuery } from "@agri/shared";
import { Router } from "express";
import { sendOk } from "../../common/http/response";
import { validate } from "../../common/middleware/validate";
import { productService } from "./product.service";

// Mounted at /api/v1/products
export const productRoutes = Router();

productRoutes.get("/", validate(productListQuerySchema, "query"), async (_req, res) =>
  sendOk(res, await productService.list(res.locals.query as ProductListQuery)),
);

productRoutes.get("/:slug", async (req, res) => sendOk(res, await productService.getBySlug(req.params.slug)));
