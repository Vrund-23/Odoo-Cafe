import express from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, customerController.getAllCustomers);
router.post('/', authMiddleware, customerController.createCustomer);
router.get('/:id', authMiddleware, customerController.getCustomerById);
router.put('/:id', authMiddleware, customerController.updateCustomer);
router.delete('/:id', authMiddleware, customerController.deleteCustomer);

export default router;
