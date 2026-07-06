import { Router } from "express";

import {
  createCategoryController,
  listCategoriesController,
  updateCategoryController
} from "../controllers/category.controller.js";
import { validate } from "../middleware/validate.js";
import { categorySchema } from "../validators/category.validator.js";

export const categoryRouter = Router();

categoryRouter.get("/", listCategoriesController);
categoryRouter.post("/", validate(categorySchema), createCategoryController);
categoryRouter.put("/:id", validate(categorySchema), updateCategoryController);
