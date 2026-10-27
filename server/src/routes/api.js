import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { users, brandKit, submissions, auditEvents, addAudit, timestamp, makeId } from '../data/store.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { analyzeText } from '../services/reviewPipeline.js';
const router=Router();
const publicUser=u=>({id:u.id,name:u.name,email:u.email,role:u.role});
const findSubmission=(id)=>submissions.find(s=>s.id===id);
const visible=(s,user)=>user.role!=='creator'||s.creatorId===user.id;
function needSubmission(req,res,next){const s=findSubmission(req.params.id);if(!s)return res.status(404).json({error:'Submission not found.'});if(!visible(s,req.user))return res.status(403).json({error:'You cannot access this submission.'});req.submission=s;next();}
function audit(req,action,s,description){addAudit({actor:req.user.id,action,submissionId:s?.id||null,description:description||s?.title||''});}
router.get('/health',(req,res)=>res.json({ok:true,name:'BrandSentinel API',analysisMode:'deterministic-demo',time:timestamp()}));
router.post('/auth/login',async(req,res)=>{
 const email=String(req.body?.email||'').toLowerCase().trim(),password=String(req.body?.password||'');
 const user=users.find(u=>u.email.toLowerCase()===email);
 if(!user||!(await bcrypt.compare(password,user.passwordHash)))return res.status(401).json({error:'Email or password is incorrect.'});
 const token=jwt.sign({sub:user.id,role:user.role},env.jwtSecret,{expiresIn:'12h'});
 addAudit({actor:user.id,action:'login',description:`${user.role} signed in.`});
 res.json({token,user:publicUser(user)});
});
router.get('/auth/me',requireAuth,(req,res)=>res.json({user:req.user}));
router.use(requireAuth);
router.get('/brand-kit',(req,res)=>res.json({brandKit}));
router.put('/brand-kit',allowRoles('admin'),(req,res)=>{
 const incoming=req.body?.brandKit;if(!incoming||typeof incoming!=='object')return res.status(400).json({error:'brandKit object is required.'});
 for(const key of ['name','toneProfile'])if(typeof incoming[key]!=='string'||!incoming[key].trim())return res.status(400).json({error:`${key} is required.`});
 brandKit.name=incoming.name.trim();brandKit.toneProfile=incoming.toneProfile.trim();
 for(const key of ['facts','bannedTerms','preferredTerms','disclaimers'])if(Array.isArray(incoming[key]))brandKit[key]=incoming[key];
 brandKit.version+=1;brandKit.updatedAt=timestamp();addAudit({actor:req.user.id,action:'brand_kit_updated',description:`Updated ${brandKit.name} brand kit to version ${brandKit.version}.`});
 res.json({brandKit});
});
router.get('/submissions',(req,res)=>{
 const list=submissions.filter(s=>visible(s,req.user)).map(s=>({...s,creatorName:users.find(u=>u.id===s.creatorId)?.name||s.creatorName}));
 res.json({submissions:list});
});
router.post('/submissions',allowRoles('creator'),(req,res)=>{
 const title=String(req.body?.title||'').trim(),text=String(req.body?.text||'').trim(),contentType=String(req.body?.contentType||'social_post');
 if(title.length<2||text.length<10)return res.status(400).json({error:'Add a title and at least 10 characters of content.'});
 const created=timestamp(),id=makeId();
 const s={id,title,text,contentType,creatorId:req.user.id,creatorName:req.user.name,status:'draft',versions:[{text,createdAt:created}],findings:[],comments:[],createdAt:created,updatedAt:created};
 submissions.unshift(s);audit(req,'submission_created',s,'Created a new content submission.');res.status(201).json({submission:s});
});
router.get('/submissions/:id',needSubmission,(req,res)=>res.json({submission:req.submission}));
router.post('/submissions/:id/analyze',allowRoles('creator','admin'),needSubmission,(req,res)=>{
 const s=req.submission;if(s.status==='in_review'||s.status==='approved')return res.status(409).json({error:'This submission is locked while in review or after approval.'});
 s.findings=analyzeText(s.text);s.updatedAt=timestamp();s.status=s.status==='changes_requested'?'changes_requested':'draft';audit(req,'analysis_completed',s,`Deterministic analysis generated ${s.findings.length} findings.`);
 res.json({submission:s});
});
router.patch('/submissions/:id/findings/:findingId',allowRoles('creator'),needSubmission,(req,res)=>{
 const s=req.submission;if(s.status==='in_review'||s.status==='approved')return res.status(409).json({error:'Submission is locked while in review or after approval.'});
 const f=s.findings.find(x=>x.id===req.params.findingId);if(!f)return res.status(404).json({error:'Finding not found.'});
 const {action,editedText,dismissReason}=req.body||{};
 if(!['accepted','edited','dismissed'].includes(action))return res.status(400).json({error:'Action must be accepted, edited, or dismissed.'});
 if(action==='dismissed'&&!String(dismissReason||'').trim())return res.status(400).json({error:'A dismissal reason is required.'});
 if(action==='edited'){
  const replacement=String(editedText||'').trim();if(!replacement)return res.status(400).json({error:'Replacement text is required.'});
  // Store the creator's chosen edit and append it as a new content version; never silently claim an offset replacement succeeded.
  s.versions.push({text:s.text,createdAt:timestamp(),note:'Snapshot before finding edit'});
  if(f.start>=0&&f.end>=f.start&&f.end<=s.text.length&&f.matchedText&&s.text.slice(f.start,f.end).toLowerCase()===f.matchedText.toLowerCase()){
   s.text=s.text.slice(0,f.start)+replacement+s.text.slice(f.end);
   s.versions.push({text:s.text,createdAt:timestamp(),note:'Creator edited flagged text'});
  }else{
   s.text=`${s.text}\n\nSuggested revision: ${replacement}`;
   s.versions.push({text:s.text,createdAt:timestamp(),note:'Creator added suggested revision'});
  }
 }
 f.action=action;f.dismissReason=action==='dismissed'?String(dismissReason).trim():undefined;f.actionBy=req.user.id;f.actionAt=timestamp();s.updatedAt=timestamp();
 audit(req,`finding_${action}`,s,action==='dismissed'?`Dismissed a finding: ${f.dismissReason}`:`${action} finding: ${f.title}`);
 res.json({submission:s});
});
router.post('/submissions/:id/submit',allowRoles('creator'),needSubmission,(req,res)=>{
 const s=req.submission;if(s.status==='approved')return res.status(409).json({error:'Approved submissions cannot be resubmitted.'});
 if(!s.findings.length)return res.status(400).json({error:'Run analysis before submitting for review.'});
 const unresolved=s.findings.filter(f=>!f.action);if(unresolved.length)return res.status(400).json({error:`Resolve, accept, or dismiss all findings first (${unresolved.length} remaining).`});
 s.status='in_review';s.updatedAt=timestamp();audit(req,'submitted_for_review',s,'Submitted content for reviewer approval.');res.json({submission:s});
});
router.post('/submissions/:id/comments',allowRoles('reviewer','admin'),needSubmission,(req,res)=>{
 const text=String(req.body?.text||'').trim();if(!text)return res.status(400).json({error:'Comment cannot be empty.'});
 const comment={id:randomUUID(),authorId:req.user.id,authorName:req.user.name,text,createdAt:timestamp()};req.submission.comments.push(comment);req.submission.updatedAt=timestamp();audit(req,'comment_added',req.submission,'Added reviewer feedback.');res.status(201).json({comment,submission:req.submission});
});
router.post('/submissions/:id/decision',allowRoles('reviewer','admin'),needSubmission,(req,res)=>{
 const s=req.submission;const decision=req.body?.decision;
 if(s.status!=='in_review')return res.status(409).json({error:'Only submissions in review can receive a decision.'});
 if(!['approved','changes_requested'].includes(decision))return res.status(400).json({error:'Decision must be approved or changes_requested.'});
 const comment=String(req.body?.comment||'').trim();
 if(decision==='changes_requested'&&!comment)return res.status(400).json({error:'Please add a comment explaining the requested changes.'});
 if(comment)s.comments.push({id:randomUUID(),authorId:req.user.id,authorName:req.user.name,text:comment,createdAt:timestamp()});
 s.status=decision;s.updatedAt=timestamp();audit(req,decision,s,decision==='approved'?'Reviewer approved the submission.':`Reviewer requested changes: ${comment}`);
 res.json({submission:s});
});
router.get('/audit',(req,res)=>{
 const ids=new Set(submissions.filter(s=>visible(s,req.user)).map(s=>s.id));
 res.json({events:auditEvents.filter(e=>!e.submissionId||ids.has(e.submissionId)||req.user.role!=='creator')});
});
export default router;
