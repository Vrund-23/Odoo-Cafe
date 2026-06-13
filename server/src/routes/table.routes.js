import express from 'express';
import * as tableController from '../controllers/table.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, tableController.createTable);
router.get('/', tableController.getAllTables);
router.get('/floor/:floorId', tableController.getTablesByFloor);
router.put('/:id', authMiddleware, tableController.updateTable);
router.delete('/:id', authMiddleware, tableController.deleteTable);

export default router;
