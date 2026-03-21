const prefetched = new Set<string>();

export function prefetch(url: string): void {
  if (prefetched.has(url)) return;
  prefetched.add(url);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);
}
