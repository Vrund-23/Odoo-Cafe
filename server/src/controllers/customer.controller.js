import { successResponse, errorResponse } from '../utils/response.util.js';
import * as customerService from '../services/customer.service.js';

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    return successResponse(res, customers, 'Customers retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    return successResponse(res, customer, 'Customer retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const createCustomer = async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    return successResponse(res, customer, 'Customer created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerService.updateCustomer(id, req.body);
    return successResponse(res, customer, 'Customer updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await customerService.deleteCustomer(id);
    return successResponse(res, null, 'Customer deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};
