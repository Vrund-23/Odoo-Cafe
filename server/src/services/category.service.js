import prisma from '../config/database.js';

export const createCategory = async (data) => {
  const { name, color } = data;

  const existingCategory = await prisma.category.findUnique({
    where: { name },
  });

  if (existingCategory) {
    throw new Error('Category already exists');
  }

  const category = await prisma.category.create({
    data: {
      name,
      color,
    },
  });

  return category;
};

export const getAllCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      products: {
        select: { id: true, name: true },
      },
    },
  });
};

export const getCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, name: true, price: true },
      },
    },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  return category;
};

export const updateCategory = async (id, data) => {
  const { name, color } = data;

  if (name) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });
    if (existingCategory) {
      throw new Error('Category name already exists');
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name, color },
  });

  return category;
};

export const deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  await prisma.category.delete({
    where: { id },
  });

  return category;
};
