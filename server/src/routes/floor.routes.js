import express from 'express';
import * as floorController from '../controllers/floor.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, floorController.createFloor);
router.get('/', floorController.getAllFloors);
router.get('/:id', floorController.getFloorById);
router.put('/:id', authMiddleware, floorController.updateFloor);
router.delete('/:id', authMiddleware, floorController.deleteFloor);

export default router;
