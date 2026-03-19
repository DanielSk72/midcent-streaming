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
