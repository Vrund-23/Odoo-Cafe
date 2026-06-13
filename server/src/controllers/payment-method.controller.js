import { successResponse, errorResponse } from '../utils/response.util.js';
import * as pmService from '../services/payment-method.service.js';

export const getAllPaymentMethods = async (req, res) => {
  try {
    const methods = await pmService.getAllPaymentMethods();
    return successResponse(res, methods, 'Payment methods retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const createPaymentMethod = async (req, res) => {
  try {
    const method = await pmService.createPaymentMethod(req.body);
    return successResponse(res, method, 'Payment method created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const method = await pmService.updatePaymentMethod(id, req.body);
    return successResponse(res, method, 'Payment method updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    await pmService.deletePaymentMethod(id);
    return successResponse(res, null, 'Payment method deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};
