import express from 'express';
import { getBoards, createBoard, getBoardById, deleteBoard, updateBoard, leaveBoard , addMember, removeMember } from '../controllers/boardController.js';
import  protect  from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getBoards).post(protect, createBoard);
router.route('/:id').get(protect, getBoardById).delete(protect, deleteBoard);
router.route('/:id').get(protect, getBoardById).delete(protect, deleteBoard).put(protect, updateBoard);
router.route('/:id/members').post(protect, addMember);
router.route('/:id/leave').post(protect,leaveBoard);
router.route('/:id/members/:memberId').delete(protect, removeMember);

export default router;