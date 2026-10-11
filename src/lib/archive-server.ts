import "server-only";

import { unstable_cache } from "next/cache";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { mergeCloudOntoFullSeed } from "@/lib/merge-full-seed";
import { applyCatalogFixes } from "@/lib/seed-approved-cast";
import { findById } from "@/lib/ids";
import { fullSeedArchive } from "@/lib/seed-full-server";
import type { ArchiveData, Contribution, Credit, Person, Production } from "@/lib/types";

/** Firestore overlays lean/user docs onto the full ishim-backed seed. */
function hydrateFromFirestore(cloud: ArchiveData): ArchiveData {
  // fullSeedArchive() is already normalized + patched; avoid a second full pass.
  return applyCatalogFixes(mergeCloudOntoFullSeed(cloud, fullSeedArchive()));
}

export const ARCHIVE_CACHE_TAG = "archive";
export const ARCHIVE_REVALIDATE_SECONDS = 3600;

function isModerationContribution(
  c: Contribution & { isChangeRequest?: boolean }
): boolean {
  return Boolean(c.isChangeRequest) || (typeof c.id === "string" && c.id.startsWith("cr-"));
}

async function readArchiveViaAdmin(): Promise<ArchiveData | null> {
  const db = getFirebaseAdminDb();
  if (!db) return null;

  const [peopleSnap, productionsSnap, creditsSnap, contributionsSnap] =
    await Promise.all([
      db.collection("people").get(),
      db.collection("productions").get(),
      db.collection("credits").get(),
      db.collection("contributions").get(),
    ]);

  return hydrateFromFirestore({
    people: peopleSnap.docs.map((d) => d.data() as Person),
    productions: productionsSnap.docs.map((d) => d.data() as Production),
    credits: creditsSnap.docs.map((d) => d.data() as Credit),
    contributions: contributionsSnap.docs
      .map((d) => d.data() as Contribution)
      .filter((c) => !isModerationContribution(c)),
  });
}

async function readArchiveViaClientSdk(): Promise<ArchiveData> {
  const db = getFirebaseDb();
  if (!db) return fullSeedArchive();

  const [peopleSnap, productionsSnap, creditsSnap, contributionsSnap] =
    await Promise.all([
      getDocs(collection(db, "people")),
      getDocs(collection(db, "productions")),
      getDocs(collection(db, "credits")),
      getDocs(collection(db, "contributions")),
    ]);

  return hydrateFromFirestore({
    people: peopleSnap.docs.map((d) => d.data() as Person),
    productions: productionsSnap.docs.map((d) => d.data() as Production),
    credits: creditsSnap.docs.map((d) => d.data() as Credit),
    contributions: contributionsSnap.docs
      .map((d) => d.data() as Contribution)
      .filter((c) => !isModerationContribution(c)),
  });
}

/** Uncached Firestore archive read (Admin SDK preferred, public client SDK fallback). */
export async function readFirestoreArchiveServer(): Promise<ArchiveData> {
  if (!isFirebaseConfigured()) {
    return fullSeedArchive();
  }

  try {
    const viaAdmin = await readArchiveViaAdmin();
    if (viaAdmin) return viaAdmin;
  } catch (error) {
    console.warn("Admin Firestore archive read failed — trying client SDK", error);
  }

  try {
    return await readArchiveViaClientSdk();
  } catch (error) {
    console.warn("Client SDK archive read failed — using full seed", error);
    return fullSeedArchive();
  }
}

/**
 * Cached archive loader for Route Handlers / RSC.
 * Project uses the previous caching model (cacheComponents off) — see
 * `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`.
 */
export const getCachedFirestoreArchive = unstable_cache(
  async (): Promise<ArchiveData> => readFirestoreArchiveServer(),
  ["firestore-archive-v13-real-roles"],
  {
    tags: [ARCHIVE_CACHE_TAG],
    revalidate: ARCHIVE_REVALIDATE_SECONDS,
  }
);

function creditBelongsToPerson(creditPersonId: string, personId: string): boolean {
  if (creditPersonId === personId) return true;
  return creditPersonId.replace(/-w2$/i, "") === personId.replace(/-w2$/i, "");
}

/**
 * One person's filmography from the classic catalog.
 * Reads the in-process seed, not the full Firestore download, so a person
 * page can answer before the ~40MB archive route finishes.
 */
export async function getPersonFilmography(rawId: string): Promise<{
  person: Person;
  credits: Credit[];
  productions: Production[];
} | null> {
  const data = fullSeedArchive();
  const person = findById(data.people, rawId);
  if (!person) return null;

  const credits = data.credits.filter((credit) =>
    creditBelongsToPerson(credit.personId, person.id)
  );
  const productionIds = new Set(credits.map((credit) => credit.productionId));
  const productions = data.productions.filter((production) =>
    productionIds.has(production.id)
  );

  return { person, credits, productions };
}

/** Lightweight Admin/Firestore warm check for /api/ping cold-start warming. */
export async function warmFirebaseConnection(): Promise<{
  ok: boolean;
  mode: "admin" | "client" | "unset";
}> {
  if (!isFirebaseConfigured()) {
    return { ok: true, mode: "unset" };
  }

  const adminDb = getFirebaseAdminDb();
  if (adminDb) {
    await adminDb.collection("people").limit(1).get();
    return { ok: true, mode: "admin" };
  }

  const db = getFirebaseDb();
  if (!db) return { ok: true, mode: "unset" };
  await getDocs(query(collection(db, "people"), limit(1)));
  return { ok: true, mode: "client" };
}
