import prisma from '../config/database.js';

export const createProduct = async (data) => {
  const { name, categoryId, price, unitOfMeasure, tax, description, imageUrl, showInKds } = data;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  const product = await prisma.product.create({
    data: {
      name,
      categoryId,
      price,
      unitOfMeasure,
      tax,
      description,
      imageUrl,
      showInKds,
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  return product;
};

export const getAllProducts = async (limit = 50, page = 1, categoryId = null) => {
  const skip = (page - 1) * limit;

  const where = categoryId ? { categoryId } : {};

  const products = await prisma.product.findMany({
    where,
    skip,
    take: parseInt(limit),
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.product.count({ where });

  return { products, total };
};

export const getKdsProducts = async () => {
  return await prisma.product.findMany({
    where: { showInKds: true },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  return product;
};

export const updateProduct = async (id, data) => {
  const { categoryId, ...otherData } = data;

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new Error('Category not found');
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...otherData,
      ...(categoryId && { categoryId }),
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  });

  return product;
};

export const deleteProduct = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  await prisma.product.delete({
    where: { id },
  });

  return product;
};
