const configuredBase = (import.meta.env.VITE_API_BASE || "").trim();
const inferredBase = `${window.location.protocol}//${window.location.hostname}:8888`;

const fallbackBases =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? ["http://localhost:8888", "http://127.0.0.1:8888"]
    : [];

const API_BASES = Array.from(
  new Set([configuredBase, inferredBase, ...fallbackBases].filter(Boolean))
);
const PRIMARY_API_BASE = API_BASES[0];

/* ── Simple in-memory cache ── */
const _cache = new Map();

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  // Cache TTL: 5 minutes
  if (Date.now() - entry.ts > 300_000) { _cache.delete(key); return null; }
  return entry.data;
}

function setCache(key, data) {
  _cache.set(key, { data, ts: Date.now() });
}

function toQueryString(params = {}) {
  const filtered = Object.entries(params).filter(([, v]) => {
    if (v === undefined || v === null) return false;
    if (typeof v === "string" && v.trim() === "") return false;
    return true;
  });
  return new URLSearchParams(filtered).toString();
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: { ...(options.headers || {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request(path, options = {}) {
  const errors = [];
  const method = (options.method || "GET").toUpperCase();

  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const base of API_BASES) {
      try {
        const res = await fetchWithTimeout(`${base}${path}`, options);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed: ${res.status}`);
        }
        return res.json();
      } catch (err) {
        errors.push(`${base}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    if (attempt < 3) await sleep(300 * attempt);
  }

  throw new Error(`Backend unavailable after retries. ${errors.at(-1) || ""}`);
}

/* Cached request: checks cache first, stores result */
async function cachedRequest(path) {
  const cached = getCached(path);
  if (cached) return cached;
  const data = await request(path);
  setCache(path, data);
  return data;
}

export const api = {
  stats:       () => cachedRequest("/stats"),
  crops:       () => cachedRequest("/crops"),
  facets:      (crop) => cachedRequest(crop ? `/facets?crop=${encodeURIComponent(crop)}` : "/facets"),
  stressTypes: () => cachedRequest("/stress-types"),
  data:        (p) => request(`/data?${toQueryString(p)}`),
  search:      (p) => request(`/search?${toQueryString(p)}`),
  gene:        (id) => cachedRequest(`/gene/${encodeURIComponent(id)}`),
  geneTFBS:    (id) => cachedRequest(`/gene/${encodeURIComponent(id)}/tfbs`),
  geneUpstreamSequence: (id) => cachedRequest(`/gene/${encodeURIComponent(id)}/upstream-sequence`),
  tfbsDetail:  (name) => cachedRequest(`/tfbs/${encodeURIComponent(name)}`),
  predictStifal: (payload) => request("/predict/stifal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }),
  reload: async () => {
    _cache.clear(); // Invalidate cache on reload
    const res = await fetch(`${PRIMARY_API_BASE}/reload`, { method: "POST" });
    if (!res.ok) throw new Error(`Reload failed: ${res.status}`);
    return res.json();
  },
  downloadCropUrl:     (crop)   => `${PRIMARY_API_BASE}/download/${encodeURIComponent(crop)}`,
  downloadFilteredUrl: (params) => `${PRIMARY_API_BASE}/download?${toQueryString(params)}`,
};
