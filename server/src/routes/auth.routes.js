import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { registerValidator, loginValidator, updateUserValidator } from '../validators/auth.validator.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', validateRequest(registerValidator), authController.register);
router.post('/login', validateRequest(loginValidator), authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/employees', authMiddleware, authController.getAllEmployees);
router.put('/profile', authMiddleware, validateRequest(updateUserValidator), authController.updateProfile);
router.delete('/employees/:id', authMiddleware, authController.removeEmployee);

export default router;
