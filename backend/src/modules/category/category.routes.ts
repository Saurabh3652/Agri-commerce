import { categoryListQuerySchema, type CategoryListQuery } from "@agri/shared";
import { Router } from "express";
import { sendOk } from "../../common/http/response";
import { validate } from "../../common/middleware/validate";
import { categoryService } from "./category.service";

// Mounted at /api/v1/categories
export const categoryRoutes = Router();

categoryRoutes.get("/", validate(categoryListQuerySchema, "query"), async (_req, res) =>
  sendOk(res, await categoryService.list(res.locals.query as CategoryListQuery)),
);
