import List from '../models/List.js';
import Card from '../models/Card.js';

// @desc    Create a new list on a board
// @route   POST /api/lists
// @access  Private
const createList = async (req, res) => {
  try {
    const { title, board } = req.body;

    if (!title || !board) {
      return res.status(400).json({ message: 'Title and board are required' });
    }

    // New list goes to the end of the board — find current max order, add 1
    const lastList = await List.findOne({ board }).sort({ order: -1 });
    const order = lastList ? lastList.order + 1 : 0;

    const list = await List.create({ title, board, order });
    res.status(201).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update list title or order
// @route   PUT /api/lists/:id
// @access  Private
const updateList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });

    list.title = req.body.title ?? list.title;
    list.order = req.body.order ?? list.order;
    await list.save();

    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a list and its cards
// @route   DELETE /api/lists/:id
// @access  Private
const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ message: 'List not found' });

    // Cards belonging only to this list should go too — otherwise orphaned cards remain in DB
    await Card.deleteMany({ list: list._id });
    await list.deleteOne();

    res.json({ message: 'List deleted', listId: req.params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export { createList, updateList, deleteList };