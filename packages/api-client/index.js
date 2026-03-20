/**
 * Cliente API compartido FixArg.
 * Expo: EXPO_PUBLIC_API_URL (http://IP:3000 o URL Vercel).
 */
function getApiBaseUrl() {
  if (typeof process !== 'undefined' && process.env) {
    const expo = process.env.EXPO_PUBLIC_API_URL;
    if (expo && String(expo).trim()) return String(expo).replace(/\/$/, '');
    const nextPublic = process.env.NEXT_PUBLIC_API_URL;
    if (nextPublic && String(nextPublic).trim()) return String(nextPublic).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}

export async function apiRequest(path, options = {}) {
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = base ? `${base}${normalized}` : normalized;
  const headers = { ...(options.headers || {}) };
  if (
    options.body != null &&
    !headers['Content-Type'] &&
    !headers['content-type']
  ) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error((data && data.error) || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Cabeceras Authorization para rutas protegidas */
export function bearerHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export { getApiBaseUrl };
