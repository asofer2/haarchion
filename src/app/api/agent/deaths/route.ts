import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getCachedFirestoreArchive } from "@/lib/archive-server";
import { AGENT_EMAIL, AGENT_NAME, ensureAgentUser } from "@/lib/agent-user";
import { scanLivingDeaths } from "@/lib/agent-death-scan";
import { wikiAgentNormName } from "@/lib/wiki-weekly-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim() || process.env.AGENT_CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function requestId(): string {
  return `cr-death-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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
  const archive = await getCachedFirestoreArchive();
  const pending = await db.collection("changeRequests").where("status", "==", "pending").get();
  const alreadyQueued = new Set<string>();
  for (const doc of pending.docs) {
    const row = doc.data();
    if (row.action !== "update" || row.entityType !== "person") continue;
    const id = String(row.entityId || "");
    const key = wikiAgentNormName(String(row.entityTitle || row.person?.name || ""));
    if (id) alreadyQueued.add(`death:${id}`);
    if (key) alreadyQueued.add(`death:${key}`);
  }

  const stateDoc = await db.collection("agentState").doc("deathDaily").get();
  const resumeAfterId = String(stateDoc.data()?.resumeAfterId || "");
  const scan = await scanLivingDeaths({
    people: archive.people,
    resumeAfterId,
    alreadyQueued,
  });

  const submitted: string[] = [];
  const now = new Date().toISOString();
  for (const hit of scan.hits) {
    const id = requestId();
    const payload = {
      id,
      status: "pending" as const,
      action: "update" as const,
      entityType: "person" as const,
      entityId: hit.person.id,
      entityTitle: `${hit.person.name} — פטירה ${hit.deathDate}`,
      requestedBy: agent.uid,
      requestedByName: AGENT_NAME,
      requestedByEmail: AGENT_EMAIL,
      createdAt: now,
      isChangeRequest: true,
      userId: agent.uid,
      userName: AGENT_NAME,
      at: now,
      citation: hit.wikipediaUrl,
      person: {
        ...hit.person,
        deathDate: hit.deathDate,
        wikipediaUrl: hit.person.wikipediaUrl || hit.wikipediaUrl,
        sourceUrl: hit.person.sourceUrl || hit.wikipediaUrl,
        updatedBy: agent.uid,
        updatedAt: now,
      },
    };
    const stored = stripUndefined(payload) as Record<string, unknown>;
    await db.collection("changeRequests").doc(id).set(stored);
    await db.collection("contributions").doc(id).set(stored);
    submitted.push(`${hit.person.name} (${hit.deathDate})`);
  }

  await db.collection("agentState").doc("deathDaily").set(
    {
      lastRunAt: now,
      resumeAfterId: scan.resumeAfterId,
      living: scan.living,
      checked: scan.checked,
      wrapped: scan.wrapped,
      submitted,
      agentUser: agent,
    },
    { merge: true }
  );

  return NextResponse.json({
    ok: true,
    agent,
    living: scan.living,
    checked: scan.checked,
    found: scan.hits.length,
    submitted,
    wrapped: scan.wrapped,
  });
}
