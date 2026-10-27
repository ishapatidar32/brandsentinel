import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { users } from '../data/store.js';
export function requireAuth(req,res,next){
  const raw=req.headers.authorization||'';
  const token=raw.startsWith('Bearer ')?raw.slice(7):'';
  if(!token)return res.status(401).json({error:'Sign in to continue.'});
  try{
    const payload=jwt.verify(token,env.jwtSecret);
    const user=users.find(u=>u.id===payload.sub);
    if(!user)return res.status(401).json({error:'Account not found.'});
    req.user={id:user.id,name:user.name,email:user.email,role:user.role};
    next();
  }catch{return res.status(401).json({error:'Session expired. Please sign in again.'});}
}
export function allowRoles(...roles){return (req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({error:'You do not have permission to do that.'});}
