import { registerUser, loginUser, getUserById, getAllUsers, updateUser, deleteUser } from '../services/auth.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.util.js';

export const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    return successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message, 401, error);
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    return successResponse(res, user, 'User profile retrieved');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const { users, total } = await getAllUsers(limit, page);
    return paginatedResponse(res, users, total, page, limit, 'Users retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await updateUser(req.userId, req.body);
    return successResponse(res, user, 'User updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await updateUser(id, req.body);
    return successResponse(res, user, 'Employee updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const removeEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await deleteUser(id);
    return successResponse(res, user, 'User archived successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};
