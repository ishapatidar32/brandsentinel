// In local development, Vite proxies /api to the Express server. Set VITE_API_URL only when deploying separately.
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
let token = localStorage.getItem('bs_token') || '';
export const setToken = (value) => { token = value || ''; if (token) localStorage.setItem('bs_token', token); else localStorage.removeItem('bs_token'); };
export const getToken = () => token;
export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
      body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the BrandSentinel API. Start the project from the root folder with `npm run dev` and check http://localhost:4000/api/health.');
    }
    throw error;
  }
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
