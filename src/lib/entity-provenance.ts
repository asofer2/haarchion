import type { Contribution, Person, Production } from "@/lib/types";

export type ArchiveEntity = Person | Production;

export function contributorDisplayName(c: Contribution): string {
  if (c.userName?.trim()) return c.userName.trim();
  if (c.userId.startsWith("local-")) return c.userId.slice("local-".length);
  if (c.userId.startsWith("editor-")) return c.userId.slice("editor-".length);
  return "עורך/ת רשום/ה";
}

/** סימוכין של עדכון — citation חדש, או sourceNote ישן לתאימות */
export function contributionCitation(c: Contribution): string {
  return c.citation?.trim() || c.sourceNote?.trim() || "";
}

export function contributionsForEntity(
  contributions: Contribution[],
  entityType: "person" | "production",
  entityId: string
): Contribution[] {
  return contributions
    .filter((c) => c.entityType === entityType && c.entityId === entityId)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function entryAuthorsForEntity(
  entity: { entryAuthors?: string[] },
  contributions: Contribution[],
  entityType: "person" | "production",
  entityId: string
): string[] {
  const chronological = [...contributionsForEntity(contributions, entityType, entityId)].sort(
    (a, b) => a.at.localeCompare(b.at)
  );
  const seen = new Set<string>();
  const authors: string[] = [];

  for (const name of entity.entryAuthors || []) {
    const trimmed = name.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      authors.push(trimmed);
    }
  }
  for (const c of chronological) {
    const name = contributorDisplayName(c);
    if (!seen.has(name)) {
      seen.add(name);
      authors.push(name);
    }
  }
  return authors;
}

export function resolveEntitySource(
  entity: ArchiveEntity
): { note: string; url?: string } | null {
  if (entity.sourceNote?.trim()) {
    return {
      note: entity.sourceNote.trim(),
      url: entity.sourceUrl?.trim() || undefined,
    };
  }

  if ("wikipediaUrl" in entity && entity.wikipediaUrl) {
    return { note: "ויקיפדיה העברית", url: entity.wikipediaUrl };
  }

  if (entity.id.startsWith("ht-") || entity.id.startsWith("ht-game-")) {
    return { note: "ערוץ הופ תמיר" };
  }

  if ("channel" in entity && entity.channel?.includes("הופ תמיר")) {
    return { note: "ערוץ הופ תמיר" };
  }

  return null;
}

export function entityHistoryHref(
  entityType: "person" | "production",
  entityId: string
): string {
  const base =
    entityType === "person"
      ? `/people/${encodeURIComponent(entityId)}/history`
      : `/productions/${encodeURIComponent(entityId)}/history`;
  return base;
}
