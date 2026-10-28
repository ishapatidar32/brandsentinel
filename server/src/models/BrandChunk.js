import mongoose from 'mongoose';

const brandChunkSchema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  kitId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrandKit', required: true, index: true },
  kind: { type: String, enum: ['fact', 'rule', 'term', 'disclaimer'], required: true },
  text: { type: String, required: true },
  section: String,
  effectiveDate: Date,                     // facts only
  embedding: { type: [Number], select: false }, // never sent to clients
});

export default mongoose.model('BrandChunk', brandChunkSchema);