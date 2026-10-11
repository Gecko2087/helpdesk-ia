import { prisma } from "../config/prisma.js";
import { sandboxId } from '../middleware/sandbox.js';

export function listCategories() {
  return prisma.category.findMany({
    where: { sandboxId: sandboxId() },
    orderBy: { name: "asc" }
  });
}

export function createCategory(data) {
  return prisma.category.create({
    data: {
      ...data,
      sandboxId: sandboxId(),
      active: data.active ?? true
    }
  });
}

export function updateCategory(id, data) {
  return prisma.category.update({
    where: { id, sandboxId: sandboxId() },
    data
  });
}
