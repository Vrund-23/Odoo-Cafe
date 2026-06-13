import { verifyToken } from '../utils/jwt.util.js';
import { errorResponse } from '../utils/response.util.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'No token provided', 401);
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed', 401, error);
  }
};

export const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Admin access required', 403);
    }
    next();
  } catch (error) {
    return errorResponse(res, 'Authorization failed', 403, error);
  }
};
