import express from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { createCategoryValidator, updateCategoryValidator } from '../validators/category.validator.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, validateRequest(createCategoryValidator), categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', authMiddleware, validateRequest(updateCategoryValidator), categoryController.updateCategory);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

export default router;
