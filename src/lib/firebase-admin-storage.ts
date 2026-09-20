import "server-only";

import { randomUUID } from "crypto";
import { getStorage } from "firebase-admin/storage";
import { getFirebaseAdminApp, isFirebaseAdminConfigured } from "./firebase-admin";

/**
 * Server-only Firebase Storage helpers (Admin SDK).
 * Image *bytes* live here; Firestore only keeps the resulting `imageUrl`.
 */
type AdminBucket = ReturnType<ReturnType<typeof getStorage>["bucket"]>;

const DEFAULT_CONTENT_TYPE = "image/jpeg";
const UPLOAD_CACHE_CONTROL = "public, max-age=31536000, immutable";

function normalizeBucketName(raw: string): string {
  return raw.replace(/^gs:\/\//, "").replace(/\/+$/, "");
}

/** Configured bucket first, then the alternate host for the same project. */
function bucketNames(): string[] {
  const configured = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  const names: string[] = [];
  if (configured) names.push(normalizeBucketName(configured));
  if (projectId) {
    names.push(`${projectId}.firebasestorage.app`);
    names.push(`${projectId}.appspot.com`);
  }
  return [...new Set(names.filter(Boolean))];
}

/** True only when Admin credentials *and* a bucket are available. */
export function isAdminStorageConfigured(): boolean {
  return isFirebaseAdminConfigured() && bucketNames().length > 0;
}

let warnedUnavailable = false;
const bucketCache = new Map<string, AdminBucket>();

function getBuckets(): AdminBucket[] {
  const app = getFirebaseAdminApp();
  const names = app ? bucketNames() : [];
  if (!app || names.length === 0) {
    if (!warnedUnavailable) {
      warnedUnavailable = true;
      console.warn(
        "[admin-storage] unavailable (missing FIREBASE_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS or storage bucket) — images will not be cached"
      );
    }
    return [];
  }

  const storage = getStorage(app);
  return names.map((name) => {
    const cached = bucketCache.get(name);
    if (cached) return cached;
    const bucket = storage.bucket(name);
    bucketCache.set(name, bucket);
    return bucket;
  });
}

/** Firebase download URL (works with uniform bucket-level access). */
function downloadUrl(bucket: string, path: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
    path
  )}?alt=media&token=${token}`;
}

function publicUrl(bucket: string, path: string): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `https://storage.googleapis.com/${bucket}/${encoded}`;
}

function readDownloadToken(metadata: {
  metadata?: Record<string, unknown> | null;
}): string | null {
  const raw = metadata.metadata?.["firebaseStorageDownloadTokens"];
  if (typeof raw !== "string" || !raw) return null;
  return raw.split(",")[0] || null;
}

/** Existing object URL, or null when it isn't stored yet / Storage is unavailable. */
export async function getStoredImageUrl(path: string): Promise<string | null> {
  for (const bucket of getBuckets()) {
    try {
      const [metadata] = await bucket.file(path).getMetadata();
      const token = readDownloadToken(metadata);
      return token
        ? downloadUrl(bucket.name, path, token)
        : publicUrl(bucket.name, path);
    } catch {
      // Missing object / wrong bucket — try the next candidate.
    }
  }
  return null;
}

/** Upload image bytes and return a stable download URL (null when unavailable). */
export async function uploadImageBuffer(
  path: string,
  buffer: Buffer,
  contentType = DEFAULT_CONTENT_TYPE
): Promise<string | null> {
  const buckets = getBuckets();
  if (buckets.length === 0) return null;

  const token = randomUUID();
  let lastError: unknown = null;

  for (const bucket of buckets) {
    try {
      await bucket.file(path).save(buffer, {
        contentType,
        resumable: false,
        metadata: {
          contentType,
          cacheControl: UPLOAD_CACHE_CONTROL,
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      return downloadUrl(bucket.name, path, token);
    } catch (error) {
      lastError = error;
    }
  }

  console.warn(`[admin-storage] upload failed for ${path}`, lastError);
  return null;
}
