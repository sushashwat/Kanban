import express from 'express';
import { getBoards, createBoard, getBoardById, deleteBoard } from '../controllers/boardController.js';
import  protect  from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getBoards).post(protect, createBoard);
router.route('/:id').get(protect, getBoardById).delete(protect, deleteBoard);

export default router;