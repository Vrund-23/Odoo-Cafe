import express from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import sessionRoutes from './session.routes.js';
import kitchenRoutes from './kitchen.routes.js';
import floorRoutes from './floor.routes.js';
import tableRoutes from './table.routes.js';
import couponRoutes from './coupon.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/sessions', sessionRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/floors', floorRoutes);
router.use('/tables', tableRoutes);
router.use('/coupons', couponRoutes);

export default router;
