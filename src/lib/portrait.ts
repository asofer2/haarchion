export type PortraitOptions = {
  deep?: boolean;
  kind?: "person" | "album" | "film";
  /** מזהה ישות — מאפשר ל-API לשמור את התמונה ב-Firebase Storage */
  personId?: string;
  productionId?: string;
};

/** Public portrait URL — multi-source resolver in /api/portrait */
export function portrait(
  name: string,
  also?: string,
  opts?: PortraitOptions
) {
  const params = new URLSearchParams({ name });
  if (also) params.set("also", also);
  if (opts?.deep) params.set("deep", "1");
  if (opts?.kind) params.set("kind", opts.kind);
  if (opts?.personId) params.set("personId", opts.personId);
  if (opts?.productionId) params.set("productionId", opts.productionId);
  return `/api/portrait?${params.toString()}`;
}

/** Stored images (Firebase Storage / any remote host) are rendered as-is. */
export function isStoredImageUrl(imageUrl: string): boolean {
  return (
    /^https?:\/\//i.test(imageUrl) &&
    !imageUrl.includes("/api/portrait") &&
    !imageUrl.includes("/api/wiki-image")
  );
}

function withEntityId(url: string, opts: PortraitOptions): string {
  const param = opts.personId ? "personId" : "productionId";
  const id = opts.personId || opts.productionId;
  if (!id || url.includes(`${param}=`)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${param}=${encodeURIComponent(id)}`;
}

/**
 * Upgrade legacy wiki-image URLs to the multi-source portrait API.
 * `id` is the person/production id — passed on so the API can cache to Storage.
 */
export function normalizeImageUrl(
  imageUrl: string | undefined,
  name: string,
  also?: string,
  kind?: "person" | "album" | "film",
  id?: string
): string | undefined {
  const opts: PortraitOptions = {};
  if (kind) opts.kind = kind;
  if (id) {
    if (kind === "person") opts.personId = id;
    else opts.productionId = id;
  }

  if (!imageUrl) return portrait(name, also, opts);
  if (imageUrl.startsWith("/images/")) return imageUrl;
  if (imageUrl.startsWith("data:")) return imageUrl;
  // Firebase Storage URL (or any stored remote image) — render it directly.
  if (isStoredImageUrl(imageUrl)) return imageUrl;
  if (imageUrl.includes("/api/wiki-image")) return portrait(name, also, opts);
  if (imageUrl.includes("/api/portrait")) return withEntityId(imageUrl, opts);
  return imageUrl;
}
