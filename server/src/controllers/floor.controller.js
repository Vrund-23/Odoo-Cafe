import * as floorService from '../services/floor.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const createFloor = async (req, res) => {
  try {
    const { name } = req.body;
    const floor = await floorService.createFloor(name);
    return successResponse(res, floor, 'Floor created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const getAllFloors = async (req, res) => {
  try {
    const floors = await floorService.getAllFloors();
    return successResponse(res, floors, 'Floors retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const getFloorById = async (req, res) => {
  try {
    const { id } = req.params;
    const floor = await floorService.getFloorById(id);
    return successResponse(res, floor, 'Floor retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const updateFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const floor = await floorService.updateFloor(id, name);
    return successResponse(res, floor, 'Floor updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const deleteFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await floorService.deleteFloor(id);
    return successResponse(res, result, 'Floor deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};
