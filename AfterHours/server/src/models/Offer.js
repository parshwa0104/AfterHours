import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'General' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'in-progress', 'closed'], default: 'open' },
  },
  { timestamps: true },
);

const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema);

export default Offer;
