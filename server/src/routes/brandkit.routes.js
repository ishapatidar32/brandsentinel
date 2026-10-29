import { Router } from 'express';
import { validate } from '../utils/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import * as c from '../controllers/brandkit.controller.js';

const r = Router();

r.post(['/brandkit', '/'], authenticate, requireRole('admin'), validate(c.brandKitSchema), c.createBrandKit);
r.get(['/brandkit', '/'], authenticate, c.getActiveKit);
r.get(['/brandkit/versions', '/versions'], authenticate, requireRole('admin'), c.listVersions);
r.get(['/brandkit/chunks', '/chunks'], authenticate, c.listChunks);
r.get(['/brandkit/chunks/:id', '/chunks/:id'], authenticate, c.getChunk);