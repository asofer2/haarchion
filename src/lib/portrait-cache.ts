import "server-only";

import { getFirebaseAdminDb } from "./firebase-admin";
import {
  getStoredImageUrl,
  isAdminStorageConfigured,
  uploadImageBuffer,
} from "./firebase-admin-storage";
import { slugify } from "./ids";

/**
 * Portrait cache: bytes in Firebase Storage, `imageUrl` in Firestore.
 * Every helper degrades to a no-op when Admin credentials are missing.
 */
export type PortraitTarget = {
  personId?: string | null;
  productionId?: string | null;
  query: string;
  also?: string | null;
  kind?: string | null;
};

const URL_TTL_MS = 1000 * 60 * 60 * 12;
const urlCache = new Map<string, { url: string | null; at: number }>();

/** Reuses the manual-upload layout (`people/{id}.jpg`) so both paths share one object. */
export function portraitStoragePath(target: PortraitTarget): string {
  if (target.personId) return `people/${target.personId}.jpg`;
  if (target.productionId) return `productions/${target.productionId}.jpg`;
  const slug = slugify([target.query, target.also].filter(Boolean).join(" ")).slice(
    0,
    80
  );
  return `portraits/${target.kind ? `${target.kind}-` : ""}${slug}.jpg`;
}

/** Storage URL for an already-cached portrait, or null when it must be resolved. */
export async function getCachedPortraitUrl(path: string): Promise<string | null> {
  if (!isAdminStorageConfigured()) return null;

  const hit = urlCache.get(path);
  if (hit && Date.now() - hit.at < URL_TTL_MS) return hit.url;

  const url = await getStoredImageUrl(path);
  urlCache.set(path, { url, at: Date.now() });
  return url;
}

/** Upload freshly resolved bytes and persist the URL on the entity document. */
export async function cachePortrait(
  path: string,
  buffer: Buffer,
  contentType: string,
  target: PortraitTarget
): Promise<string | null> {
  if (!isAdminStorageConfigured()) return null;

  const url = await uploadImageBuffer(path, buffer, contentType);
  if (!url) return null;

  urlCache.set(path, { url, at: Date.now() });
  await persistImageUrl(target, url);
  return url;
}

/** Write `imageUrl` onto an existing person/production doc — never creates one. */
async function persistImageUrl(
  target: PortraitTarget,
  url: string
): Promise<void> {
  const collection = target.personId
    ? "people"
    : target.productionId
      ? "productions"
      : null;
  const id = target.personId || target.productionId;
  if (!collection || !id) return;

  const db = getFirebaseAdminDb();
  if (!db) return;

  try {
    const ref = db.collection(collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    await ref.update({
      imageUrl: url,
      imageSource: "wiki-cache",
      imageCachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn(`[portrait-cache] could not persist ${collection}/${id}`, error);
  }
}
