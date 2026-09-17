import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin singleton.
 * Prefer FIREBASE_SERVICE_ACCOUNT_JSON; otherwise ADC / GOOGLE_APPLICATION_CREDENTIALS.
 * When unset, callers should fall back to the public client SDK or a no-op health check.
 */
function parseServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount & {
      private_key?: string;
    };
    if (typeof parsed.private_key === "string") {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
  } catch {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return null;
  }
}

/** True only when Admin credentials are available (not merely a public project id). */
export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );
}

let adminApp: App | null | undefined;
let adminDb: Firestore | null | undefined;

export function getFirebaseAdminApp(): App | null {
  if (adminApp !== undefined) return adminApp;

  if (getApps().length) {
    adminApp = getApp();
    return adminApp;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const serviceAccount = parseServiceAccount();

  try {
    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId || serviceAccount.projectId,
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: projectId || undefined,
      });
    } else if (projectId) {
      // No credentials — Admin cannot talk to production Firestore.
      // Keep singleton null so callers use the public client SDK / health no-op.
      adminApp = null;
    } else {
      adminApp = null;
    }
  } catch (error) {
    console.warn("Firebase Admin init failed", error);
    adminApp = null;
  }

  return adminApp;
}

export function getFirebaseAdminDb(): Firestore | null {
  if (adminDb !== undefined) return adminDb;
  const app = getFirebaseAdminApp();
  if (!app) {
    adminDb = null;
    return null;
  }
  adminDb = getFirestore(app);
  return adminDb;
}
