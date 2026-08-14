import type { ArchiveData, Credit, Person, Production } from "./types";
import { canonicalPersonId, canonicalPersonName } from "./aliases";

/** Normalize Hebrew display names for duplicate detection */
export function normalizePersonName(name: string): string {
  const canonical = canonicalPersonName(name);
  return canonical
    .trim()
    .replace(/[\u05BE\u2013\u2014\-־]+/g, " ")
    .replace(/['׳״"]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function scorePerson(p: Person): number {
  let score = 0;
  if (p.imageUrl && !p.imageUrl.includes("image/svg")) score += 5;
  if (p.imageUrl?.startsWith("/images/")) score += 8;
  if (p.bio?.length > 40) score += 3;
  if (p.nameOriginal) score += 2;
  if (p.birthDate) score += 2;
  if ((p.activities || []).length) score += p.activities.length;
  if (!p.id.endsWith("-w2") && !p.id.includes("-w2")) score += 10;
  if (/^[a-z0-9-]+$/i.test(p.id)) score += 2;
  return score;
}

function mergePerson(a: Person, b: Person): Person {
  const prefer = scorePerson(a) >= scorePerson(b) ? a : b;
  const other = prefer === a ? b : a;
  return {
    ...other,
    ...prefer,
    id: prefer.id,
    name: prefer.name || other.name,
    nameOriginal: prefer.nameOriginal || other.nameOriginal,
    bio: (prefer.bio?.length || 0) >= (other.bio?.length || 0) ? prefer.bio : other.bio,
    imageUrl: prefer.imageUrl || other.imageUrl,
    birthDate: prefer.birthDate || other.birthDate,
    deathDate: prefer.deathDate || other.deathDate,
    nicknames: [...new Set([...(prefer.nicknames || []), ...(other.nicknames || [])])],
    tags: [...new Set([...(prefer.tags || []), ...(other.tags || [])])],
    activities: [...new Set([...(prefer.activities || []), ...(other.activities || [])])],
    wikipediaUrl: prefer.wikipediaUrl || other.wikipediaUrl,
    createdAt: prefer.createdAt < other.createdAt ? prefer.createdAt : other.createdAt,
    updatedAt: prefer.updatedAt > other.updatedAt ? prefer.updatedAt : other.updatedAt,
    createdBy: prefer.createdBy || other.createdBy,
    updatedBy: prefer.updatedBy || other.updatedBy,
  };
}

/**
 * Collapse duplicate people (same Hebrew name) into one record
 * and remap credits/contributions to the surviving id.
 */
export function dedupeArchive(data: ArchiveData): ArchiveData {
  const byName = new Map<string, Person[]>();
  for (const person of data.people) {
    const key = normalizePersonName(person.name);
    if (!key) continue;
    const list = byName.get(key) || [];
    // Apply known id aliases up-front
    list.push({ ...person, id: canonicalPersonId(person.id) });
    byName.set(key, list);
  }

  const idRedirect = new Map<string, string>();
  const people: Person[] = [];

  for (const group of byName.values()) {
    let winner = group[0]!;
    for (let i = 1; i < group.length; i++) {
      winner = mergePerson(winner, group[i]!);
    }
    // Prefer canonical id without -w2 if present in group
    const canonical =
      group.find((p) => !p.id.includes("-w2") && scorePerson(p) >= scorePerson(winner) - 5)?.id ||
      winner.id.replace(/-w2$/i, "");
    const finalId =
      group.some((p) => p.id === canonical) || !group.some((p) => p.id === winner.id)
        ? group.find((p) => !p.id.includes("-w2"))?.id || winner.id.replace(/-w2$/i, "") || winner.id
        : winner.id.replace(/-w2$/i, "");

    const resolvedId = finalId || winner.id;
    for (const p of group) {
      if (p.id !== resolvedId) idRedirect.set(p.id, resolvedId);
    }
    people.push({
      ...winner,
      id: resolvedId,
      name: canonicalPersonName(winner.name),
      nicknames: [
        ...new Set([
          ...(winner.nicknames || []),
          // keep former names as nicknames when aliased
          ...(winner.name !== canonicalPersonName(winner.name)
            ? [winner.name]
            : []),
        ]),
      ],
    });
  }

  // Also redirect lingering *-w2 ids even if name somehow differed
  for (const person of people) {
    if (person.id.endsWith("-w2")) {
      const base = person.id.replace(/-w2$/i, "");
      if (people.some((p) => p.id === base)) {
        idRedirect.set(person.id, base);
      }
    }
  }

  const peopleFinal = people.filter((p) => {
    if (p.id.endsWith("-w2")) {
      const base = p.id.replace(/-w2$/i, "");
      if (people.some((x) => x.id === base && x !== p)) return false;
    }
    return true;
  });

  // Dedupe by id after merges
  const byId = new Map<string, Person>();
  for (const p of peopleFinal) {
    const existing = byId.get(p.id);
    byId.set(p.id, existing ? mergePerson(existing, p) : p);
  }

  const mapId = (id: string) => {
    let cur = canonicalPersonId(id);
    const seen = new Set<string>();
    while (idRedirect.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      cur = canonicalPersonId(idRedirect.get(cur)!);
    }
    if (cur.endsWith("-w2")) {
      const base = cur.replace(/-w2$/i, "");
      if (byId.has(base)) return base;
    }
    return cur;
  };

  const creditKey = (c: Credit) => `${c.productionId}_${c.personId}_${c.role}`;
  const creditMap = new Map<string, Credit>();
  for (const c of data.credits) {
    const next: Credit = {
      ...c,
      personId: mapId(c.personId),
      productionId: c.productionId,
    };
    creditMap.set(creditKey(next), next);
  }

  const prodMap = new Map<string, Production>();
  for (const p of data.productions) {
    if (!prodMap.has(p.id)) prodMap.set(p.id, p);
  }

  return {
    people: [...byId.values()],
    productions: [...prodMap.values()],
    credits: [...creditMap.values()],
    contributions: (data.contributions || []).map((c) => ({
      ...c,
      entityId: c.entityType === "person" ? mapId(c.entityId) : c.entityId,
    })),
  };
}
