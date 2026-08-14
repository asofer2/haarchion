import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/** Current Firebase Auth uid if signed in with a real account (not anonymous) */
export function getSignedInUid(): string | null {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user || user.isAnonymous) return null;
  return user.uid;
}

/**
 * Ensure a Google (or other non-anonymous) Firebase Auth session exists,
 * auth state has finished restoring, and an ID token is available for
 * Firestore / Storage (`request.auth`).
 * Returns uid, or null if the user is not signed in.
 */
export async function ensureFirebaseSignedIn(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  const auth = getFirebaseAuth();
  if (!auth) return null;

  // Wait until IndexedDB session restore finishes — do not trust a brief
  // null currentUser / first onAuthStateChanged before restoration.
  await auth.authStateReady();

  const user = auth.currentUser;
  if (!user || user.isAnonymous) return null;

  try {
    // Attach a fresh token so cloud writes are not sent unauthenticated
    await user.getIdToken(/* forceRefresh */ false);
  } catch {
    try {
      await user.getIdToken(true);
    } catch {
      return null;
    }
  }

  return user.uid;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase לא מוגדר — חסרים משתני סביבה.");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";

    // Popup blocked — fall back to full-page redirect
    if (code === "auth/popup-blocked") {
      await signInWithRedirect(auth, googleProvider);
      return new Promise(() => undefined);
    }

    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      throw new Error("חלון ההתחברות נסגר לפני הסיום.");
    }

    if (code === "auth/unauthorized-domain") {
      throw new Error(
        "הדומיין לא מורשה ב-Firebase. הוסיפו אותו ב-Authentication → Settings → Authorized domains."
      );
    }
    if (code === "auth/operation-not-allowed") {
      const projectId =
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tamir-web";
      throw new Error(
        `כניסת Google עדיין כבויה בפרויקט ${projectId}. פתחו Firebase Console → Authentication → Sign-in providers → Google → Enable → Save. קישור ישיר: https://console.firebase.google.com/project/${projectId}/authentication/providers`
      );
    }

    throw error instanceof Error
      ? error
      : new Error("התחברות עם Google נכשלה");
  }
}

/** Call once on app load to finish redirect-based Google sign-in */
export async function completeGoogleRedirectIfAny(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch {
    return null;
  }
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function watchFirebaseAuth(
  callback: (user: User | null) => void
): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, (user) => {
    if (user?.isAnonymous) {
      callback(null);
      return;
    }
    callback(user);
  });
}
