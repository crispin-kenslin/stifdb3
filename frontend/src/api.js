const configuredBase = (import.meta.env.VITE_API_BASE || "").trim();
const inferredBase = `${window.location.protocol}//${window.location.hostname}:8000`;

const fallbackBases =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? ["http://localhost:8000", "http://127.0.0.1:8000"]
    : [];

const API_BASES = Array.from(
  new Set([configuredBase, inferredBase, ...fallbackBases].filter(Boolean))
);
const PRIMARY_API_BASE = API_BASES[0];

function toQueryString(params = {}) {
  const filtered = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  });
  return new URLSearchParams(filtered).toString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request(path, options = {}) {
  const errors = [];
  const maxAttempts = 3;
  const method = (options.method || "GET").toUpperCase();
  const requestPath = method === "GET"
    ? `${path}${path.includes("?") ? "&" : "?"}_ts=${Date.now()}`
    : path;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    for (const base of API_BASES) {
      try {
        const res = await fetchWithTimeout(`${base}${requestPath}`, options);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed: ${res.status}`);
        }
        return res.json();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${base}: ${message}`);
      }
    }

    if (attempt < maxAttempts) {
      await sleep(300 * attempt);
    }
  }

  throw new Error(`Backend request failed after retries. ${errors[errors.length - 1] || "No response."}`);
}

export const api = {
  stats: () => request("/stats"),
  crops: () => request("/crops"),
  facets: (crop) => request(crop ? `/facets?crop=${encodeURIComponent(crop)}` : "/facets"),
  columns: (crop) => request(crop ? `/columns?crop=${encodeURIComponent(crop)}` : "/columns"),
  data: (params) => request(`/data?${toQueryString(params)}`),
  search: (params) => request(`/search?${toQueryString(params)}`),
  gene: (geneId) => request(`/gene/${encodeURIComponent(geneId)}`),
  geneTFBS: (geneId) => request(`/gene/${encodeURIComponent(geneId)}/tfbs`),
  tfbsDetail: (tfbsName) => request(`/tfbs/${encodeURIComponent(tfbsName)}`),
  reload: async () => {
    const res = await fetch(`${PRIMARY_API_BASE}/reload`, { method: 'POST' });
    if (!res.ok) throw new Error(`Reload failed: ${res.status}`);
    return res.json();
  },
  downloadCropUrl: (crop) => `${PRIMARY_API_BASE}/download/${encodeURIComponent(crop)}`,
  downloadFilteredUrl: (params) => `${PRIMARY_API_BASE}/download?${toQueryString(params)}`
};
