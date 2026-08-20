import {
  ACTIVITY_LABELS,
  ACTIVITY_LIST,
  type ActivityCategory,
  type Person,
  type Production,
} from "./types";

export type CountedName = { name: string; count: number };

function counted(values: string[]): CountedName[] {
  const map = new Map<string, number>();
  for (const value of values) {
    const name = value.trim();
    if (!name) continue;
    map.set(name, (map.get(name) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export function listChannels(productions: Production[]): CountedName[] {
  return counted(productions.map((p) => p.channel || ""));
}

export function listGenres(productions: Production[]): CountedName[] {
  return counted(productions.flatMap((p) => p.genres || []));
}

export function listPersonTags(people: Person[]): CountedName[] {
  return counted(people.flatMap((p) => p.tags || []));
}

export function activityKeyItems(): { name: string; slug: ActivityCategory }[] {
  return ACTIVITY_LIST.map((slug) => ({
    slug,
    name: ACTIVITY_LABELS[slug],
  }));
}

export function decodeListName(
  raw: string | string[] | undefined
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function listHref(base: string, name: string): string {
  return `${base}/${encodeURIComponent(name)}`;
}

export function namesMatch(stored: string, wanted: string): boolean {
  return stored === wanted || stored.trim() === wanted.trim();
}
