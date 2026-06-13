import express from 'express';
import * as couponController from '../controllers/coupon.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, couponController.createCoupon);
router.get('/', couponController.getAllCoupons);
router.get('/:code', couponController.getCouponByCode);
router.put('/:id', authMiddleware, couponController.updateCoupon);
router.delete('/:id', authMiddleware, couponController.deleteCoupon);
router.put('/:id/deactivate', authMiddleware, couponController.deactivateCoupon);

export default router;
