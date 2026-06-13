import express from 'express';
import * as sessionController from '../controllers/session.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, sessionController.createSession);
router.get('/my-open', authMiddleware, sessionController.getOpenSession);
router.get('/', authMiddleware, sessionController.getAllSessions);
router.get('/:id', authMiddleware, sessionController.getSessionById);
router.put('/:id/close', authMiddleware, sessionController.closeSession);

export default router;
