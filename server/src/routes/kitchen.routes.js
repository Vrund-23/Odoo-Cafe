import express from 'express';
import * as kitchenController from '../controllers/kitchen.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/orders', authMiddleware, kitchenController.getAllKitchenOrders);
router.get('/orders/:orderId', authMiddleware, kitchenController.getKitchenOrdersByOrder);
router.put('/orders/:id/status', authMiddleware, kitchenController.updateKitchenOrderStatus);
router.put('/orders/:id/assign', authMiddleware, kitchenController.assignKitchenOrder);
router.put('/orders/:id/complete', authMiddleware, kitchenController.completeKitchenOrder);

export default router;
