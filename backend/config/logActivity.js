import Activity from '../models/Activity.js';

const logActivity = async (boardId, userId, action, details = '') => {
  try {
    await Activity.create({ board: boardId, user: userId, action, details });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

export default logActivity;