"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { doc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import {
  completeGoogleRedirectIfAny,
  ensureFirebaseSignedIn,
  signInWithGoogle as firebaseGoogleSignIn,
  signOutFirebase,
  watchFirebaseAuth,
} from "@/lib/firebase-session";

export interface AppUser {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  /** true when Firebase data sync is not configured */
  localMode: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LEGACY_USER_KEYS = ["ishim-editor-user-v1", "haarchion-local-user"];

function clearLegacyNameLogin() {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_USER_KEYS) localStorage.removeItem(key);
}

function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    displayName:
      user.displayName?.trim() ||
      user.email?.split("@")[0] ||
      "משתמש Google",
    email: user.email || undefined,
    photoURL: user.photoURL || undefined,
  };
}

async function rememberEditor(user: AppUser) {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    // Ensure ID token is attached before the editors write
    const uid = await ensureFirebaseSignedIn();
    if (!uid) return;
    await setDoc(
      doc(db, "editors", user.uid),
      {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email || null,
        photoURL: user.photoURL || null,
        lastSeenAt: new Date().toISOString(),
        provider: "google",
      },
      { merge: true }
    );
  } catch {
    /* offline / rules */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    clearLegacyNameLogin();

    if (!configured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void completeGoogleRedirectIfAny().then((redirectUser) => {
      if (cancelled || !redirectUser) return;
      const next = toAppUser(redirectUser);
      setUser(next);
      void rememberEditor(next);
    });

    const unsub = watchFirebaseAuth((firebaseUser) => {
      if (cancelled) return;
      if (firebaseUser) {
        const next = toAppUser(firebaseUser);
        setUser(next);
        void rememberEditor(next);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      localMode: !configured,
      async signInWithGoogle() {
        if (!configured) {
          throw new Error(
            "Firebase לא מוגדר. הוסיפו NEXT_PUBLIC_FIREBASE_* ב־.env.local."
          );
        }
        const firebaseUser = await firebaseGoogleSignIn();
        const next = toAppUser(firebaseUser);
        setUser(next);
        await rememberEditor(next);
      },
      async logout() {
        clearLegacyNameLogin();
        setUser(null);
        await signOutFirebase();
      },
    }),
    [user, loading, configured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
