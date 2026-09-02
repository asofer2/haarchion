import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebase";
import { ensureFirebaseSignedIn } from "./firebase-session";
import { isSiteAdmin, SITE_ADMIN_NAME } from "./admin";
import {
  deletePerson,
  deleteProduction,
  saveCreditsForProduction,
  savePerson,
  savePersonCategoryCredits,
  saveProduction,
  type PersonCategoryCreditInput,
} from "./data";
import type { Credit, Person, Production } from "./types";
import { ACTIVITY_LIST } from "./types";

export type ChangeRequestStatus = "pending" | "approved" | "rejected";
export type ChangeRequestAction = "create" | "update" | "delete";
export type ChangeRequestEntity = "person" | "production";

export interface ChangeRequest {
  id: string;
  status: ChangeRequestStatus;
  action: ChangeRequestAction;
  entityType: ChangeRequestEntity;
  entityId: string;
  entityTitle: string;
  requestedBy: string;
  requestedByName?: string;
  requestedByEmail?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  person?: Person;
  production?: Production;
  creditInputs?: PersonCategoryCreditInput[];
  credits?: Credit[];
}

export type ModerationUser = {
  uid: string;
  displayName?: string;
  email?: string;
};

export type SubmitResult = { pending: boolean };

const LOCAL_KEY = "ishim-change-requests-v1";
const DECISIONS_KEY = "ishim-moderation-decisions-v1";

type Decision = {
  status: "approved" | "rejected";
  reviewedAt?: string;
  reviewedBy?: string;
};

const decisionOverlay = new Map<string, Decision>();

function loadDecisionOverlay() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(DECISIONS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, Decision>;
    for (const [id, decision] of Object.entries(parsed)) {
      if (decision?.status === "approved" || decision?.status === "rejected") {
        decisionOverlay.set(id, decision);
      }
    }
  } catch {
    /* ignore */
  }
}

function saveDecisionOverlay() {
  if (typeof window === "undefined") return;
  const out: Record<string, Decision> = {};
  for (const [id, decision] of decisionOverlay) out[id] = decision;
  localStorage.setItem(DECISIONS_KEY, JSON.stringify(out));
}

function recordDecision(id: string, decision: Decision) {
  decisionOverlay.set(id, decision);
  saveDecisionOverlay();
}

function applyDecision(request: ChangeRequest): ChangeRequest {
  const decision = decisionOverlay.get(request.id);
  if (!decision) return request;
  return {
    ...request,
    status: decision.status,
    reviewedAt: decision.reviewedAt || request.reviewedAt,
    reviewedBy: decision.reviewedBy || request.reviewedBy,
  };
}

export function recordedDecisions(): Record<string, "approved" | "rejected"> {
  const out: Record<string, "approved" | "rejected"> = {};
  for (const [id, decision] of decisionOverlay) out[id] = decision.status;
  return out;
}

loadDecisionOverlay();

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

function newId(): string {
  return `cr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readLocal(): ChangeRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChangeRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(list: ChangeRequest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

function upsertLocal(request: ChangeRequest) {
  const list = readLocal().filter((item) => item.id !== request.id);
  list.unshift(request);
  writeLocal(list);
}

function cloudSafe(request: ChangeRequest): ChangeRequest {
  const clone = structuredClone(request);
  const tooBig = (url?: string) =>
    Boolean(url?.startsWith("data:") && url.length > 180_000);
  if (clone.person && tooBig(clone.person.imageUrl)) {
    clone.person = { ...clone.person, imageUrl: undefined };
  }
  if (clone.production && tooBig(clone.production.imageUrl)) {
    clone.production = { ...clone.production, imageUrl: undefined };
  }
  return clone;
}

function requestPayload(request: ChangeRequest): Record<string, unknown> {
  const safe = cloudSafe(request);
  return stripUndefined({
    ...safe,
    isChangeRequest: true,
    userId: safe.requestedBy,
    userName: safe.requestedByName || "",
    at: safe.createdAt,
  }) as Record<string, unknown>;
}

function slimPayload(request: ChangeRequest): Record<string, unknown> {
  return {
    id: request.id,
    status: request.status,
    action: request.action,
    entityType: request.entityType,
    entityId: request.entityId,
    entityTitle: request.entityTitle,
    requestedBy: request.requestedBy,
    requestedByName: request.requestedByName || "",
    requestedByEmail: request.requestedByEmail || "",
    createdAt: request.createdAt,
    reviewedAt: request.reviewedAt || "",
    reviewedBy: request.reviewedBy || "",
    isChangeRequest: true,
    userId: request.requestedBy,
    userName: request.requestedByName || "",
    at: request.createdAt,
  };
}

const INBOX_ID = "_moderation_inbox";

async function writeRequestDocs(
  id: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  let wroteShared = false;

  try {
    await setDoc(doc(db, "contributions", id), payload, { merge: true });
    wroteShared = true;
  } catch (error) {
    console.warn("change request contributions write failed", error);
  }

  try {
    await setDoc(
      doc(db, "contributions", INBOX_ID),
      {
        isChangeRequestInbox: true,
        [`items.${id}`]: payload,
      },
      { merge: true }
    );
    wroteShared = true;
  } catch (error) {
    console.warn("change request inbox write failed", error);
  }

  const ownerUid = typeof payload.requestedBy === "string" ? payload.requestedBy : "";
  if (ownerUid) {
    try {
      const ref = doc(db, "editors", ownerUid);
      const snap = await getDoc(ref);
      const existing =
        (snap.data()?.changeRequests as Record<string, unknown> | undefined) || {};
      await setDoc(
        ref,
        { changeRequests: { ...existing, [id]: payload } },
        { merge: true }
      );
    } catch (error) {
      console.warn("change request editor write failed", error);
    }
  }

  try {
    await setDoc(doc(db, "changeRequests", id), payload, { merge: true });
    wroteShared = true;
  } catch {
    /* denied until new rules are deployed */
  }

  return wroteShared;
}

async function writeReviewerDecision(
  request: ChangeRequest,
  reviewerUid: string
): Promise<void> {
  if (request.status !== "approved" && request.status !== "rejected") return;
  const db = getFirebaseDb();
  if (!db) return;
  const decision: Decision = {
    status: request.status,
    reviewedAt: request.reviewedAt || "",
    reviewedBy: request.reviewedBy || reviewerUid,
  };
  try {
    await setDoc(
      doc(db, "editors", reviewerUid),
      { [`moderationDecisions.${request.id}`]: decision },
      { merge: true }
    );
  } catch (error) {
    console.warn("moderation decision write failed", error);
  }
}

function rememberRequest(
  byId: Map<string, ChangeRequest>,
  incoming: ChangeRequest
) {
  incoming = applyDecision(incoming);
  const current = byId.get(incoming.id);
  if (!current) {
    byId.set(incoming.id, incoming);
    return;
  }
  const rank = (status: string) =>
    status === "approved" || status === "rejected" ? 1 : 0;
  if (rank(incoming.status) < rank(current.status)) {
    byId.set(incoming.id, applyDecision({
      ...incoming,
      ...current,
      status: current.status,
      reviewedAt: current.reviewedAt || incoming.reviewedAt,
      reviewedBy: current.reviewedBy || incoming.reviewedBy,
    }));
    return;
  }
  byId.set(incoming.id, applyDecision({
    ...current,
    ...incoming,
    person: incoming.person || current.person,
    production: incoming.production || current.production,
    creditInputs: incoming.creditInputs || current.creditInputs,
    credits: incoming.credits || current.credits,
  }));
}

function ingestContributionDocs(
  byId: Map<string, ChangeRequest>,
  snap: QuerySnapshot<DocumentData>
) {
  for (const d of snap.docs) {
    if (d.id === INBOX_ID) {
      const items = d.data().items;
      if (items && typeof items === "object") {
        for (const [id, raw] of Object.entries(items as Record<string, unknown>)) {
          const parsed = parseRequest(raw, id);
          if (parsed) rememberRequest(byId, parsed);
        }
      }
      continue;
    }
    const parsed = parseRequest(d.data(), d.id);
    if (parsed) rememberRequest(byId, parsed);
  }
}

function ingestEditorDocs(
  byId: Map<string, ChangeRequest>,
  snap: QuerySnapshot<DocumentData>
) {
  for (const d of snap.docs) {
    const decisions = d.data().moderationDecisions;
    if (!decisions || typeof decisions !== "object") continue;
    for (const [id, raw] of Object.entries(decisions as Record<string, Decision>)) {
      if (raw?.status === "approved" || raw?.status === "rejected") {
        recordDecision(id, raw);
        const existing = byId.get(id);
        if (existing) {
          rememberRequest(byId, {
            ...existing,
            status: raw.status,
            reviewedAt: raw.reviewedAt,
            reviewedBy: raw.reviewedBy,
          });
        }
      }
    }
  }
  for (const d of snap.docs) {
    const map = d.data().changeRequests;
    if (!map || typeof map !== "object") continue;
    for (const [id, raw] of Object.entries(map as Record<string, unknown>)) {
      const parsed = parseRequest(raw, id);
      if (parsed) rememberRequest(byId, parsed);
    }
  }
}

function parseRequest(raw: unknown, docId: string): ChangeRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const flagged =
    row.isChangeRequest === true ||
    row.status === "pending" ||
    row.status === "approved" ||
    row.status === "rejected";
  if (!flagged) return null;
  if (typeof row.action !== "string" || typeof row.entityType !== "string") {
    return null;
  }
  return {
    ...(row as unknown as ChangeRequest),
    id: typeof row.id === "string" ? row.id : docId,
  };
}

function sortRequests(list: ChangeRequest[]): ChangeRequest[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mergeRequestData(
  base: ChangeRequest,
  overlay: ChangeRequest
): ChangeRequest {
  return {
    ...base,
    ...overlay,
    person: overlay.person || base.person,
    production: overlay.production || base.production,
    creditInputs: overlay.creditInputs || base.creditInputs,
    credits: overlay.credits || base.credits,
  };
}

function hasEntityPayload(request: ChangeRequest): boolean {
  if (request.action === "delete") return true;
  if (request.entityType === "person" && request.person) return true;
  if (
    request.entityType === "production" &&
    (request.production || request.credits)
  ) {
    return true;
  }
  return false;
}

async function fetchChangeRequestFromCloud(
  id: string,
  requestedBy?: string
): Promise<ChangeRequest | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  let merged: ChangeRequest | null = null;

  const absorb = (raw: unknown, docId: string) => {
    const parsed = parseRequest(raw, docId);
    if (!parsed) return;
    merged = merged ? mergeRequestData(merged, parsed) : parsed;
  };

  try {
    const snap = await getDoc(doc(db, "contributions", id));
    if (snap.exists()) absorb(snap.data(), id);
  } catch {
    /* ignore */
  }

  try {
    const inbox = await getDoc(doc(db, "contributions", INBOX_ID));
    const items = inbox.data()?.items as Record<string, unknown> | undefined;
    if (items?.[id]) absorb(items[id], id);
  } catch {
    /* ignore */
  }

  if (requestedBy) {
    try {
      const editor = await getDoc(doc(db, "editors", requestedBy));
      const map = editor.data()?.changeRequests as
        | Record<string, unknown>
        | undefined;
      if (map?.[id]) absorb(map[id], id);
    } catch {
      /* ignore */
    }
  }

  try {
    const snap = await getDoc(doc(db, "changeRequests", id));
    if (snap.exists()) absorb(snap.data(), id);
  } catch {
    /* ignore */
  }

  return merged;
}

/** Cloud copies may be slim — restore full payload from cloud or this browser */
export async function hydrateChangeRequest(
  request: ChangeRequest
): Promise<ChangeRequest> {
  const local = readLocal().find((item) => item.id === request.id);
  let merged = local ? mergeRequestData(local, request) : request;

  if (!hasEntityPayload(merged)) {
    const cloud = await fetchChangeRequestFromCloud(
      request.id,
      request.requestedBy || merged.requestedBy
    );
    if (cloud) merged = mergeRequestData(cloud, merged);
  }

  return merged;
}

async function writeDecisionDocs(request: ChangeRequest): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  let wroteShared = false;
  const patch = {
    status: request.status,
    reviewedAt: request.reviewedAt || "",
    reviewedBy: request.reviewedBy || "",
    isChangeRequest: true,
  };

  try {
    await setDoc(doc(db, "contributions", request.id), patch, { merge: true });
    wroteShared = true;
  } catch (error) {
    console.warn("change request status write failed", error);
  }

  try {
    await setDoc(
      doc(db, "contributions", INBOX_ID),
      {
        [`items.${request.id}.status`]: patch.status,
        [`items.${request.id}.reviewedAt`]: patch.reviewedAt,
        [`items.${request.id}.reviewedBy`]: patch.reviewedBy,
      },
      { merge: true }
    );
    wroteShared = true;
  } catch (error) {
    console.warn("change request inbox status write failed", error);
  }

  const ownerUid = request.requestedBy;
  if (ownerUid) {
    try {
      await setDoc(
        doc(db, "editors", ownerUid),
        {
          [`changeRequests.${request.id}.status`]: patch.status,
          [`changeRequests.${request.id}.reviewedAt`]: patch.reviewedAt,
          [`changeRequests.${request.id}.reviewedBy`]: patch.reviewedBy,
        },
        { merge: true }
      );
      wroteShared = true;
    } catch (error) {
      console.warn("change request editor status write failed", error);
    }
  }

  try {
    await setDoc(doc(db, "changeRequests", request.id), patch, { merge: true });
    wroteShared = true;
  } catch {
    /* collection may be denied until new rules are deployed */
  }

  return wroteShared;
}

async function persistRequest(request: ChangeRequest): Promise<void> {
  if (request.status === "approved" || request.status === "rejected") {
    recordDecision(request.id, {
      status: request.status,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy,
    });
  }
  upsertLocal(request);
  const decided =
    request.status === "approved" || request.status === "rejected";
  if (!isFirebaseConfigured()) {
    if (decided) {
      throw new Error("אין חיבור לענן — לא ניתן לעדכן את סטטוס הבקשה.");
    }
    throw new Error("אין חיבור לענן — הבקשה לא תגיע לפאנל של תמיר סופר.");
  }
  const uid = await ensureFirebaseSignedIn();
  if (!uid) {
    if (decided) {
      throw new Error("יש להתחבר עם Google כדי לאשר או לדחות בקשות.");
    }
    throw new Error("יש להתחבר כדי לשלוח בקשה לאישור.");
  }
  const db = getFirebaseDb();
  if (!db) {
    if (decided) {
      throw new Error("Firebase לא זמין — לא ניתן לעדכן את סטטוס הבקשה.");
    }
    throw new Error("Firebase לא זמין — הבקשה לא נשלחה.");
  }

  await writeReviewerDecision(request, uid);

  if (decided) {
    const wrote = await writeDecisionDocs(request);
    if (!wrote) {
      throw new Error(
        "לא ניתן לעדכן את סטטוס הבקשה בענן. התחברו מחדש עם חשבון המנהל (tamirsofer@gmail.com)."
      );
    }
    return;
  }

  const wrote = await writeRequestDocs(request.id, requestPayload(request));
  if (!wrote) {
    throw new Error(
      "לא ניתן לשלוח את הבקשה לענן. התחברו מחדש ונסו שוב."
    );
  }
}

export async function listChangeRequests(): Promise<ChangeRequest[]> {
  const byId = new Map<string, ChangeRequest>();
  for (const item of readLocal()) rememberRequest(byId, item);

  if (!isFirebaseConfigured()) {
    return sortRequests([...byId.values()].map(applyDecision));
  }

  await ensureFirebaseSignedIn();
  const db = getFirebaseDb();
  if (!db) return sortRequests([...byId.values()].map(applyDecision));

  try {
    ingestContributionDocs(
      byId,
      await getDocs(
        query(collection(db, "contributions"), where("isChangeRequest", "==", true))
      )
    );
  } catch {
    try {
      ingestContributionDocs(byId, await getDocs(collection(db, "contributions")));
    } catch (error) {
      console.warn("Could not load contribution change requests", error);
    }
  }

  try {
    const inbox = await getDoc(doc(db, "contributions", INBOX_ID));
    if (inbox.exists()) {
      const items = inbox.data().items;
      if (items && typeof items === "object") {
        for (const [id, raw] of Object.entries(items as Record<string, unknown>)) {
          const parsed = parseRequest(raw, id);
          if (parsed) rememberRequest(byId, parsed);
        }
      }
    }
  } catch (error) {
    console.warn("Could not load moderation inbox", error);
  }

  try {
    ingestEditorDocs(byId, await getDocs(collection(db, "editors")));
  } catch (error) {
    console.warn("Could not load editor change requests", error);
  }

  try {
    const snap = await getDocs(collection(db, "changeRequests"));
    for (const d of snap.docs) {
      const parsed = parseRequest(d.data(), d.id);
      if (parsed) rememberRequest(byId, parsed);
    }
  } catch {
    /* collection may be denied until new rules are deployed */
  }

  return sortRequests([...byId.values()].map(applyDecision));
}

export function subscribeChangeRequests(
  onList: (requests: ChangeRequest[]) => void,
  onError?: (error: Error) => void
): () => void {
  const byId = new Map<string, ChangeRequest>();
  for (const item of readLocal()) rememberRequest(byId, item);
  let stopped = false;
  const unsubs: Array<() => void> = [];

  const emit = () => {
    if (!stopped) onList(sortRequests([...byId.values()].map(applyDecision)));
  };

  emit();

  void (async () => {
    if (!isFirebaseConfigured()) {
      onError?.(new Error("אין חיבור לענן — מוצגות רק בקשות שנשמרו במחשב הזה."));
      return;
    }
    await ensureFirebaseSignedIn();
    const db = getFirebaseDb();
    if (stopped) return;
    if (!db) {
      onError?.(new Error("Firebase לא זמין."));
      return;
    }

    unsubs.push(
      onSnapshot(
        query(collection(db, "contributions"), where("isChangeRequest", "==", true)),
        (snap) => {
          ingestContributionDocs(byId, snap);
          emit();
        },
        () => {
          unsubs.push(
            onSnapshot(doc(db, "contributions", INBOX_ID), (snap) => {
              const items = snap.data()?.items;
              if (items && typeof items === "object") {
                for (const [id, raw] of Object.entries(
                  items as Record<string, unknown>
                )) {
                  const parsed = parseRequest(raw, id);
                  if (parsed) rememberRequest(byId, parsed);
                }
              }
              emit();
            })
          );
        }
      )
    );
    unsubs.push(
      onSnapshot(doc(db, "contributions", INBOX_ID), (snap) => {
        const items = snap.data()?.items;
        if (items && typeof items === "object") {
          for (const [id, raw] of Object.entries(items as Record<string, unknown>)) {
            const parsed = parseRequest(raw, id);
            if (parsed) rememberRequest(byId, parsed);
          }
        }
        emit();
      })
    );
    unsubs.push(
      onSnapshot(
        collection(db, "editors"),
        (snap) => {
          ingestEditorDocs(byId, snap);
          emit();
        },
        () => undefined
      )
    );

    try {
      onList(await listChangeRequests());
    } catch (error) {
      onError?.(
        error instanceof Error ? error : new Error("טעינת הבקשות מהענן נכשלה")
      );
    }
  })();

  return () => {
    stopped = true;
    for (const stop of unsubs) stop();
  };
}

export function pendingCount(requests: ChangeRequest[]): number {
  return requests.filter((r) => r.status === "pending").length;
}

export const PENDING_NOTICE = `הבקשה נשלחה לאישור ${SITE_ADMIN_NAME} ולא תופיע באתר עד שיאשר.`;

async function queueRequest(
  user: ModerationUser,
  patch: Omit<
    ChangeRequest,
    | "id"
    | "status"
    | "requestedBy"
    | "requestedByName"
    | "requestedByEmail"
    | "createdAt"
  >
): Promise<SubmitResult> {
  const request: ChangeRequest = {
    id: newId(),
    status: "pending",
    requestedBy: user.uid,
    requestedByName: user.displayName,
    requestedByEmail: user.email,
    createdAt: new Date().toISOString(),
    ...patch,
  };
  await persistRequest(request);
  return { pending: true };
}

export async function requestOrApplyPersonSave(
  user: ModerationUser,
  person: Person,
  creditInputs: PersonCategoryCreditInput[],
  isNew: boolean
): Promise<SubmitResult> {
  if (isSiteAdmin(user)) {
    await savePerson(person, {
      userId: user.uid,
      userName: user.displayName,
      isNew,
      sourceNote: person.sourceNote,
    });
    await savePersonCategoryCredits(person.id, creditInputs, ACTIVITY_LIST, {
      userId: user.uid,
      userName: user.displayName,
    });
    return { pending: false };
  }
  return queueRequest(user, {
    action: isNew ? "create" : "update",
    entityType: "person",
    entityId: person.id,
    entityTitle: person.name,
    person,
    creditInputs,
  });
}

export async function requestOrApplyProductionSave(
  user: ModerationUser,
  production: Production,
  isNew: boolean
): Promise<SubmitResult> {
  if (isSiteAdmin(user)) {
    await saveProduction(production, {
      userId: user.uid,
      userName: user.displayName,
      isNew,
      sourceNote: production.sourceNote,
    });
    return { pending: false };
  }
  return queueRequest(user, {
    action: isNew ? "create" : "update",
    entityType: "production",
    entityId: production.id,
    entityTitle: production.title,
    production,
  });
}

export async function requestOrApplyDelete(
  user: ModerationUser,
  entityType: ChangeRequestEntity,
  entityId: string,
  entityTitle: string
): Promise<SubmitResult> {
  if (isSiteAdmin(user)) {
    if (entityType === "person") await deletePerson(entityId);
    else await deleteProduction(entityId);
    return { pending: false };
  }
  return queueRequest(user, {
    action: "delete",
    entityType,
    entityId,
    entityTitle,
  });
}

export async function requestOrApplyProductionCredits(
  user: ModerationUser,
  productionId: string,
  productionTitle: string,
  credits: Credit[]
): Promise<SubmitResult> {
  if (isSiteAdmin(user)) {
    await saveCreditsForProduction(productionId, credits);
    return { pending: false };
  }
  return queueRequest(user, {
    action: "update",
    entityType: "production",
    entityId: productionId,
    entityTitle: `${productionTitle} — קרדיטים`,
    credits,
  });
}

export async function approveChangeRequest(
  request: ChangeRequest,
  reviewer: ModerationUser
): Promise<void> {
  if (!isSiteAdmin(reviewer)) {
    throw new Error(`רק ${SITE_ADMIN_NAME} יכול לאשר בקשות.`);
  }
  const full = await hydrateChangeRequest(request);
  if (full.action === "delete") {
    if (full.entityType === "person") await deletePerson(full.entityId);
    else await deleteProduction(full.entityId);
  } else if (full.entityType === "person" && full.person) {
    await savePerson(full.person, {
      userId: full.requestedBy,
      userName: full.requestedByName,
      isNew: full.action === "create",
      sourceNote: full.person.sourceNote,
    });
    if (full.creditInputs) {
      await savePersonCategoryCredits(
        full.person.id,
        full.creditInputs,
        ACTIVITY_LIST,
        {
          userId: full.requestedBy,
          userName: full.requestedByName,
        }
      );
    }
  } else if (full.entityType === "production") {
    if (full.production) {
      await saveProduction(full.production, {
        userId: full.requestedBy,
        userName: full.requestedByName,
        isNew: full.action === "create",
        sourceNote: full.production.sourceNote,
      });
    }
    if (full.credits) {
      await saveCreditsForProduction(full.entityId, full.credits);
    }
    if (!full.production && !full.credits) {
      throw new Error(
        "לא ניתן לאשר בקשה חסרה — חסרים נתוני ההפקה. בקשו מהשולח לשלוח שוב."
      );
    }
  } else {
    throw new Error(
      "לא ניתן לאשר בקשה חסרה — חסרים נתוני הערך. בקשו מהשולח לשלוח שוב."
    );
  }

  await persistRequest({
    ...full,
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewer.uid,
  });
}

export async function rejectChangeRequest(
  request: ChangeRequest,
  reviewer: ModerationUser
): Promise<void> {
  if (!isSiteAdmin(reviewer)) {
    throw new Error(`רק ${SITE_ADMIN_NAME} יכול לדחות בקשות.`);
  }
  const full = await hydrateChangeRequest(request);
  await persistRequest({
    ...full,
    status: "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewer.uid,
  });
}
