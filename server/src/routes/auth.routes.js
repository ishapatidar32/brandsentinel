import { Router } from 'express';
import { validate } from '../utils/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { authLimiter } from '../middleware/rateLimit.js';
import * as c from '../controllers/auth.controller.js';

const r = Router();

r.post('/auth/register', authLimiter, validate(c.registerSchema), c.register);
r.post('/auth/login', authLimiter, validate(c.loginSchema), c.login);
r.get('/auth/me', authenticate, c.me);

r.get('/users', authenticate, requireRole('admin'), c.listUsers);
r.post('/users', authenticate, requireRole('admin'), validate(c.createUserSchema), c.createUser);

export default r;