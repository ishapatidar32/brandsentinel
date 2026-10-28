import mongoose from 'mongoose';
import { z } from 'zod';
import BrandKit from '../models/Brandkit.js';
import BrandChunk from '../models/BrandChunk.js';
import { buildChunks } from '../services/ingestion/chunker.js';
import { embedTexts, EMBEDDING_MODEL } from '../services/ingestion/embedder.js';

const textItem = z.object({ text: z.string().min(5), section: z.string().optional() });

export const brandKitSchema = z
  .object({
    tone: z.string().min(3),
    terms: z
      .array(z.object({
        term: z.string().min(1),
        type: z.enum(['banned', 'preferred']),
        suggest: z.string().optional(),
      }))
      .default([]),
    disclaimers: z
      .array(z.object({ text: z.string().min(5), appliesTo: z.array(z.string()).default([]) }))
      .default([]),
    facts: z.array(textItem.extend({ effectiveDate: z.coerce.date().optional() })).default([]),
    rules: z.array(textItem).default([]),
    guidelinesText: z.string().optional(),
  })
  .refine((k) => k.facts.length + k.rules.length > 0 || k.guidelinesText, {
    message: 'Provide at least one fact, rule or guidelinesText',
  });

export const createBrandKit = async (req, res) => {
  const { orgId, id: userId } = req.user;
  const last = await BrandKit.findOne({ orgId }).sort({ version: -1 });

  const kit = new BrandKit({
    orgId,
    version: (last?.version || 0) + 1,
    tone: req.body.tone,
    createdBy: userId,
    isActive: false,
  });

  const { chunks, terms, disclaimers } = buildChunks(req.body, kit._id, orgId);

  // Embed only facts and rules; terms/disclaimers are checked by plain code
  const embeddable = chunks.filter((c) => c.kind === 'fact' || c.kind === 'rule');
  const vectors = await embedTexts(embeddable.map((c) => c.text));
  if (vectors) embeddable.forEach((c, i) => (c.embedding = vectors[i]));

  kit.terms = terms;
  kit.disclaimers = disclaimers;
  kit.embeddingModel = vectors ? EMBEDDING_MODEL : null;

  try {
    await kit.save();
    await BrandChunk.insertMany(chunks);
    // Activate only after everything was saved, so a failure never leaves the org without a kit
    await BrandKit.updateMany({ orgId }, { isActive: false });
    await BrandKit.updateOne({ _id: kit._id }, { isActive: true });
  } catch (err) {
    await BrandChunk.deleteMany({ kitId: kit._id });
    await BrandKit.deleteOne({ _id: kit._id });
    throw err;
  }

  res.status(201).json({
    kitId: kit._id,
    version: kit.version,
    chunks: chunks.length,
    embedded: Boolean(vectors),
    warning: vectors ? undefined : 'Embeddings unavailable: keyword matching will be used.',
  });
};

export const getActiveKit = async (req, res) => {
  const kit = await BrandKit.findOne({ orgId: req.user.orgId, isActive: true });
  if (!kit) return res.status(404).json({ error: 'No brand kit yet' });
  res.json({ kit });
};

export const listVersions = async (req, res) => {
  const kits = await BrandKit.find({ orgId: req.user.orgId })
    .sort({ version: -1 })
    .select('version isActive createdAt embeddingModel');
  res.json({ versions: kits });
};

export const listChunks = async (req, res) => {
  const kit = await BrandKit.findOne({ orgId: req.user.orgId, isActive: true });
  if (!kit) return res.status(404).json({ error: 'No brand kit yet' });
  const chunks = await BrandChunk.find({ kitId: kit._id }).sort({ kind: 1 });
  res.json({ chunks });
};

// Used by the UI "source panel" when a finding is clicked
export const getChunk = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid chunk id' });
  }
  const chunk = await BrandChunk.findOne({ _id: req.params.id, orgId: req.user.orgId });
  if (!chunk) return res.status(404).json({ error: 'Source not found' });
  const kit = await BrandKit.findById(chunk.kitId).select('version');
  res.json({ chunk, kitVersion: kit?.version });
};