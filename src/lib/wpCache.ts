const memCache = new Map<string, unknown>();
const LS_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function lsGet<T>(url: string): T | null {
  try {
    const raw = localStorage.getItem(url);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > LS_TTL) { localStorage.removeItem(url); return null; }
    return data as T;
  } catch { return null; }
}

function lsSet(url: string, data: unknown) {
  try { localStorage.setItem(url, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

export function wpGetCached<T>(url: string): T | null {
  if (memCache.has(url)) return memCache.get(url) as T;
  const cached = lsGet<T>(url);
  if (cached) memCache.set(url, cached);
  return cached;
}

export async function wpFetch<T>(url: string): Promise<T> {
  if (memCache.has(url)) return memCache.get(url) as T;

  const cached = lsGet<T>(url);
  if (cached) { memCache.set(url, cached); return cached; }

  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`WP API error ${res.status}`);
  const data: T = await res.json();

  memCache.set(url, data);
  lsSet(url, data);
  return data;
}

// Fetch page 1 and return data + total pages from headers (for parallel pagination)
export async function wpFetchPaged<T>(url: string): Promise<{ data: T; totalPages: number }> {
  const cacheKey = url;
  if (memCache.has(cacheKey)) {
    const metaKey = `meta:${cacheKey}`;
    const totalPages = (memCache.get(metaKey) as number) ?? 1;
    return { data: memCache.get(cacheKey) as T, totalPages };
  }

  const cached = lsGet<T>(cacheKey);
  const cachedMeta = lsGet<{ totalPages: number }>(`meta:${cacheKey}`);
  if (cached && cachedMeta) {
    memCache.set(cacheKey, cached);
    memCache.set(`meta:${cacheKey}`, cachedMeta.totalPages);
    return { data: cached, totalPages: cachedMeta.totalPages };
  }

  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`WP API error ${res.status}`);
  const totalPages = parseInt(res.headers.get("X-WP-TotalPages") ?? "1", 10);
  const data: T = await res.json();

  memCache.set(cacheKey, data);
  memCache.set(`meta:${cacheKey}`, totalPages);
  lsSet(cacheKey, data);
  lsSet(`meta:${cacheKey}`, { totalPages });
  return { data, totalPages };
}
