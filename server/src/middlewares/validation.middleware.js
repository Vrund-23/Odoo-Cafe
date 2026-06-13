import { errorResponse } from '../utils/response.util.js';

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      return errorResponse(res, 'Validation failed', 400, {
        message: error.errors[0]?.message || 'Invalid request',
      });
    }
  };
};
