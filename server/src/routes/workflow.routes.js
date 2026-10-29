import {Router} from 'express';
import {authenticate} from '../middleware/auth.js';
import * as c from '../controllers/workflow.controller.js';
const r=Router();r.use(authenticate);
r.get('/submissions',c.listSubmissions);r.post('/submissions',c.createSubmission);r.get('/submissions/:id',c.getSubmission);r.post('/submissions/:id/analyze',c.analyzeSubmission);r.patch('/submissions/:id/findings/:fid',c.updateFinding);r.post('/submissions/:id/comments',c.addComment);r.post('/submissions/:id/decision',c.decide);r.get('/audit',c.listAudit);
export default r;
