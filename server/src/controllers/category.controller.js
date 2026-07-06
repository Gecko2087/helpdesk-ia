import { createCategory, listCategories, updateCategory } from "../services/category.service.js";

export async function listCategoriesController(_req, res, next) {
  try {
    const categories = await listCategories();
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategoryController(req, res, next) {
  try {
    const category = await createCategory(req.body);
    res.status(201).json({ data: category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryController(req, res, next) {
  try {
    const category = await updateCategory(Number(req.params.id), req.body);
    res.json({ data: category });
  } catch (error) {
    next(error);
  }
}
