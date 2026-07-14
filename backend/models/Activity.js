import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. 'created card', 'moved card', 'added member'
    details: { type: String, default: '' },   // e.g. card/list title for context
  },
  { timestamps: true }
);

export default mongoose.model('Activity', activitySchema);