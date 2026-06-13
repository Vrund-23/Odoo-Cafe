import prisma from '../config/database.js';
import { generateOrderNumber } from '../utils/order.util.js';

export const createOrder = async (data) => {
  const { sessionId, tableId, customerId, employeeId, items } = data;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  let subtotal = 0;
  let taxAmount = 0;

  const orderItems = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const unitPrice = parseFloat(product.price);
      const quantity = parseFloat(item.quantity);
      const lineTotal = unitPrice * quantity;
      const tax = (lineTotal * parseFloat(product.tax)) / 100;

      subtotal += lineTotal;
      taxAmount += tax;

      return {
        productId: item.productId,
        quantity,
        unitPrice,
        lineTotal,
        discountAmount: item.discountAmount || 0,
        promotionId: item.promotionId,
      };
    })
  );

  const total = subtotal + taxAmount;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      sessionId,
      tableId,
      customerId,
      employeeId,
      status: 'DRAFT',
      subtotal,
      taxAmount,
      discountAmount: 0,
      total,
      orderItems: {
        createMany: {
          data: orderItems,
        },
      },
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true, price: true },
          },
        },
      },
      employee: {
        select: { id: true, name: true },
      },
    },
  });

  return order;
};

export const getOrderById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true, price: true },
          },
        },
      },
      employee: {
        select: { id: true, name: true },
      },
      table: {
        select: { id: true, tableNumber: true },
      },
      customer: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
};

export const getOrdersBySession = async (sessionId, limit = 50, page = 1) => {
  const skip = (page - 1) * limit;

  const orders = await prisma.order.findMany({
    where: { sessionId },
    skip,
    take: parseInt(limit),
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true },
          },
        },
      },
      employee: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.order.count({
    where: { sessionId },
  });

  return { orders, total };
};

export const updateOrderStatus = async (orderId, status, paymentDetails = {}) => {
  const { paymentMethod, paymentReference } = paymentDetails;
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(paymentReference ? { paymentReference } : {}),
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return order;
};

export const addItemToOrder = async (orderId, productId, quantity) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const unitPrice = parseFloat(product.price);
  const qty = parseFloat(quantity);
  const lineTotal = unitPrice * qty;
  const itemTax = (lineTotal * parseFloat(product.tax)) / 100;

  const orderItem = await prisma.orderItem.create({
    data: {
      orderId,
      productId,
      quantity: qty,
      unitPrice,
      lineTotal,
      discountAmount: 0,
    },
    include: {
      product: {
        select: { id: true, name: true },
      },
    },
  });

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: { increment: lineTotal },
      taxAmount: { increment: itemTax },
      total: { increment: lineTotal + itemTax },
    },
  });

  return { orderItem, order: updatedOrder };
};

export const removeItemFromOrder = async (orderItemId) => {
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
  });

  if (!orderItem) {
    throw new Error('Order item not found');
  }

  const product = await prisma.product.findUnique({
    where: { id: orderItem.productId },
  });

  const itemTax = (orderItem.lineTotal * parseFloat(product.tax)) / 100;

  await prisma.order.update({
    where: { id: orderItem.orderId },
    data: {
      subtotal: { decrement: orderItem.lineTotal },
      taxAmount: { decrement: itemTax },
      total: { decrement: orderItem.lineTotal + itemTax },
    },
  });

  await prisma.orderItem.delete({
    where: { id: orderItemId },
  });

  return { success: true };
};

export const applyDiscount = async (orderId, discountAmount) => {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      discountAmount,
      total: { decrement: discountAmount },
    },
  });

  return order;
};
