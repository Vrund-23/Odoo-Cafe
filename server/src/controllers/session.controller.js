import * as sessionService from '../services/session.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.util.js';

export const createSession = async (req, res) => {
  try {
    const session = await sessionService.createSession(req.userId);
    return successResponse(res, session, 'Session created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};

export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionService.getSessionById(id);
    return successResponse(res, session, 'Session retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const getOpenSession = async (req, res) => {
  try {
    const session = await sessionService.getOpenSessionByUser(req.userId);
    return successResponse(res, session, 'Open session retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 404, error);
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const { sessions, total } = await sessionService.getAllSessions(limit, page);
    return paginatedResponse(res, sessions, total, page, limit, 'Sessions retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500, error);
  }
};

export const closeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { closingAmount } = req.body;
    const session = await sessionService.closeSession(id, closingAmount);
    return successResponse(res, session, 'Session closed successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400, error);
  }
};
