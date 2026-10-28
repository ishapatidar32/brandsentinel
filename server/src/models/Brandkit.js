import mongoose from 'mongoose';

const termSchema = new mongoose.Schema(
  {
    term: { type: String, required: true },
    type: { type: String, enum: ['banned', 'preferred'], required: true },
    suggest: String,                       // what to use instead
    chunkId: mongoose.Schema.Types.ObjectId, // the chunk findings will cite
  },
  { _id: false }
);

const disclaimerSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    appliesTo: [String],                   // content types; empty = all
    chunkId: mongoose.Schema.Types.ObjectId,
  },
  { _id: false }
);

const brandKitSchema = new mongoose.Schema(
  {
    orgId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    isActive: { type: Boolean, default: false },
    tone: { type: String, required: true },
    terms: [termSchema],
    disclaimers: [disclaimerSchema],
    embeddingModel: { type: String, default: null }, // null = keyword fallback
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

brandKitSchema.index({ orgId: 1, version: -1 });

export default mongoose.model('BrandKit', brandKitSchema);