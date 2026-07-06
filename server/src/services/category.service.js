import { prisma } from "../config/prisma.js";

export function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" }
  });
}

export function createCategory(data) {
  return prisma.category.create({
    data: {
      ...data,
      active: data.active ?? true
    }
  });
}

export function updateCategory(id, data) {
  return prisma.category.update({
    where: { id },
    data
  });
}
