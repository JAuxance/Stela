/** Tiny read cache keyed on file id + md5. Drive stays authoritative; this only
 *  avoids re-downloading content we already have for the same revision. */
const cache = new Map<string, { content: string; md5?: string }>();

export function getCached(id: string, md5?: string): string | null {
  const entry = cache.get(id);
  if (entry && (!md5 || entry.md5 === md5)) return entry.content;
  return null;
}

export function setCached(id: string, content: string, md5?: string): void {
  cache.set(id, { content, md5 });
}

export function clearCache(): void {
  cache.clear();
}
