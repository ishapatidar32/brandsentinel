import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {env} from '../config/env.js';
import User from '../models/User.js';
import BrandKit from '../models/Brandkit.js';
import BrandChunk from '../models/BrandChunk.js';
import fs from 'fs';
import {buildChunks} from '../services/ingestion/chunker.js';
import {embedTexts,EMBEDDING_MODEL} from '../services/ingestion/embedder.js';
await mongoose.connect(env.mongoUri);
const demo=[['Demo Creator','creator@demo.brandsentinel.test','creator'],['Demo Reviewer','reviewer@demo.brandsentinel.test','reviewer'],['Demo Admin','admin@demo.brandsentinel.test','admin']];
for(const [name,email,role] of demo){const hash=await bcrypt.hash('Demo123!',10);await User.updateOne({email},{ $set:{name,email,role,orgId:'acme',passwordHash:hash}}, {upsert:true});}
const input=JSON.parse(fs.readFileSync(new URL('./brandkit.sample.json',import.meta.url)));input.terms??=[];input.disclaimers??=[];input.facts??=[];input.rules??=[];
await BrandChunk.deleteMany({orgId:'acme'});await BrandKit.deleteMany({orgId:'acme'});
const kit=new BrandKit({orgId:'acme',version:1,isActive:true,tone:input.tone||'Clear, helpful and evidence-led'});const {chunks,terms,disclaimers}=buildChunks(input,kit._id,'acme');const embeddable=chunks.filter(c=>['fact','rule'].includes(c.kind));const vectors=await embedTexts(embeddable.map(c=>c.text));if(vectors)embeddable.forEach((c,i)=>c.embedding=vectors[i]);kit.terms=terms;kit.disclaimers=disclaimers;kit.embeddingModel=vectors?EMBEDDING_MODEL:null;await kit.save();if(chunks.length)await BrandChunk.insertMany(chunks);console.log('Demo users and brand kit seeded. Password: Demo123!');await mongoose.disconnect();
