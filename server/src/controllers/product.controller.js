import * as productService from '../services/product.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.util.js';

export const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    return successResponse(res, product, 'Product created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { limit = 50, page = 1, categoryId } = req.query;
    const { products, total } = await productService.getAllProducts(limit, page, categoryId);
    return paginatedResponse(res, products, total, page, limit, 'Products retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const getKdsProducts = async (req, res) => {
  try {
    const products = await productService.getKdsProducts();
    return successResponse(res, products, 'KDS products retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    return successResponse(res, product, 'Product retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    return successResponse(res, product, 'Product updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.deleteProduct(id);
    return successResponse(res, product, 'Product deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};
