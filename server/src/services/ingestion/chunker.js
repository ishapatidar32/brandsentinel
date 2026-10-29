import mongoose from 'mongoose';

// Split pasted guideline text into paragraphs; ignore tiny fragments
export const splitParagraphs = (text = '') =>
  text.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length >= 20);

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

// Turns the admin's input into chunk documents.
// Also gives each term/disclaimer a chunkId so findings can cite it later.
export function buildChunks(input, kitId, orgId) {
  const base = { orgId, kitId };
  const chunks = [];

  for (const f of input.facts) {
    const date = fmt(f.effectiveDate);
    chunks.push({
      ...base,
      kind: 'fact',
      section: f.section || 'Approved facts',
      effectiveDate: f.effectiveDate,
      text: date ? `${f.text} (effective ${date})` : f.text,
    });
  }

  for (const r of input.rules) {
    chunks.push({ ...base, kind: 'rule', section: r.section || 'Guidelines', text: r.text });
  }

  splitParagraphs(input.guidelinesText).forEach((p, i) => {
    chunks.push({ ...base, kind: 'rule', section: `Guidelines, paragraph ${i + 1}`, text: p });
  });

  const terms = input.terms.map((t) => {
    const chunkId = new mongoose.Types.ObjectId();
    const text =
      t.type === 'banned'
        ? `Do not use "${t.term}".${t.suggest ? ` Use "${t.suggest}" instead.` : ''}`
        : `Prefer "${t.term}".${t.suggest ? ` ${t.suggest}` : ''}`;
    chunks.push({ ...base, _id: chunkId, kind: 'term', section: 'Terminology', text });
    return { ...t, chunkId };
  });

  const disclaimers = input.disclaimers.map((d) => {
    const chunkId = new mongoose.Types.ObjectId();
    chunks.push({ ...base, _id: chunkId, kind: 'disclaimer', section: 'Required disclaimers', text: d.text });
    return { ...d, chunkId };
  });

  return { chunks, terms, disclaimers };
}