import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import {
  ensureFirebaseSignedIn,
  getSignedInUid,
} from "./firebase-session";
import { ensureCloudImageUrl } from "./cloud-storage";
import { SEED } from "./seed";
import { slugify as makeSlug } from "./ids";
import { normalizeImageUrl } from "./portrait";
import { dedupeArchive, normalizePersonName } from "./dedupe";
import { ensureFilmographies } from "./filmography";
import { ensureDiscographyProductions } from "./discography-productions";
import { applyPeopleEnrichment } from "./person-dates";
import { applyDubbingStudios } from "./seed-dubbing-studios";
import { formatProductionTitle } from "./production-title";
import type {
  ArchiveData,
  Contribution,
  Credit,
  Person,
  Production,
} from "./types";

export { slugify, findById, resolveRouteId } from "./ids";

/** Firestore rejects `undefined` — strip before every write */
function stripUndefined(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefined(item))
      .filter((item) => item !== undefined);
  }
  if (value && typeof value === "object" && value.constructor === Object) {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested === undefined) continue;
      const cleaned = stripUndefined(nested);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }
  return value;
}

function asFirestoreDoc(data: object): Record<string, unknown> {
  return stripUndefined(data) as Record<string, unknown>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Persist only local deltas — never the full seed archive.
 * Old haarchion-archive-v* dumps (~1MB+ seed, often several versions)
 * routinely exceeded the ~5MB localStorage quota.
 */
const STORAGE_KEY = "haarchion-overlay-v24";
/** Background cloud sync — keep short so the UI stays responsive */
const FIRESTORE_LOAD_MS = 20_000;
const CLOUD_SAVE_MS = 20_000;
let firestoreSyncInFlight = false;
let storageBootstrapped = false;

/** In-memory cache — one Firestore/local load shared across navigation */
let memoryCache: { data: ArchiveData; at: number } | null = null;
/** Normalized seed baseline for overlay diffing (lazy) */
let seedBaseline: ArchiveData | null = null;
const MEMORY_TTL_MS = 60_000;

type LocalOverlay = {
  v: 1;
  people: Person[];
  productions: Production[];
  credits: Credit[];
  contributions: Contribution[];
  removedPersonIds: string[];
  removedProductionIds: string[];
  removedCreditKeys: string[];
};

export function invalidateArchiveCache() {
  memoryCache = null;
}

function firebaseErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code || "");
  }
  return "";
}

export function cloudSaveErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "");
  const code = firebaseErrorCode(error);
  const permissionDenied =
    code === "permission-denied" ||
    code === "storage/unauthorized" ||
    code === "storage/unauthenticated" ||
    /permission|insufficient|Missing or insufficient|unauthorized|unauthenticated/i.test(
      raw
    );

  if (permissionDenied) {
    // Client session exists but Firestore/Storage still rejected the write —
    // usually undeployed rules, not a missing Google login.
    if (getSignedInUid()) {
      return "אין הרשאה לשמירה בענן למרות שהחשבון מחובר. התנתקו, התחברו מחדש עם Google, ונסו שוב. אם זה נמשך — פרסמו את כללי Firestore/Storage מהפרויקט (firebase deploy --only firestore:rules,storage).";
    }
    return "אין הרשאה לשמירה בענן — התחברו עם Google ונסו שוב.";
  }
  if (/not signed in|יש להתחבר/i.test(raw)) {
    return "יש להתחבר עם Google לפני שמירה לענן.";
  }
  if (/timed out|timeout|בעיית רשת/i.test(raw)) {
    return "השמירה לענן נכשלה בגלל timeout. בדקו חיבור לאינטרנט.";
  }
  if (/בעיה בהעלאה לענן|העלאת תמונה|Storage/i.test(raw)) {
    return `העלאת התמונה לענן נכשלה — השינוי נשמר רק במחשב הזה. ${raw}`.trim();
  }
  return `השמירה לענן נכשלה — השינוי נשמר רק במחשב הזה. ${raw}`.trim();
}

async function requireCloudAuth(): Promise<string> {
  const uid = await ensureFirebaseSignedIn();
  if (!uid) {
    throw new Error("יש להתחבר עם Google לפני שמירה לענן.");
  }
  return uid;
}

function cloneSeed(): ArchiveData {
  return structuredClone(SEED);
}

async function commitBatches(
  db: NonNullable<ReturnType<typeof getFirebaseDb>>,
  ops: { path: string; id: string; data: object }[]
) {
  const CHUNK = 400;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + CHUNK)) {
      batch.set(doc(db, op.path, op.id), asFirestoreDoc(op.data));
    }
    await batch.commit();
  }
}

/** Hebrew-only ids break Next.js routes — migrate to ASCII slugs. */
function migrateIds(data: ArchiveData): ArchiveData {
  const idMap = new Map<string, string>();
  const people = data.people.map((person) => {
    if (/[a-z0-9]/i.test(person.id)) return person;
    const nextId = makeSlug(person.nameOriginal || person.name || person.id);
    if (nextId !== person.id) idMap.set(person.id, nextId);
    return { ...person, id: nextId };
  });

  const productions = data.productions.map((production) => {
    if (/[a-z0-9]/i.test(production.id)) return production;
    const nextId = makeSlug(production.originalTitle || production.title || production.id);
    if (nextId !== production.id) idMap.set(production.id, nextId);
    return { ...production, id: nextId };
  });

  if (idMap.size === 0) return data;

  const mapId = (id: string) => idMap.get(id) || id;

  return {
    people,
    productions,
    credits: data.credits.map((c) => ({
      ...c,
      personId: mapId(c.personId),
      productionId: mapId(c.productionId),
    })),
    contributions: (data.contributions || []).map((c) => ({
      ...c,
      entityId: mapId(c.entityId),
    })),
  };
}

function mergeWithSeed(data: ArchiveData): ArchiveData {
  const peopleMap = new Map(data.people.map((p) => [p.id, p]));
  for (const seed of SEED.people) {
    const existing = peopleMap.get(seed.id);
    if (!existing) {
      peopleMap.set(seed.id, seed);
      continue;
    }
    // Existing entry: fill gaps / prefer richer seed fields (Wikipedia enrich)
    peopleMap.set(seed.id, {
      ...existing,
      name: existing.name || seed.name,
      nameOriginal: existing.nameOriginal || seed.nameOriginal,
      birthDate: existing.birthDate || seed.birthDate,
      deathDate: existing.deathDate || seed.deathDate,
      wikipediaUrl: existing.wikipediaUrl || seed.wikipediaUrl,
      nicknames:
        existing.nicknames?.length
          ? [
              ...existing.nicknames,
              ...(seed.nicknames || []).filter(
                (n) =>
                  !existing.nicknames!.some(
                    (e) => e.trim().toLowerCase() === n.trim().toLowerCase()
                  )
              ),
            ]
          : seed.nicknames || [],
      tags:
        existing.tags?.length
          ? [
              ...existing.tags,
              ...(seed.tags || []).filter(
                (t) =>
                  !existing.tags!.some(
                    (e) => e.trim().toLowerCase() === t.trim().toLowerCase()
                  )
              ),
            ]
          : seed.tags || [],
      activities: [
        ...new Set([...(existing.activities || []), ...(seed.activities || [])]),
      ],
      bio:
        (seed.bio?.length || 0) > (existing.bio?.length || 0)
          ? seed.bio
          : existing.bio || seed.bio,
      imageUrl:
        !existing.imageUrl || existing.imageUrl.includes("image/svg")
          ? seed.imageUrl || existing.imageUrl
          : existing.imageUrl || seed.imageUrl,
      updatedAt:
        (seed.bio?.length || 0) > (existing.bio?.length || 0) ||
        (!existing.birthDate && seed.birthDate) ||
        (!existing.wikipediaUrl && seed.wikipediaUrl)
          ? new Date().toISOString()
          : existing.updatedAt,
    });
  }

  // Also match seed people by Hebrew name when ids differ (update the kept record)
  const byName = new Map<string, string>();
  for (const p of peopleMap.values()) {
    const key = normalizePersonName(p.name);
    if (key && !byName.has(key)) byName.set(key, p.id);
  }
  for (const seed of SEED.people) {
    const key = normalizePersonName(seed.name);
    const existingId = byName.get(key);
    if (!existingId || existingId === seed.id) continue;
    const existing = peopleMap.get(existingId);
    if (!existing) continue;
    peopleMap.set(existingId, {
      ...existing,
      nameOriginal: existing.nameOriginal || seed.nameOriginal,
      birthDate: existing.birthDate || seed.birthDate,
      deathDate: existing.deathDate || seed.deathDate,
      wikipediaUrl: existing.wikipediaUrl || seed.wikipediaUrl,
      nicknames:
        existing.nicknames?.length
          ? existing.nicknames
          : seed.nicknames || [],
      bio:
        (seed.bio?.length || 0) > (existing.bio?.length || 0)
          ? seed.bio
          : existing.bio || seed.bio,
      imageUrl: existing.imageUrl || seed.imageUrl,
      activities: [
        ...new Set([...(existing.activities || []), ...(seed.activities || [])]),
      ],
    });
  }

  const prodMap = new Map(data.productions.map((p) => [p.id, p]));
  for (const seed of SEED.productions) {
    const existing = prodMap.get(seed.id);
    if (!existing) {
      prodMap.set(seed.id, seed);
      continue;
    }
    prodMap.set(seed.id, {
      ...existing,
      originalTitle: existing.originalTitle || seed.originalTitle,
      endYear: existing.endYear ?? seed.endYear,
      channel: existing.channel || seed.channel,
      studio: existing.studio || seed.studio,
      dubbingStudio: existing.dubbingStudio || seed.dubbingStudio,
      summary:
        (seed.summary?.length || 0) > (existing.summary?.length || 0)
          ? seed.summary
          : existing.summary || seed.summary,
      genres: existing.genres?.length
        ? [
            ...existing.genres,
            ...(seed.genres || []).filter((g) => !existing.genres.includes(g)),
          ]
        : seed.genres || [],
      imageUrl: existing.imageUrl || seed.imageUrl,
    });
  }

  const creditKey = (c: Credit) =>
    `${c.productionId}_${c.personId}_${c.role}`;
  const creditMap = new Map(data.credits.map((c) => [creditKey(c), c]));
  for (const c of SEED.credits) {
    const k = creditKey(c);
    const existing = creditMap.get(k);
    if (!existing) creditMap.set(k, c);
    else if (!existing.characterName && c.characterName) creditMap.set(k, c);
  }

  return {
    people: [...peopleMap.values()],
    productions: [...prodMap.values()],
    credits: [...creditMap.values()],
    contributions: data.contributions || [],
  };
}

function normalize(data: ArchiveData): ArchiveData {
  return ensureDiscographyProductions(
    ensureFilmographies(
      dedupeArchive(
        (() => {
          const merged = mergeWithSeed(
            migrateIds({
              people: applyPeopleEnrichment(
                (data.people || []).map((p) => ({
                  ...p,
                  nicknames: p.nicknames || [],
                  tags: [...new Set(p.tags || [])],
                  activities: [...new Set(p.activities || [])],
                  discography: p.discography || [],
                  imageUrl: normalizeImageUrl(
                    p.imageUrl,
                    p.name,
                    p.nameOriginal,
                    "person"
                  ),
                }))
              ),
              productions: (data.productions || []).map((p) => ({
                ...p,
                imageUrl: normalizeImageUrl(
                  p.imageUrl,
                  p.title,
                  p.originalTitle,
                  p.kind === "performance" || p.kind === "cassette"
                    ? "album"
                    : "film"
                ),
              })),
              credits: data.credits || [],
              contributions: data.contributions || [],
            })
          );
          return {
            ...merged,
            productions: applyDubbingStudios(merged.productions),
          };
        })()
      )
    )
  );
}

function creditKeyOf(c: Credit): string {
  return `${c.productionId}_${c.personId}_${c.role}`;
}

function emptyOverlay(): LocalOverlay {
  return {
    v: 1,
    people: [],
    productions: [],
    credits: [],
    contributions: [],
    removedPersonIds: [],
    removedProductionIds: [],
    removedCreditKeys: [],
  };
}

function isEmptyOverlay(o: LocalOverlay): boolean {
  return (
    o.people.length === 0 &&
    o.productions.length === 0 &&
    o.credits.length === 0 &&
    (o.contributions?.length || 0) === 0 &&
    o.removedPersonIds.length === 0 &&
    o.removedProductionIds.length === 0 &&
    o.removedCreditKeys.length === 0
  );
}

function getSeedBaseline(): ArchiveData {
  if (!seedBaseline) seedBaseline = normalize(cloneSeed());
  return seedBaseline;
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Diff full archive against normalized seed — only mutations / extras. */
function extractOverlay(data: ArchiveData): LocalOverlay {
  const baseline = getSeedBaseline();
  const seedPeople = new Map(baseline.people.map((p) => [p.id, p]));
  const seedProds = new Map(baseline.productions.map((p) => [p.id, p]));
  const seedCredits = new Map(baseline.credits.map((c) => [creditKeyOf(c), c]));
  const dataPeople = new Map(data.people.map((p) => [p.id, p]));
  const dataProds = new Map(data.productions.map((p) => [p.id, p]));
  const dataCredits = new Map(data.credits.map((c) => [creditKeyOf(c), c]));

  return {
    v: 1,
    people: data.people.filter((p) => !sameJson(seedPeople.get(p.id), p)),
    productions: data.productions.filter(
      (p) => !sameJson(seedProds.get(p.id), p)
    ),
    credits: data.credits.filter(
      (c) => !sameJson(seedCredits.get(creditKeyOf(c)), c)
    ),
    contributions: data.contributions || [],
    removedPersonIds: [...seedPeople.keys()].filter((id) => !dataPeople.has(id)),
    removedProductionIds: [...seedProds.keys()].filter(
      (id) => !dataProds.has(id)
    ),
    removedCreditKeys: [...seedCredits.keys()].filter(
      (k) => !dataCredits.has(k)
    ),
  };
}

/** Rebuild archive from seed + slim overlay. */
function archiveFromOverlay(overlay: LocalOverlay | null): ArchiveData {
  let data = normalize({
    people: overlay?.people || [],
    productions: overlay?.productions || [],
    credits: overlay?.credits || [],
    contributions: overlay?.contributions || [],
  });

  if (!overlay || isEmptyOverlay(overlay)) return data;

  // User / remote overrides must win over mergeWithSeed gap-filling
  if (overlay.people.length) {
    const map = new Map(data.people.map((p) => [p.id, p]));
    for (const p of overlay.people) map.set(p.id, p);
    data = { ...data, people: [...map.values()] };
  }
  if (overlay.productions.length) {
    const map = new Map(data.productions.map((p) => [p.id, p]));
    for (const p of overlay.productions) map.set(p.id, p);
    data = { ...data, productions: [...map.values()] };
  }
  if (overlay.credits.length) {
    const map = new Map(data.credits.map((c) => [creditKeyOf(c), c]));
    for (const c of overlay.credits) map.set(creditKeyOf(c), c);
    data = { ...data, credits: [...map.values()] };
  }

  const removedPeople = new Set(overlay.removedPersonIds);
  const removedProds = new Set(overlay.removedProductionIds);
  const removedCredits = new Set(overlay.removedCreditKeys);

  return {
    people: data.people.filter((p) => !removedPeople.has(p.id)),
    productions: data.productions.filter((p) => !removedProds.has(p.id)),
    credits: data.credits.filter((c) => !removedCredits.has(creditKeyOf(c))),
    contributions: overlay.contributions || [],
  };
}

function isLegacyArchiveKey(key: string): boolean {
  return (
    key.startsWith("haarchion-archive-v") ||
    (key.startsWith("haarchion-overlay-v") && key !== STORAGE_KEY)
  );
}

/** Free quota taken by old full-archive dumps (v19–v23 etc.). */
function purgeObsoleteStorageKeys() {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isLegacyArchiveKey(key)) toRemove.push(key);
  }
  for (const key of toRemove) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

function tryParseOverlay(raw: string): LocalOverlay | null {
  try {
    const parsed = JSON.parse(raw) as LocalOverlay | ArchiveData;
    if (
      parsed &&
      typeof parsed === "object" &&
      "v" in parsed &&
      (parsed as LocalOverlay).v === 1 &&
      Array.isArray((parsed as LocalOverlay).people)
    ) {
      const o = parsed as LocalOverlay;
      return {
        ...emptyOverlay(),
        ...o,
        contributions: o.contributions || [],
        removedPersonIds: o.removedPersonIds || [],
        removedProductionIds: o.removedProductionIds || [],
        removedCreditKeys: o.removedCreditKeys || [],
      };
    }
    // Legacy full ArchiveData blob → slim delta
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as ArchiveData).people) &&
      Array.isArray((parsed as ArchiveData).productions)
    ) {
      return extractOverlay(normalize(parsed as ArchiveData));
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readLegacyOverlay(): LocalOverlay | null {
  if (typeof window === "undefined") return null;
  const candidates: { key: string; ver: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("haarchion-archive-v")) continue;
    if (key.includes("normalized")) continue;
    const ver = Number(key.replace(/^haarchion-archive-v/, "").split("-")[0]);
    if (!Number.isNaN(ver)) candidates.push({ key, ver });
  }
  candidates.sort((a, b) => b.ver - a.ver);
  for (const { key } of candidates) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const overlay = tryParseOverlay(raw);
      if (overlay && !isEmptyOverlay(overlay)) return overlay;
    } catch {
      /* try next */
    }
  }
  return null;
}

function persistOverlay(overlay: LocalOverlay): boolean {
  if (typeof window === "undefined") return true;
  if (isEmptyOverlay(overlay)) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return true;
  }
  const payload = JSON.stringify(overlay);
  const write = () => localStorage.setItem(STORAGE_KEY, payload);
  try {
    write();
    return true;
  } catch {
    purgeObsoleteStorageKeys();
    try {
      write();
      return true;
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return false;
    }
  }
}

function bootstrapStorage(): LocalOverlay | null {
  if (typeof window === "undefined") return null;
  if (storageBootstrapped) {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? tryParseOverlay(raw) : null;
  }
  storageBootstrapped = true;

  const currentRaw = localStorage.getItem(STORAGE_KEY);
  let overlay = currentRaw ? tryParseOverlay(currentRaw) : null;
  if (!overlay || isEmptyOverlay(overlay)) {
    const legacy = readLegacyOverlay();
    if (legacy && !isEmptyOverlay(legacy)) overlay = legacy;
  }

  purgeObsoleteStorageKeys();

  if (overlay && !isEmptyOverlay(overlay)) {
    persistOverlay(overlay);
    return overlay;
  }
  return null;
}

function readLocal(): ArchiveData {
  if (typeof window === "undefined") return structuredClone(getSeedBaseline());
  try {
    return archiveFromOverlay(bootstrapStorage());
  } catch (error) {
    console.warn("Local archive read failed — using seed", error);
    try {
      purgeObsoleteStorageKeys();
    } catch {
      /* ignore */
    }
    return structuredClone(getSeedBaseline());
  }
}

function writeLocal(data: ArchiveData) {
  if (typeof window === "undefined") return;
  memoryCache = { data, at: Date.now() };
  const overlay = extractOverlay(data);
  if (persistOverlay(overlay)) return;
  // Keep working in-memory; never throw QuotaExceededError to the UI
  console.warn(
    "localStorage quota exceeded — archive kept in memory only for this session"
  );
}

function pushContribution(
  data: ArchiveData,
  entry: Omit<Contribution, "id">
): ArchiveData {
  const contribution: Contribution = {
    ...entry,
    id: `${entry.userId}-${entry.entityType}-${entry.entityId}-${entry.at}`,
  };
  return {
    ...data,
    contributions: [contribution, ...(data.contributions || [])].slice(0, 500),
  };
}

async function readFirestoreArchive(): Promise<ArchiveData> {
  const db = getFirebaseDb();
  if (!db) return normalize(cloneSeed());

  const [peopleSnap, productionsSnap, creditsSnap, contributionsSnap] =
    await Promise.all([
      getDocs(collection(db, "people")),
      getDocs(collection(db, "productions")),
      getDocs(collection(db, "credits")),
      getDocs(collection(db, "contributions")),
    ]);

  // Always merge onto seed so cloud-only user entries appear on every device
  return normalize({
    people: peopleSnap.docs.map((d) => d.data() as Person),
    productions: productionsSnap.docs.map((d) => d.data() as Production),
    credits: creditsSnap.docs.map((d) => d.data() as Credit),
    contributions: contributionsSnap.docs.map((d) => d.data() as Contribution),
  });
}

/** Prefer the version with the later updatedAt (collaborative edits) */
function preferNewer<T extends { updatedAt?: string; id: string }>(
  a: T,
  b: T
): T {
  const at = a.updatedAt || "";
  const bt = b.updatedAt || "";
  if (bt > at) return b;
  if (at > bt) return a;
  return b; // tie: prefer remote/incoming
}

/** Merge local + remote; newer updatedAt wins per entity */
function mergeArchives(local: ArchiveData, remote: ArchiveData): ArchiveData {
  const people = new Map(local.people.map((p) => [p.id, p]));
  for (const p of remote.people) {
    const existing = people.get(p.id);
    people.set(p.id, existing ? preferNewer(existing, p) : p);
  }

  const productions = new Map(local.productions.map((p) => [p.id, p]));
  for (const p of remote.productions) {
    const existing = productions.get(p.id);
    productions.set(p.id, existing ? preferNewer(existing, p) : p);
  }

  const creditKey = (c: Credit) =>
    `${c.productionId}_${c.personId}_${c.role}`;
  const credits = new Map(local.credits.map((c) => [creditKey(c), c]));
  for (const c of remote.credits) {
    const k = creditKey(c);
    const existing = credits.get(k);
    if (!existing) credits.set(k, c);
    else if (!existing.characterName && c.characterName) credits.set(k, c);
    else credits.set(k, c); // remote credit replace (no updatedAt on credits)
  }

  const contributions = new Map(
    (local.contributions || []).map((c) => [c.id, c])
  );
  for (const c of remote.contributions || []) contributions.set(c.id, c);

  return normalize({
    people: [...people.values()],
    productions: [...productions.values()],
    credits: [...credits.values()],
    contributions: [...contributions.values()],
  });
}

/** Memory only — opening a page must never write the full archive to disk. */
function cacheLocally(data: ArchiveData) {
  memoryCache = { data, at: Date.now() };
}

function fallbackArchive(): ArchiveData {
  if (typeof window !== "undefined") {
    try {
      return readLocal();
    } catch {
      return structuredClone(getSeedBaseline());
    }
  }
  return structuredClone(getSeedBaseline());
}

export async function loadArchive(
  force = false,
  opts?: { onRemote?: (data: ArchiveData) => void }
): Promise<ArchiveData> {
  if (
    !force &&
    memoryCache &&
    Date.now() - memoryCache.at < MEMORY_TTL_MS
  ) {
    return memoryCache.data;
  }

  const local = fallbackArchive();
  cacheLocally(local);

  if (!isFirebaseConfigured()) {
    return local;
  }

  if (!firestoreSyncInFlight) {
    firestoreSyncInFlight = true;
    void (async () => {
      try {
        const remote = await withTimeout(
          readFirestoreArchive(),
          FIRESTORE_LOAD_MS,
          "Firestore load"
        );
        const merged = mergeArchives(local, remote);
        cacheLocally(merged);
        opts?.onRemote?.(merged);
      } catch (error) {
        console.warn("Firestore sync failed — using local/seed data", error);
      } finally {
        firestoreSyncInFlight = false;
      }
    })();
  }

  return local;
}

export async function getPerson(id: string): Promise<Person | undefined> {
  if (isFirebaseConfigured()) {
    const db = getFirebaseDb();
    if (db) {
      try {
        const snap = await getDoc(doc(db, "people", id));
        if (snap.exists()) return snap.data() as Person;
      } catch {
        /* fall through */
      }
    }
  }
  return readLocal().people.find((p) => p.id === id);
}

export async function getProduction(
  id: string
): Promise<Production | undefined> {
  if (isFirebaseConfigured()) {
    const db = getFirebaseDb();
    if (db) {
      try {
        const snap = await getDoc(doc(db, "productions", id));
        if (snap.exists()) return snap.data() as Production;
      } catch {
        /* fall through */
      }
    }
  }
  return readLocal().productions.find((p) => p.id === id);
}

export async function savePerson(
  person: Person,
  meta?: { userId?: string; userName?: string; isNew?: boolean }
): Promise<void> {
  const archive = memoryCache?.data ?? (typeof window !== "undefined" ? readLocal() : normalize(cloneSeed()));
  if (meta?.isNew) {
    const nameKey = normalizePersonName(person.name);
    const duplicate = archive.people.find(
      (p) => p.id !== person.id && normalizePersonName(p.name) === nameKey
    );
    if (duplicate) {
      throw new Error(
        `האישיות "${duplicate.name}" כבר קיימת בארכיון. ערכו את הערך הקיים במקום ליצור כפילות.`
      );
    }
  }

  let toSave = person;

  // Always persist locally first so edits never depend on Firestore being healthy
  let data =
    typeof window !== "undefined" ? readLocal() : normalize(cloneSeed());
  if (memoryCache?.data) data = structuredClone(memoryCache.data);
  const idx = data.people.findIndex((p) => p.id === toSave.id);
  const isNew = idx < 0;
  if (idx >= 0) data.people[idx] = toSave;
  else data.people.push(toSave);
  if (meta?.userId) {
    data = pushContribution(data, {
      userId: meta.userId,
      userName: meta.userName,
      entityType: "person",
      entityId: toSave.id,
      entityTitle: toSave.name,
      action: (meta.isNew ?? isNew) ? "create" : "update",
      at: toSave.updatedAt,
    });
  }
  writeLocal(data);
  memoryCache = { data, at: Date.now() };

  if (!isFirebaseConfigured()) return;

  try {
    await requireCloudAuth();
    const db = getFirebaseDb();
    if (!db) throw new Error("Firebase is not available");

    let cloudImageUrl = person.imageUrl;
    let omitImageFromCloud = false;
    try {
      cloudImageUrl = await withTimeout(
        ensureCloudImageUrl(person.imageUrl, `people/${person.id}.jpg`),
        CLOUD_SAVE_MS,
        "upload person image"
      );
    } catch (uploadErr) {
      // Don't block Firestore text sync if Storage rejects the image.
      if (person.imageUrl?.startsWith("data:")) {
        omitImageFromCloud = true;
        console.warn("person image upload failed", uploadErr);
      } else {
        throw uploadErr;
      }
    }
    toSave =
      omitImageFromCloud || cloudImageUrl === person.imageUrl
        ? person
        : { ...person, imageUrl: cloudImageUrl };
    if (toSave !== person) {
      const i = data.people.findIndex((p) => p.id === toSave.id);
      if (i >= 0) data.people[i] = toSave;
      writeLocal(data);
      memoryCache = { data, at: Date.now() };
    }

    const cloudPerson = omitImageFromCloud
      ? (() => {
          const { imageUrl: _omit, ...rest } = toSave;
          return rest;
        })()
      : toSave;

    await withTimeout(
      setDoc(doc(db, "people", toSave.id), asFirestoreDoc(cloudPerson), {
        merge: true,
      }),
      CLOUD_SAVE_MS,
      "save person"
    );

    if (meta?.userId) {
      const contribution: Contribution = {
        id: `${meta.userId}-person-${toSave.id}-${toSave.updatedAt}`,
        userId: meta.userId,
        userName: meta.userName,
        entityType: "person",
        entityId: toSave.id,
        entityTitle: toSave.name,
        action: meta.isNew ? "create" : "update",
        at: toSave.updatedAt,
      };
      await withTimeout(
        setDoc(
          doc(db, "contributions", contribution.id),
          asFirestoreDoc(contribution as unknown as Record<string, unknown>)
        ),
        CLOUD_SAVE_MS,
        "save contribution"
      );
    }
  } catch (error) {
    throw new Error(cloudSaveErrorMessage(error));
  }
}

export async function saveProduction(
  production: Production,
  meta?: { userId?: string; userName?: string; isNew?: boolean }
): Promise<void> {
  let toSave = production;

  let data =
    typeof window !== "undefined" ? readLocal() : normalize(cloneSeed());
  if (memoryCache?.data) data = structuredClone(memoryCache.data);
  const idx = data.productions.findIndex((p) => p.id === toSave.id);
  const isNew = idx < 0;
  if (idx >= 0) data.productions[idx] = toSave;
  else data.productions.push(toSave);
  if (meta?.userId) {
    data = pushContribution(data, {
      userId: meta.userId,
      userName: meta.userName,
      entityType: "production",
      entityId: toSave.id,
      entityTitle: toSave.title,
      action: (meta.isNew ?? isNew) ? "create" : "update",
      at: toSave.updatedAt,
    });
  }
  writeLocal(data);
  memoryCache = { data, at: Date.now() };

  if (!isFirebaseConfigured()) return;

  try {
    await requireCloudAuth();
    const db = getFirebaseDb();
    if (!db) throw new Error("Firebase is not available");

    let cloudImageUrl = production.imageUrl;
    let omitImageFromCloud = false;
    try {
      cloudImageUrl = await withTimeout(
        ensureCloudImageUrl(
          production.imageUrl,
          `productions/${production.id}.jpg`
        ),
        CLOUD_SAVE_MS,
        "upload production image"
      );
    } catch (uploadErr) {
      if (production.imageUrl?.startsWith("data:")) {
        omitImageFromCloud = true;
        console.warn("production image upload failed", uploadErr);
      } else {
        throw uploadErr;
      }
    }
    toSave =
      omitImageFromCloud || cloudImageUrl === production.imageUrl
        ? production
        : { ...production, imageUrl: cloudImageUrl };
    if (toSave !== production) {
      const i = data.productions.findIndex((p) => p.id === toSave.id);
      if (i >= 0) data.productions[i] = toSave;
      writeLocal(data);
      memoryCache = { data, at: Date.now() };
    }

    const cloudProduction = omitImageFromCloud
      ? (() => {
          const { imageUrl: _omit, ...rest } = toSave;
          return rest;
        })()
      : toSave;

    await withTimeout(
      setDoc(
        doc(db, "productions", toSave.id),
        asFirestoreDoc(cloudProduction),
        { merge: true }
      ),
      CLOUD_SAVE_MS,
      "save production"
    );

    if (meta?.userId) {
      const contribution: Contribution = {
        id: `${meta.userId}-production-${toSave.id}-${toSave.updatedAt}`,
        userId: meta.userId,
        userName: meta.userName,
        entityType: "production",
        entityId: toSave.id,
        entityTitle: toSave.title,
        action: meta.isNew ? "create" : "update",
        at: toSave.updatedAt,
      };
      await withTimeout(
        setDoc(
          doc(db, "contributions", contribution.id),
          asFirestoreDoc(contribution as unknown as Record<string, unknown>)
        ),
        CLOUD_SAVE_MS,
        "save contribution"
      );
    }
  } catch (error) {
    throw new Error(cloudSaveErrorMessage(error));
  }
}

export async function saveCreditsForProduction(
  productionId: string,
  credits: Credit[]
): Promise<void> {
  if (isFirebaseConfigured()) {
    await requireCloudAuth();
    const db = getFirebaseDb();
    if (!db) throw new Error("Firebase is not available");
    const existing = await getDocs(collection(db, "credits"));
    const batch = writeBatch(db);
    for (const d of existing.docs) {
      const c = d.data() as Credit;
      if (c.productionId === productionId) batch.delete(d.ref);
    }
    for (const credit of credits) {
      const id = `${credit.productionId}_${credit.personId}_${credit.role}`;
      batch.set(doc(db, "credits", id), asFirestoreDoc(credit));
    }
    await batch.commit();
  }

  let data =
    typeof window !== "undefined" ? readLocal() : normalize(cloneSeed());
  if (memoryCache?.data) data = structuredClone(memoryCache.data);
  data.credits = [
    ...data.credits.filter((c) => c.productionId !== productionId),
    ...credits,
  ];
  writeLocal(data);
  memoryCache = { data, at: Date.now() };
}

export async function deletePerson(id: string): Promise<void> {
  let data =
    typeof window !== "undefined" ? readLocal() : normalize(cloneSeed());
  if (memoryCache?.data) data = structuredClone(memoryCache.data);
  data.people = data.people.filter((p) => p.id !== id);
  data.credits = data.credits.filter((c) => c.personId !== id);
  data.contributions = (data.contributions || []).filter(
    (c) => !(c.entityType === "person" && c.entityId === id)
  );
  writeLocal(data);
  memoryCache = { data, at: Date.now() };

  if (!isFirebaseConfigured()) return;
  try {
    await requireCloudAuth();
    const db = getFirebaseDb();
    if (!db) return;
    await withTimeout(deleteDoc(doc(db, "people", id)), CLOUD_SAVE_MS, "delete person");
    const creditsSnap = await getDocs(collection(db, "credits"));
    const toDelete = creditsSnap.docs.filter(
      (d) => (d.data() as Credit).personId === id
    );
    for (let i = 0; i < toDelete.length; i += 400) {
      const batch = writeBatch(db);
      for (const d of toDelete.slice(i, i + 400)) batch.delete(d.ref);
      await batch.commit();
    }
  } catch (error) {
    console.warn("Cloud delete person failed — removed locally", error);
  }
}

export async function deleteProduction(id: string): Promise<void> {
  let data =
    typeof window !== "undefined" ? readLocal() : normalize(cloneSeed());
  if (memoryCache?.data) data = structuredClone(memoryCache.data);
  data.productions = data.productions.filter((p) => p.id !== id);
  data.credits = data.credits.filter((c) => c.productionId !== id);
  data.contributions = (data.contributions || []).filter(
    (c) => !(c.entityType === "production" && c.entityId === id)
  );
  writeLocal(data);
  memoryCache = { data, at: Date.now() };

  if (!isFirebaseConfigured()) return;
  try {
    await requireCloudAuth();
    const db = getFirebaseDb();
    if (!db) return;
    await withTimeout(
      deleteDoc(doc(db, "productions", id)),
      CLOUD_SAVE_MS,
      "delete production"
    );
    const creditsSnap = await getDocs(collection(db, "credits"));
    const toDelete = creditsSnap.docs.filter(
      (d) => (d.data() as Credit).productionId === id
    );
    for (let i = 0; i < toDelete.length; i += 400) {
      const batch = writeBatch(db);
      for (const d of toDelete.slice(i, i + 400)) batch.delete(d.ref);
      await batch.commit();
    }
  } catch (error) {
    console.warn("Cloud delete production failed — removed locally", error);
  }
}

/**
 * Upload entries created by this user from local cache to Firestore
 * (recover content that was saved only on one computer).
 */
export async function syncMyCreationsToCloud(user: {
  uid: string;
  displayName: string;
}): Promise<{ people: number; productions: number }> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase לא מוגדר באתר.");
  }
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase is not available");

  const data = memoryCache?.data ?? readLocal();
  const people = data.people.filter((p) => isCreatedByUser(p, user));
  const productions = data.productions.filter((p) => isCreatedByUser(p, user));

  try {
    await requireCloudAuth();
    const ops: { path: string; id: string; data: object }[] = [
      ...people.map((p) => ({ path: "people", id: p.id, data: p })),
      ...productions.map((p) => ({
        path: "productions",
        id: p.id,
        data: p,
      })),
    ];
    if (ops.length === 0) return { people: 0, productions: 0 };
    await withTimeout(commitBatches(db, ops), 60_000, "sync my creations");
    return { people: people.length, productions: productions.length };
  } catch (error) {
    throw new Error(cloudSaveErrorMessage(error));
  }
}

/** True if the logged-in editor created this entity */
export function isCreatedByUser(
  entity: { createdBy?: string },
  user: { uid: string; displayName: string } | null | undefined
): boolean {
  if (!user || !entity.createdBy) return false;
  return (
    entity.createdBy === user.uid ||
    entity.createdBy === `local-${user.displayName}` ||
    entity.createdBy === `editor-${user.uid.replace(/^editor-/, "")}`
  );
}

/** Any signed-in editor may edit or delete any person / production */
export function canEditArchive(
  user: { uid: string } | null | undefined
): boolean {
  return Boolean(user?.uid);
}

export function formatDateHe(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Age in full years from birthDate; if deathDate exists — age at death */
export function calcAge(
  birthDate?: string,
  deathDate?: string,
  now = new Date()
): number | undefined {
  if (!birthDate) return undefined;
  const parts = birthDate.split("-").map(Number);
  const by = parts[0];
  if (!by || Number.isNaN(by)) return undefined;
  const bm = parts[1] && parts[1] >= 1 ? parts[1] : 1;
  const bd = parts[2] && parts[2] >= 1 ? parts[2] : 1;

  let end = now;
  if (deathDate) {
    const dp = deathDate.split("-").map(Number);
    const dy = dp[0];
    if (dy && !Number.isNaN(dy)) {
      end = new Date(dy, (dp[1] || 1) - 1, dp[2] || 1);
    }
  }

  let age = end.getFullYear() - by;
  const month = end.getMonth() + 1;
  const day = end.getDate();
  if (month < bm || (month === bm && day < bd)) age -= 1;
  if (age < 0 || age > 130) return undefined;
  return age;
}

export function ageLabel(birthDate?: string, deathDate?: string): string | undefined {
  const age = calcAge(birthDate, deathDate);
  if (age === undefined) return undefined;
  return `גיל: ${age}`;
}

export function bornToday(people: Person[], date = new Date()): Person[] {
  const m = date.getMonth() + 1;
  const day = date.getDate();
  return people.filter((p) => {
    if (!p.birthDate) return false;
    const [, mm, dd] = p.birthDate.split("-").map(Number);
    return mm === m && dd === day;
  });
}

/** People whose birthday falls in the current week (Sun–Sat), Israel-style. */
export function bornThisWeek(people: Person[], date = new Date()): Person[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(date.getDate() - date.getDay()); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return bornBetweenMonthDays(people, start, end, date.getFullYear());
}

/**
 * Birthdays from `daysBack` days ago through `daysForward` days ahead
 * (inclusive). Useful when the calendar week has few/no matches.
 */
export function bornNearby(
  people: Person[],
  date = new Date(),
  daysBack = 3,
  daysForward = 10
): Person[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(date.getDate() - daysBack);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  end.setDate(date.getDate() + daysForward);
  return bornBetweenMonthDays(people, start, end, date.getFullYear());
}

function bornBetweenMonthDays(
  people: Person[],
  start: Date,
  end: Date,
  focusYear: number
): Person[] {
  const years = [focusYear - 1, focusYear, focusYear + 1];
  return people
    .filter((p) => {
      if (!p.birthDate) return false;
      const parts = p.birthDate.split("-").map(Number);
      const mm = parts[1];
      const dd = parts[2];
      if (!mm || !dd) return false;
      // Skip placeholder Jan 1 when it's clearly a year-only guess
      // (keep real Jan 1 birthdays — only skip if month/day both defaulted poorly)
      return years.some((y) => {
        const b = new Date(y, mm - 1, dd);
        // Guard invalid dates like Feb 31
        if (b.getMonth() !== mm - 1 || b.getDate() !== dd) return false;
        return b >= start && b <= end;
      });
    })
    .sort((a, b) => {
      const am = Number(a.birthDate!.slice(5, 7));
      const ad = Number(a.birthDate!.slice(8, 10));
      const bm = Number(b.birthDate!.slice(5, 7));
      const bd = Number(b.birthDate!.slice(8, 10));
      // Sort by upcoming occurrence from `start`
      const key = (mm: number, dd: number) => {
        let y = start.getFullYear();
        let d = new Date(y, mm - 1, dd);
        if (d < start) d = new Date(y + 1, mm - 1, dd);
        return d.getTime();
      };
      return key(am, ad) - key(bm, bd);
    });
}

export type RecentUpdate = {
  id: string;
  kind: "person" | "production";
  title: string;
  href: string;
  at: string;
  action: "create" | "update";
};

/** Latest people/productions by updatedAt (fallback createdAt). */
export function recentUpdates(
  data: { people: Person[]; productions: Production[] },
  limit = 3
): RecentUpdate[] {
  const rows: RecentUpdate[] = [
    ...data.people.map((p) => ({
      id: p.id,
      kind: "person" as const,
      title: p.name,
      href: `/people/${encodeURIComponent(p.id)}`,
      at: p.updatedAt || p.createdAt,
      action:
        p.createdAt && p.updatedAt && p.createdAt === p.updatedAt
          ? ("create" as const)
          : ("update" as const),
    })),
    ...data.productions.map((p) => ({
      id: p.id,
      kind: "production" as const,
      title: formatProductionTitle(p),
      href: `/productions/${encodeURIComponent(p.id)}`,
      at: p.updatedAt || p.createdAt,
      action:
        p.createdAt && p.updatedAt && p.createdAt === p.updatedAt
          ? ("create" as const)
          : ("update" as const),
    })),
  ];

  return rows
    .filter((r) => r.at)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

