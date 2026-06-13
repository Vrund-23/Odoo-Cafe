import * as orderService from '../services/order.service.js';
import * as kitchenService from '../services/kitchen.service.js';
import * as productService from '../services/product.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.util.js';
import { sendReceiptEmail } from '../services/email.service.js';
import prisma from '../config/database.js';
import { emitEvent } from '../config/socket.js';

export const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);

    let hasKitchenOrder = false;
    for (const item of req.body.items) {
      if (item.productId) {
        const product = await productService.getProductById(item.productId);
        if (product.showInKds) {
          await kitchenService.createKitchenOrder(
            order.id,
            order.orderItems.find(oi => oi.productId === item.productId)?.id,
            item.productId
          );
          hasKitchenOrder = true;
        }
      }
    }

    if (hasKitchenOrder) {
      emitEvent('kds:ticket-created', { orderId: order.id });
    }

    return successResponse(res, order, 'Order created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    return successResponse(res, order, 'Order retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const getOrdersBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const { orders, total } = await orderService.getOrdersBySession(sessionId, limit, page);
    return paginatedResponse(res, orders, total, page, limit, 'Orders retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, paymentReference } = req.body;
    const order = await orderService.updateOrderStatus(id, status, { paymentMethod, paymentReference });
    return successResponse(res, order, 'Order status updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const addItemToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, quantity } = req.body;
    const result = await orderService.addItemToOrder(id, productId, quantity);
    return successResponse(res, result, 'Item added to order successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const removeItemFromOrder = async (req, res) => {
  try {
    const { orderItemId } = req.params;
    const result = await orderService.removeItemFromOrder(orderItemId);
    return successResponse(res, result, 'Item removed from order successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const applyDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountAmount } = req.body;
    const order = await orderService.applyDiscount(id, discountAmount);
    return successResponse(res, order, 'Discount applied successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const sendReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body; // optional override email

    // Fetch full order with all relations
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        table: true,
        orderItems: {
          include: {
            product: { select: { id: true, name: true, price: true } },
          },
        },
      },
    });

    if (!order) {
      return errorResponse(res, 'Order not found', 404);
    }

    const toEmail = email || order.customer?.email;
    if (!toEmail) {
      return errorResponse(res, 'No email address available for this customer', 400);
    }

    const items = order.orderItems.map((oi) => ({
      name: oi.product?.name || 'Item',
      qty: Number(oi.quantity),
      unitPrice: Number(oi.unitPrice),
    }));

    const tableNumber = order.table?.tableNumber
      ? order.table.tableNumber.replace(/\D/g, '') || order.table.tableNumber
      : null;

    await sendReceiptEmail({
      to: toEmail,
      customerName: order.customer?.name || 'Customer',
      orderNumber: order.orderNumber,
      tableNumber,
      items,
      subtotal: Number(order.subtotal),
      tax: Number(order.taxAmount),
      discount: Number(order.discountAmount),
      total: Number(order.total),
      paymentMethod: order.paymentMethod || 'Cash',
      paidAt: order.updatedAt,
    });

    return successResponse(res, { sent: true, to: toEmail }, 'Receipt sent successfully');
  } catch (error) {
    console.error('sendReceipt error:', error);
    return errorResponse(res, error.message || 'Failed to send receipt', 500, error);
  }
};
