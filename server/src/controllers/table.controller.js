import * as tableService from '../services/table.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const createTable = async (req, res) => {
  try {
    const table = await tableService.createTable(req.body);
    return successResponse(res, table, 'Table created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const getAllTables = async (req, res) => {
  try {
    const tables = await tableService.getAllTables();
    return successResponse(res, tables, 'Tables retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const getTablesByFloor = async (req, res) => {
  try {
    const { floorId } = req.params;
    const tables = await tableService.getTablesByFloor(floorId);
    return successResponse(res, tables, 'Tables retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await tableService.updateTable(id, req.body);
    return successResponse(res, table, 'Table updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await tableService.deleteTable(id);
    return successResponse(res, result, 'Table deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};
