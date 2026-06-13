import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, orderController.createOrder);
router.get('/by-session/:sessionId', authMiddleware, orderController.getOrdersBySession);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.put('/:id/status', authMiddleware, orderController.updateOrderStatus);
router.post('/:id/items', authMiddleware, orderController.addItemToOrder);
router.delete('/items/:orderItemId', authMiddleware, orderController.removeItemFromOrder);
router.put('/:id/discount', authMiddleware, orderController.applyDiscount);
router.post('/:id/send-receipt', authMiddleware, orderController.sendReceipt);

export default router;
