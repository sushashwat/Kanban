import Card from '../models/Card.js';
import logActivity from '../config/logActivity.js';

// @desc    Create a new card in a list
// @route   POST /api/cards
// @access  Private
const createCard = async (req, res) => {
  try {
    const { title, list, board, description, priority, dueDate } = req.body;

    if (!title || !list || !board) {
      return res.status(400).json({ message: 'Title, list and board are required' });
    }

    const lastCard = await Card.findOne({ list }).sort({ order: -1 });
    const order = lastCard ? lastCard.order + 1 : 0;

    const card = await Card.create({ title, list, board, description, priority, dueDate, order });
    await logActivity(board, req.user._id, 'created card', title);
    res.status(201).json(card);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update card details (title, description, priority, etc.)
// @route   PUT /api/cards/:id
// @access  Private
const updateCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const fields = ['title', 'description', 'priority', 'dueDate', 'assignedTo'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) card[field] = req.body[field];
    });

    await card.save();
    res.json(card);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Move a card to a new list/position (drag-and-drop persistence)
// @route   PUT /api/cards/:id/move
// @access  Private
const moveCard = async (req, res) => {
  try {
    const { destListId, destIndex } = req.body;
    const card = await Card.findById(req.params.id);
    await logActivity(card.board, req.user._id, 'moved card', card.title);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const sourceListId = card.list.toString();

    // Get all cards currently in the destination list (excluding the one we're moving), in order
    let destCards = await Card.find({
      list: destListId,
      _id: { $ne: card._id },
    }).sort({ order: 1 });

    // Insert the moving card at its new position
    destCards.splice(destIndex, 0, card);

    // Re-number every card in the destination list sequentially: 0, 1, 2...
    const bulkOps = destCards.map((c, index) => ({
      updateOne: {
        filter: { _id: c._id },
        update: { order: index, list: destListId },
      },
    }));
    if (bulkOps.length > 0) await Card.bulkWrite(bulkOps);

    // If the card moved to a DIFFERENT list, close the gap left behind in the source list
    if (sourceListId !== destListId) {
      const sourceCards = await Card.find({ list: sourceListId }).sort({ order: 1 });
      const sourceBulkOps = sourceCards.map((c, index) => ({
        updateOne: { filter: { _id: c._id }, update: { order: index } },
      }));
      if (sourceBulkOps.length > 0) await Card.bulkWrite(sourceBulkOps);
    }

    const updatedCard = await Card.findById(req.params.id);
    res.json(updatedCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a card
// @route   DELETE /api/cards/:id
// @access  Private
const deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });
    await logActivity(card.board, req.user._id, 'deleted card', card.title);
    await card.deleteOne();
    res.json({ message: 'Card deleted', cardId: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a comment to a card
// @route   POST /api/cards/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    card.comments.push({ text: text.trim(), author: req.user._id });
    await card.save();

    const updatedCard = await Card.findById(card._id)
      .populate('assignedTo', 'name email avatarColor')
      .populate('comments.author', 'name email avatarColor');

    res.status(201).json(updatedCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export { createCard, updateCard, moveCard, deleteCard, addComment };