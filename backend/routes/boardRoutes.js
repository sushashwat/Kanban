import express from 'express';
import { getBoards, createBoard, getBoardById, deleteBoard, updateBoard, leaveBoard , addMember, removeMember } from '../controllers/boardController.js';
import  protect  from '../middlewares/authMiddleware.js';
import Activity from '../models/Activity.js';

const router = express.Router();

router.route('/').get(protect, getBoards).post(protect, createBoard);
router.route('/:id').get(protect, getBoardById).delete(protect, deleteBoard);
router.route('/:id').get(protect, getBoardById).delete(protect, deleteBoard).put(protect, updateBoard);
router.route('/:id/members').post(protect, addMember);
router.route('/:id/leave').post(protect,leaveBoard);
router.route('/:id/members/:memberId').delete(protect, removeMember);
router.get('/:id/activity', protect, async (req, res) => {
  try {
    const activities = await Activity.find({ board: req.params.id })
      .populate('user', 'name avatarColor')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;