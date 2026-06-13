import prisma from '../config/database.js';

export const createKitchenOrder = async (orderId, orderItemId, productId) => {
  const kitchenOrder = await prisma.kitchenOrder.create({
    data: {
      orderId,
      orderItemId,
      productId,
      status: 'TO_COOK',
    },
    include: {
      product: {
        select: { id: true, name: true },
      },
      order: {
        select: { id: true, orderNumber: true, tableId: true },
      },
    },
  });

  return kitchenOrder;
};

export const getAllKitchenOrders = async (status = null) => {
  const where = status ? { status } : {};

  const orders = await prisma.kitchenOrder.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true },
      },
      order: {
        select: { id: true, orderNumber: true, tableId: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return orders;
};

export const getKitchenOrdersByOrder = async (orderId) => {
  const orders = await prisma.kitchenOrder.findMany({
    where: { orderId },
    include: {
      product: {
        select: { id: true, name: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
    },
  });

  return orders;
};

export const updateKitchenOrderStatus = async (id, status) => {
  const kitchenOrder = await prisma.kitchenOrder.update({
    where: { id },
    data: { status },
    include: {
      product: {
        select: { id: true, name: true },
      },
      order: {
        select: { id: true, orderNumber: true },
      },
    },
  });

  return kitchenOrder;
};

export const assignKitchenOrder = async (id, userId) => {
  const kitchenOrder = await prisma.kitchenOrder.update({
    where: { id },
    data: { assignedToId: userId },
    include: {
      assignedTo: {
        select: { id: true, name: true },
      },
      product: {
        select: { id: true, name: true },
      },
    },
  });

  return kitchenOrder;
};

export const completeKitchenOrder = async (id) => {
  const kitchenOrder = await prisma.kitchenOrder.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      isItemCompleted: true,
    },
    include: {
      product: {
        select: { id: true, name: true },
      },
      order: {
        select: { id: true, orderNumber: true },
      },
    },
  });

  return kitchenOrder;
};
