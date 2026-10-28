import { Router } from 'express';
import { validate } from '../utils/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { authLimiter } from '../middleware/rateLimit.js';
import * as c from '../controllers/auth.controller.js';
const r = Router();

r.post('/brandkit', authenticate, requireRole('admin'), validate(c.brandKitSchema), c.createBrandKit);
r.get('/brandkit', authenticate, c.getActiveKit);
r.get('/brandkit/versions', authenticate, requireRole('admin'), c.listVersions);
r.get('/brandkit/chunks', authenticate, c.listChunks);
r.get('/brandkit/chunks/:id', authenticate, c.getChunk);

export default r;