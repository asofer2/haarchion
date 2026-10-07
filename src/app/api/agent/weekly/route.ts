import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getCachedFirestoreArchive } from "@/lib/archive-server";
import { AGENT_EMAIL, AGENT_NAME, ensureAgentUser } from "@/lib/agent-user";
import {
  scanCatalogDay,
  wikiAgentNormName,
  WIKI_AGENT_DAY_MS,
  type AgentDraft,
} from "@/lib/wiki-weekly-agent";
import { roleToActivity, type ArchiveData, type Person, type Production } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim() || process.env.AGENT_CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function stripUndefined(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined);
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

function requestId(): string {
  return `cr-agent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function creditInputsForPerson(personId: string, archive: ArchiveData) {
  const inputs = [];
  for (const credit of archive.credits) {
    if (credit.personId !== personId) continue;
    const production = archive.productions.find((item) => item.id === credit.productionId);
    if (!production?.title) continue;
    inputs.push({
      activity: roleToActivity(credit.role),
      role: credit.role,
      title: production.title,
      year: production.year || credit.year || undefined,
      characterName: credit.characterName || undefined,
    });
  }
  return inputs;
}

function payloadFor(
  draft: AgentDraft,
  id: string,
  uid: string,
  archive: ArchiveData
) {
  const now = new Date().toISOString();
  const base = {
    id,
    status: "pending" as const,
    requestedBy: uid,
    requestedByName: AGENT_NAME,
    requestedByEmail: AGENT_EMAIL,
    createdAt: now,
    isChangeRequest: true,
    userId: uid,
    userName: AGENT_NAME,
    at: now,
    citation: draft.wikipediaUrl,
    entityTitle: draft.title,
  };
  if (draft.kind === "production-create") {
    return {
      ...base,
      action: "create",
      entityType: "production",
      entityId: draft.production.id,
      production: {
        ...draft.production,
        airStatus: draft.production.airStatus || "ended",
        createdBy: draft.production.createdBy || uid,
        updatedBy: uid,
        updatedAt: now,
      },
      ...(draft.credits.length ? { credits: draft.credits } : {}),
      ...(draft.relatedPeople.length ? { relatedPeople: draft.relatedPeople } : {}),
    };
  }
  const updating = draft.kind === "death-update";
  return {
    ...base,
    action: updating ? "update" : "create",
    entityType: "person",
    entityId: draft.person.id,
    person: {
      ...draft.person,
      createdBy: draft.person.createdBy || uid,
      updatedBy: uid,
      updatedAt: now,
    },
    creditInputs: updating
      ? creditInputsForPerson(draft.person.id, archive)
      : draft.creditInputs?.length
        ? draft.creditInputs
        : undefined,
  };
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const db = getFirebaseAdminDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "firebase_admin_unset" },
      { status: 503 }
    );
  }

  const agent = await ensureAgentUser();
  const days = Number(request.nextUrl.searchParams.get("days") || "1");
  const windowMs = Math.min(Math.max(days, 1), 30) * 24 * 60 * 60 * 1000;
  const sinceMs = Date.now() - (Number.isFinite(windowMs) ? windowMs : WIKI_AGENT_DAY_MS);

  const archive = await getCachedFirestoreArchive();
  const peopleByName = new Map<string, Person>();
  for (const person of archive.people) {
    const key = wikiAgentNormName(person.name);
    if (key && !peopleByName.has(key)) peopleByName.set(key, person);
  }
  const productionTitles = new Set<string>();
  for (const production of archive.productions as Production[]) {
    const key = wikiAgentNormName(production.title);
    if (key) productionTitles.add(key);
  }

  const pending = await db.collection("changeRequests").where("status", "==", "pending").get();
  const alreadyQueued = new Set<string>();
  for (const doc of pending.docs) {
    const row = doc.data();
    const key = wikiAgentNormName(String(row.entityTitle || ""));
    if (!key) continue;
    if (row.action === "create" && row.entityType === "person") {
      alreadyQueued.add(`create:person:${key}`);
    } else if (row.action === "create" && row.entityType === "production") {
      alreadyQueued.add(`create:production:${key}`);
    } else if (row.action === "update" && row.entityType === "person") {
      alreadyQueued.add(`death:${key}`);
    }
  }

  const drafts = await scanCatalogDay({
    sinceMs,
    peopleByName,
    productionTitles,
    alreadyQueued,
  });

  const submitted: string[] = [];
  for (const draft of drafts) {
    const id = requestId();
    const payload = stripUndefined(payloadFor(draft, id, agent.uid, archive)) as Record<string, unknown>;
    await db.collection("changeRequests").doc(id).set(payload);
    await db.collection("contributions").doc(id).set(payload);
    submitted.push(`${draft.kind}: ${draft.title}`);
  }

  await db.collection("agentState").doc("wikiDaily").set(
    {
      lastRunAt: new Date().toISOString(),
      submitted,
      agentUser: agent,
    },
    { merge: true }
  );

  return NextResponse.json({
    ok: true,
    agent,
    found: drafts.length,
    submitted,
  });
}
