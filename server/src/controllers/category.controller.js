import * as categoryService from '../services/category.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return successResponse(res, category, 'Category created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    return successResponse(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    return successResponse(res, category, 'Category retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);
    return successResponse(res, category, 'Category updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.deleteCategory(id);
    return successResponse(res, category, 'Category deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};
