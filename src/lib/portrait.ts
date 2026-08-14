/** Public portrait URL — multi-source resolver in /api/portrait */
export function portrait(
  name: string,
  also?: string,
  opts?: { deep?: boolean; kind?: "person" | "album" | "film" }
) {
  const params = new URLSearchParams({ name });
  if (also) params.set("also", also);
  if (opts?.deep) params.set("deep", "1");
  if (opts?.kind) params.set("kind", opts.kind);
  return `/api/portrait?${params.toString()}`;
}

/** Upgrade legacy wiki-image URLs to multi-source portrait API */
export function normalizeImageUrl(
  imageUrl: string | undefined,
  name: string,
  also?: string,
  kind?: "person" | "album" | "film"
): string | undefined {
  if (!imageUrl) return portrait(name, also, kind ? { kind } : undefined);
  if (imageUrl.startsWith("/images/")) return imageUrl;
  if (imageUrl.startsWith("data:")) return imageUrl;
  if (imageUrl.includes("/api/wiki-image"))
    return portrait(name, also, kind ? { kind } : undefined);
  if (imageUrl.includes("/api/portrait")) return imageUrl;
  return imageUrl;
}
