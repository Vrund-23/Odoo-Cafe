import express from 'express';
import * as pmController from '../controllers/payment-method.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', pmController.getAllPaymentMethods);
router.post('/', authMiddleware, pmController.createPaymentMethod);
router.put('/:id', authMiddleware, pmController.updatePaymentMethod);
router.delete('/:id', authMiddleware, pmController.deletePaymentMethod);

export default router;
