import BrandKit from '../models/BrandKit.js';
import BrandChunk from '../models/BrandChunk.js';
import { embedTexts } from './ingestion/embedder.js';

const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};

const tokens = (s) => new Set(s.toLowerCase().match(/[a-z0-9%]+/g)?.filter((w) => w.length > 2) || []);

// Fallback when there are no embeddings: share of the query's words found in the chunk
const keywordScore = (query, text) => {
  const q = tokens(query), t = tokens(text);
  if (q.size === 0) return 0;
  let hits = 0;
  for (const w of q) if (t.has(w)) hits++;
  return hits / q.size;
};

const shape = (c, score) => ({
  id: c._id, kind: c.kind, text: c.text, section: c.section,
  effectiveDate: c.effectiveDate, score: Number(score.toFixed(3)),
});

// Top-k facts and rules for a piece of text, from the org's active kit
export async function retrieve(orgId, query, k = 3) {
  const kit = await BrandKit.findOne({ orgId, isActive: true });
  if (!kit) return [];

  const chunks = await BrandChunk.find({ kitId: kit._id, kind: { $in: ['fact', 'rule'] } })
    .select('+embedding')
    .lean();

  const queryVec = (await embedTexts([query]))?.[0];
  const useVectors = queryVec && chunks.every((c) => c.embedding?.length);

  return chunks
    .map((c) => shape(c, useVectors ? cosine(queryVec, c.embedding) : keywordScore(query, c.text)))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Fallback for the pipeline: every fact and rule, so the LLM can choose itself
export async function allEvidence(orgId) {
  const kit = await BrandKit.findOne({ orgId, isActive: true });
  if (!kit) return [];
  const chunks = await BrandChunk.find({ kitId: kit._id, kind: { $in: ['fact', 'rule'] } }).lean();
  return chunks.map((c) => shape(c, 0));
}