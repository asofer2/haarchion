import "server-only";

import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminApp, getFirebaseAdminDb } from "./firebase-admin";

export const AGENT_UID = "ishim-agent";
export const AGENT_NAME = "agent";
export const AGENT_EMAIL =
  process.env.AGENT_EMAIL?.trim() || "agent@haarchion.vercel.app";

/** Create or refresh the site login. Password lives only in AGENT_PASSWORD. */
export async function ensureAgentUser(): Promise<{
  ok: boolean;
  uid: string;
  email: string;
  reason?: string;
}> {
  const password = process.env.AGENT_PASSWORD?.trim();
  if (!password || password.length < 8) {
    return {
      ok: false,
      uid: AGENT_UID,
      email: AGENT_EMAIL,
      reason: "AGENT_PASSWORD חסר או קצר מ-8 תווים",
    };
  }
  const app = getFirebaseAdminApp();
  if (!app) {
    return {
      ok: false,
      uid: AGENT_UID,
      email: AGENT_EMAIL,
      reason: "Firebase Admin לא מוגדר",
    };
  }

  const auth = getAuth(app);
  let uid = AGENT_UID;
  try {
    await auth.getUser(AGENT_UID);
    await auth.updateUser(AGENT_UID, {
      email: AGENT_EMAIL,
      password,
      displayName: AGENT_NAME,
      emailVerified: true,
    });
  } catch {
    try {
      await auth.createUser({
        uid: AGENT_UID,
        email: AGENT_EMAIL,
        password,
        displayName: AGENT_NAME,
        emailVerified: true,
      });
    } catch {
      const existing = await auth.getUserByEmail(AGENT_EMAIL);
      uid = existing.uid;
      await auth.updateUser(uid, {
        password,
        displayName: AGENT_NAME,
        emailVerified: true,
      });
    }
  }

  const db = getFirebaseAdminDb();
  if (db) {
    await db.collection("editors").doc(uid).set(
      {
        uid,
        displayName: AGENT_NAME,
        email: AGENT_EMAIL,
        provider: "password",
        lastSeenAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  return { ok: true, uid, email: AGENT_EMAIL };
}
