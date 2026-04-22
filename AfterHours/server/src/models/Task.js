import mongoose from 'mongoose';

/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: Task model (referenced by Dream)
=============================================================================
*
* This model stores one micro-task document per task.
* Tasks reference a dream by ObjectId, enabling:
* - task pagination,
* - independent task updates,
* - easier multi-user assignment.
*/
const taskSchema = new mongoose.Schema(
  {
    dream: { type: mongoose.Schema.Types.ObjectId, ref: 'Dream', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: 'General' },
    difficulty: { type: Number, enum: [1, 2, 3], default: 1 },
    isOffline: { type: Boolean, default: true },
    status: { type: String, enum: ['todo', 'done'], default: 'todo' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Queries we care about: dream detail page and assignee task list.
taskSchema.index({ dream: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1, updatedAt: -1 });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

export default Task;
