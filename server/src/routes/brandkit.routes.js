import { Router } from 'express';
import { validate } from '../utils/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import * as c from '../controllers/brandkit.controller.js';

const r = Router();

r.post(['/brandkit', '/'], authenticate, requireRole('admin'), validate(c.brandKitSchema), c.createBrandKit);
r.put(['/brand-kit', '/brandkit'], authenticate, requireRole('admin'), c.updateBrandKit);
r.get('/brand-kit', authenticate, async (req,res,next) => { try { const kit=await (await import('../models/Brandkit.js')).default.findOne({orgId:req.user.orgId,isActive:true}); if(!kit) return res.status(404).json({error:'No brand kit yet'}); const chunks=await (await import('../models/BrandChunk.js')).default.find({kitId:kit._id}); const facts=chunks.filter(c=>c.kind==='fact').map(c=>({text:c.text,effectiveDate:c.effectiveDate})); const rules=chunks.filter(c=>c.kind==='rule').map(c=>({text:c.text,section:c.section})); res.json({brandKit:{name:'Northstar Studio',toneProfile:kit.tone,tone:kit.tone,terms:kit.terms,bannedTerms:kit.terms.filter(t=>t.type==='banned').map(t=>({term:t.term,reason:t.suggest||''})),preferredTerms:kit.terms.filter(t=>t.type==='preferred').map(t=>({term:t.term,replacement:t.suggest||t.term})),disclaimers:kit.disclaimers.map(d=>d.text),facts,rules,guidelinesText:rules.map(x=>x.text).join('\n')}}); } catch(e){next(e)} });
r.get(['/brandkit', '/'], authenticate, c.getActiveKit);
r.get(['/brandkit/versions', '/versions'], authenticate, requireRole('admin'), c.listVersions);
r.get(['/brandkit/chunks', '/chunks'], authenticate, c.listChunks);
r.get(['/brandkit/chunks/:id', '/chunks/:id'], authenticate, c.getChunk);

export default r;