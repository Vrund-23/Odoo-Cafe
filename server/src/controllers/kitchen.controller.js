import * as kitchenService from '../services/kitchen.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import { emitEvent } from '../config/socket.js';

export const getAllKitchenOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await kitchenService.getAllKitchenOrders(status);
    return successResponse(res, orders, 'Kitchen orders retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const getKitchenOrdersByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await kitchenService.getKitchenOrdersByOrder(orderId);
    return successResponse(res, orders, 'Kitchen orders retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const updateKitchenOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await kitchenService.updateKitchenOrderStatus(id, status);
    emitEvent('kds:ticket-updated', { ticketId: order.orderId, status });
    return successResponse(res, order, 'Kitchen order status updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const assignKitchenOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const order = await kitchenService.assignKitchenOrder(id, userId);
    return successResponse(res, order, 'Kitchen order assigned successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const completeKitchenOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await kitchenService.completeKitchenOrder(id);
    emitEvent('kds:ticket-updated', { ticketId: order.orderId, status: 'COMPLETED' });
    return successResponse(res, order, 'Kitchen order completed successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};
