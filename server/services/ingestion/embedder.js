const MODEL = process.env.EMBED_MODEL || 'gemini-embedding-001';
const BATCH = 50;

export const EMBEDDING_MODEL = MODEL;

// Returns an array of vectors, or null if embeddings are unavailable.
export async function embedTexts(texts) {
  const key = process.env.LLM_API_KEY;
  if (!key || texts.length === 0) return null;

  try {
    const vectors = [];
    for (let i = 0; i < texts.length; i += BATCH) {
      const slice = texts.slice(i, i + BATCH);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({
            requests: slice.map((t) => ({
              model: `models/${MODEL}`,
              content: { parts: [{ text: t }] },
              outputDimensionality: 768, // smaller vectors; remove if the API rejects it
            })),
          }),
        }
      );
      if (!res.ok) throw new Error(`Embedding API returned ${res.status}`);
      const data = await res.json();
      vectors.push(...data.embeddings.map((e) => e.values));
    }
    return vectors;
  } catch (err) {
    console.error('Embedding failed, using keyword fallback:', err.message);
    return null;
  }
}