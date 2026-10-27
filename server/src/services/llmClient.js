/**
 * Provider adapter seam for a future hosted model.
 * This demo intentionally makes no external LLM request.
 * Keep provider credentials server-side and validate model output before using it.
 */
export const llmClient = {
  provider: 'none',
  async extractClaims() { throw new Error('No LLM provider is configured in this demo.'); },
  async verifyClaim() { throw new Error('No LLM provider is configured in this demo.'); }
};
