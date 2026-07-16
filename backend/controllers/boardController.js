import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';
import User from '../models/User.js';
import logActivity from '../config/logActivity.js';

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

    const [lists, cards] = await Promise.all([
      List.find({ board: board._id }).sort({ order: 1 }),
      Card.find({ board: board._id }).populate('assignedTo', 'name email avatarColor')
      .sort({ order: 1 }),
    ]);

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

// @desc    Update board title
// @route   PUT /api/boards/:id
// @access  Private
const updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const isMember = board.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to edit this board' });
    }

    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }

    board.title = title.trim();
    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatarColor')
      .populate('members', 'name email avatarColor');

    res.json(populatedBoard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a member to board by email
// @route   POST /api/boards/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { email } = req.body;

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can add members' });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    if (board.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User already a member' });
    }

    board.members.push(userToAdd._id);
    await board.save();

    await logActivity(board._id, req.user._id, 'added member', userToAdd.name);

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatarColor')
      .populate('members', 'name email avatarColor');

    res.json(populatedBoard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a board (remove yourself from members)
// @route   POST /api/boards/:id/leave
// @access  Private
const leaveBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Owner cannot leave the board. Delete it instead.' });
    }

    const isMember = board.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this board' });
    }

    board.members = board.members.filter((m) => m.toString() !== req.user._id.toString());
    await board.save();

    res.json({ message: 'Left board successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a member from board (owner only)
// @route   DELETE /api/boards/:id/members/:memberId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board owner can remove members' });
    }

    const { memberId } = req.params;

    if (memberId === board.owner.toString()) {
      return res.status(400).json({ message: 'Owner cannot be removed' });
    }

    board.members = board.members.filter((m) => m.toString() !== memberId);
    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'name email avatarColor')
      .populate('members', 'name email avatarColor');

    res.json(populatedBoard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


export { getBoards, createBoard, getBoardById, deleteBoard,  updateBoard, addMember, leaveBoard, removeMember };