/**
 * Warm the Firebase Storage portrait cache for a few people/productions.
 *   node scripts/cache-portraits.mjs --base http://localhost:3000 --limit 10
 *   node scripts/cache-portraits.mjs --ids person-a,person-b
 *
 * Hits /api/portrait?...&personId=... so the running server does the resolve,
 * the Storage upload and the Firestore `imageUrl` write.
 * Needs FIREBASE_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS to pick ids.
 */
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BASE = (arg("--base", process.env.PORTRAIT_BASE_URL || "http://localhost:3000")).replace(/\/+$/, "");
const LIMIT = Number(arg("--limit", "10"));
const ONLY_IDS = (arg("--ids", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const COLLECTION = arg("--collection", "people");

function credential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    const parsed = JSON.parse(raw);
    if (typeof parsed.private_key === "string") {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return cert(parsed);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) return applicationDefault();
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON / GOOGLE_APPLICATION_CREDENTIALS");
  process.exit(1);
}

function needsCache(doc) {
  const url = doc.imageUrl || "";
  return !url || url.includes("/api/portrait") || url.includes("/api/wiki-image");
}

function portraitUrl(doc) {
  const isPerson = COLLECTION === "people";
  const params = new URLSearchParams({ name: isPerson ? doc.name : doc.title });
  const also = isPerson ? doc.nameOriginal : doc.originalTitle;
  if (also) params.set("also", also);
  params.set("kind", isPerson ? "person" : "film");
  params.set(isPerson ? "personId" : "productionId", doc.id);
  return `${BASE}/api/portrait?${params.toString()}`;
}

async function main() {
  initializeApp({
    credential: credential(),
    projectId:
      process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  });

  const db = getFirestore();
  const snap = await db.collection(COLLECTION).get();
  const docs = snap.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .filter((d) => (ONLY_IDS.length ? ONLY_IDS.includes(d.id) : needsCache(d)))
    .slice(0, LIMIT);

  console.log(`Caching ${docs.length} portrait(s) from ${COLLECTION} via ${BASE}`);

  for (const doc of docs) {
    const url = portraitUrl(doc);
    try {
      const res = await fetch(url, { redirect: "follow" });
      console.log(`${res.ok ? "ok " : "fail"} ${doc.id} (${res.status})`);
    } catch (error) {
      console.log(`fail ${doc.id} — ${error.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
