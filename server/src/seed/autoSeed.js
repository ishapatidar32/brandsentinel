import bcrypt from 'bcryptjs';
import fs from 'fs';
import User from '../models/User.js';
import BrandKit from '../models/Brandkit.js';
import BrandChunk from '../models/BrandChunk.js';
import {buildChunks} from '../services/ingestion/chunker.js';
import {embedTexts,EMBEDDING_MODEL} from '../services/ingestion/embedder.js';
export async function ensureDemoData(){
 const demo=[['Demo Creator','creator@demo.brandsentinel.test','creator'],['Demo Reviewer','reviewer@demo.brandsentinel.test','reviewer'],['Demo Admin','admin@demo.brandsentinel.test','admin']];
 for(const [name,email,role] of demo){if(!await User.exists({email})){const passwordHash=await bcrypt.hash('Demo123!',10);await User.create({name,email,role,orgId:'acme',passwordHash});}}
 if(await BrandKit.exists({orgId:'acme',isActive:true}))return;
 const input=JSON.parse(fs.readFileSync(new URL('./brandkit.sample.json',import.meta.url)));input.terms??=[];input.disclaimers??=[];input.facts??=[];input.rules??=[];
 const kit=new BrandKit({orgId:'acme',version:1,isActive:true,tone:input.tone||'Clear, helpful and evidence-led'});const {chunks,terms,disclaimers}=buildChunks(input,kit._id,'acme');const embeddable=chunks.filter(c=>['fact','rule'].includes(c.kind));const vectors=await embedTexts(embeddable.map(c=>c.text));if(vectors)embeddable.forEach((c,i)=>c.embedding=vectors[i]);kit.terms=terms;kit.disclaimers=disclaimers;kit.embeddingModel=vectors?EMBEDDING_MODEL:null;await kit.save();if(chunks.length)await BrandChunk.insertMany(chunks);console.log('Demo data initialized. Demo password: Demo123!');
}
