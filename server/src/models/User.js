import mongoose from 'mongoose';

export const ROLES = ['creator', 'manager', 'reviewer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'creator' },
    orgId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);