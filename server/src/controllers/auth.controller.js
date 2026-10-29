import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User, { ROLES } from '../models/User.js';
import { env } from '../config/env.js';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  orgId: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createUserSchema = registerSchema.omit({ orgId: true }).extend({
  role: z.enum(ROLES),
});

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, orgId: user.orgId }, env.jwtSecret, {
    expiresIn: env.jwtExpires,
  });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, orgId: u.orgId });

// Public: always creates a creator
export const register = async (req, res, next) => {
  try {
    const { name, email, password, orgId } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, orgId, role: 'creator' });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

// Admin only: create a user with any role, inside the admin's own org
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, orgId: req.user.orgId });
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({ orgId: req.user.orgId }).sort({ createdAt: -1 });
    res.json({ users: users.map(publicUser) });
  } catch (err) {
    next(err);
  }
};

