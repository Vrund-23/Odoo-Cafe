import { errorResponse } from '../utils/response.util.js';

export const errorMiddleware = (error, req, res, next) => {
  console.error('Error:', error);

  if (error.message === 'Unexpected end of JSON input') {
    return errorResponse(res, 'Invalid JSON', 400);
  }

  if (error.name === 'ValidationError') {
    return errorResponse(res, error.message, 400, error);
  }

  if (error.name === 'NotFoundError') {
    return errorResponse(res, error.message, 404);
  }

  return errorResponse(res, error.message || 'Internal server error', 500, error);
};
