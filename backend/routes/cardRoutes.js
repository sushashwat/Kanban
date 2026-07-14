import express from 'express';
import { createCard, updateCard, moveCard, deleteCard, addComment } from '../controllers/cardController.js';
import  protect  from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createCard);
router.route('/:id').put(protect, updateCard).delete(protect, deleteCard);
router.route('/:id/move').put(protect, moveCard);
router.route('/:id/comments').post(protect, addComment);

export default router;