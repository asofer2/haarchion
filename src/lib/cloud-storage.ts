import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";
import { getFirebaseApp, isFirebaseConfigured } from "./firebase";

let storage: FirebaseStorage | null = null;

function toGsBucket(bucket: string): string {
  return bucket.startsWith("gs://") ? bucket : `gs://${bucket}`;
}

/** Resolve Storage instance; prefer configured bucket, fall back to legacy appspot.com */
export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app || !isFirebaseConfigured()) return null;
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (!bucket) return null;
  if (!storage) {
    // Explicit bucket avoids wrong default when env is present but app options lag
    storage = getStorage(app, toGsBucket(bucket));
  }
  return storage;
}

function getAlternateBucket(): string | null {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!bucket || !projectId) return null;
  if (bucket.includes(".firebasestorage.app")) {
    return `${projectId}.appspot.com`;
  }
  if (bucket.includes(".appspot.com")) {
    return `${projectId}.firebasestorage.app`;
  }
  return null;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  if (!header || data === undefined) throw new Error("Invalid image data");
  const mime = /data:(.*?);/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Map Firebase Storage / network errors to Hebrew user messages */
export function cloudUploadErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const raw = error instanceof Error ? error.message : String(error || "");

  if (
    code === "storage/unauthorized" ||
    code === "storage/unauthenticated" ||
    /unauthorized|permission|insufficient|unauthenticated/i.test(raw)
  ) {
    return "אין הרשאה להעלאת תמונה לענן — התחברו מחדש עם Google ונסו שוב.";
  }
  if (code === "storage/canceled") {
    return "העלאת התמונה בוטלה.";
  }
  if (
    code === "storage/retry-limit-exceeded" ||
    code === "storage/server-file-wrong-size" ||
    /network|fetch|timeout|timed out/i.test(raw)
  ) {
    return "העלאה לענן נכשלה בגלל בעיית רשת. בדקו חיבור ונסו שוב.";
  }
  if (code === "storage/quota-exceeded") {
    return "מכסת האחסון בענן מלאה. פנו למנהל האתר.";
  }
  if (/not configured|Storage is not configured/i.test(raw)) {
    return "Firebase Storage לא מוגדר (חסר STORAGE_BUCKET).";
  }
  if (/יש להתחבר/i.test(raw)) return raw;
  return `בעיה בהעלאה לענן: ${raw || code || "שגיאה לא ידועה"}`;
}

/** Upload a browser File/Blob to Firebase Storage and return a public download URL */
export async function uploadImageBlob(
  blob: Blob,
  path: string
): Promise<string> {
  const app = getFirebaseApp();
  const primary = getFirebaseStorage();
  if (!app || !primary) throw new Error("Firebase Storage is not configured");

  const contentType = blob.type?.startsWith("image/")
    ? blob.type
    : "image/jpeg";

  async function put(store: FirebaseStorage): Promise<string> {
    const storageRef = ref(store, path);
    await uploadBytes(storageRef, blob, { contentType });
    return getDownloadURL(storageRef);
  }

  try {
    return await put(primary);
  } catch (firstError) {
    const alt = getAlternateBucket();
    if (!alt) throw new Error(cloudUploadErrorMessage(firstError));
    try {
      const altStore = getStorage(app, toGsBucket(alt));
      const url = await put(altStore);
      // Prefer the working bucket for subsequent uploads this session
      storage = altStore;
      return url;
    } catch {
      throw new Error(cloudUploadErrorMessage(firstError));
    }
  }
}

/** If value is a data URL, upload it; otherwise return as-is */
export async function ensureCloudImageUrl(
  imageUrl: string | undefined,
  path: string
): Promise<string | undefined> {
  if (!imageUrl) return undefined;
  if (!imageUrl.startsWith("data:")) return imageUrl;
  if (!getFirebaseStorage()) return imageUrl;
  const blob = dataUrlToBlob(imageUrl);
  return uploadImageBlob(blob, path);
}
