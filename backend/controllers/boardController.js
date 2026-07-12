import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';

// @desc    Get all boards for logged-in user (owned or member of)
// @route   GET /api/boards
// @access  Private
const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name email avatarColor')
      .populate('members', 'name email avatarColor')
      .sort({ createdAt: -1 });

    res.json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
  try {
    const { title, background } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Board title is required' });
    }

    const board = await Board.create({
      title,
      background,
      owner: req.user._id,
      members: [req.user._id],
    });

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatarColor')
      .populate('members', 'name email avatarColor');

    res.status(201).json(populatedBoard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single board with its lists and cards
// @route   GET /api/boards/:id
// @access  Private
const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email avatarColor')
      .populate('members', 'name email avatarColor');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isMember = board.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view this board' });
    }

    const lists = await List.find({ board: board._id }).sort({ order: 1 });
    const cards = await Card.find({ board: board._id })
      .populate('assignedTo', 'name email avatarColor')
      .sort({ order: 1 });

    res.json({ board, lists, cards });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can delete this board' });
    }

    await List.deleteMany({ board: board._id });
    await Card.deleteMany({ board: board._id });
    await board.deleteOne();

    res.json({ message: 'Board deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export { getBoards, createBoard, getBoardById, deleteBoard };