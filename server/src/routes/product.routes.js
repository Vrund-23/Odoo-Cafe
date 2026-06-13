import express from 'express';
import * as productController from '../controllers/product.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { createProductValidator, updateProductValidator } from '../validators/product.validator.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, validateRequest(createProductValidator), productController.createProduct);
router.get('/kds/items', productController.getKdsProducts);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', authMiddleware, validateRequest(updateProductValidator), productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

export default router;
