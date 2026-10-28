import fs from 'fs';
import BrandKit from '../models/Brandkit.js';
import BrandChunk from '../models/BrandChunk.js';
import { buildChunks } from '../services/ingestion/chunker.js';
import { embedTexts, EMBEDDING_MODEL } from '../services/ingestion/embedder.js';

// ...inside the seed script, after users:
const input = JSON.parse(fs.readFileSync(new URL('./brandkit.sample.json', import.meta.url)));
input.terms ??= []; input.disclaimers ??= []; input.facts ??= []; input.rules ??= [];

await BrandChunk.deleteMany({ orgId: 'acme' });
await BrandKit.deleteMany({ orgId: 'acme' });

const kit = new BrandKit({ orgId: 'acme', version: 1, isActive: true, tone: input.tone });
const { chunks, terms, disclaimers } = buildChunks(input, kit._id, 'acme');
const embeddable = chunks.filter((c) => c.kind === 'fact' || c.kind === 'rule');
const vectors = await embedTexts(embeddable.map((c) => c.text));
if (vectors) embeddable.forEach((c, i) => (c.embedding = vectors[i]));

kit.terms = terms;
kit.disclaimers = disclaimers;
kit.embeddingModel = vectors ? EMBEDDING_MODEL : null;
await kit.save();
await BrandChunk.insertMany(chunks);
console.log(`Seeded brand kit v1 (${chunks.length} chunks, embeddings: ${Boolean(vectors)})`);