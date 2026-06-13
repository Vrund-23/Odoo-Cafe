import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/razorpay/order', authMiddleware, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', authMiddleware, paymentController.verifyRazorpayPayment);

export default router;
