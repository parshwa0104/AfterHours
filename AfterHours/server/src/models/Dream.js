import mongoose from 'mongoose';

/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: Dream model (multi-user collaboration)
=============================================================================
*
* Why references instead of embedding all tasks?
* - A dream can grow to many tasks over time (potentially unbounded array).
* - Referencing tasks keeps dream documents small and query-friendly.
*
* Access pattern:
* - Dream list page: fetch dream metadata + collaborators.
* - Dream detail page: fetch tasks by `dream` reference.
*/
const dreamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Common access patterns: user dashboard and archived filters.
dreamSchema.index({ owner: 1, isArchived: 1, updatedAt: -1 });
dreamSchema.index({ members: 1, isArchived: 1, updatedAt: -1 });

const Dream = mongoose.models.Dream || mongoose.model('Dream', dreamSchema);

export default Dream;
