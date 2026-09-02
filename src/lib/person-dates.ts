import { PERSON_DATES } from "./seed-dates";
import { PERSON_DISCOGRAPHY } from "./seed-discography";
import { PERSON_WIKI_ENRICHMENT } from "./seed-wiki-enrichment";
import type { DiscographyItem, Person } from "./types";

export type { PersonDiscographyEntry } from "./seed-discography";

/** Apply Wikidata (or curated) birth/death onto a person without wiping existing values */
export function applyPersonDates(person: Person): Person {
  const known = PERSON_DATES[person.id];
  if (!known) return person;
  return {
    ...person,
    birthDate: person.birthDate || known.birthDate,
    deathDate: person.deathDate || known.deathDate,
  };
}

function mergeDiscography(
  existing: DiscographyItem[] | undefined,
  incoming: DiscographyItem[] | undefined
): DiscographyItem[] | undefined {
  if (!incoming?.length) return existing?.length ? existing : undefined;
  if (!existing?.length) return incoming;
  const key = (d: DiscographyItem) =>
    `${d.title.trim().toLowerCase()}|${d.year || ""}`;
  const map = new Map<string, DiscographyItem>();
  for (const item of [...existing, ...incoming]) {
    const k = key(item);
    if (!map.has(k)) map.set(k, item);
  }
  return [...map.values()].sort((a, b) => (b.year || 0) - (a.year || 0));
}

function isThinBio(bio?: string): boolean {
  if (!bio) return true;
  if (bio.length < 60) return true;
  return /ארכיון ערוץ הופ|לפי קטגוריית מדבבים|מדבב\/ת ועורך/.test(bio);
}

export function applyPersonEnrichment(person: Person): Person {
  if (person.ishimClassic) {
    return applyPersonDates(person);
  }
  let next = applyPersonDates(person);
  const wiki = PERSON_WIKI_ENRICHMENT[person.id];
  if (wiki) {
    next = {
      ...next,
      wikipediaUrl: next.wikipediaUrl || wiki.wikipediaUrl,
      bio:
        wiki.bio && (isThinBio(next.bio) || (wiki.bio.length > (next.bio?.length || 0) + 40))
          ? wiki.bio
          : next.bio,
    };
  }
  const disc = PERSON_DISCOGRAPHY[person.id];
  if (!disc) return next;
  return {
    ...next,
    wikipediaUrl: next.wikipediaUrl || disc.wikipediaUrl,
    discography: mergeDiscography(next.discography, disc.items),
  };
}

export function applyPeopleEnrichment(people: Person[]): Person[] {
  return people.map(applyPersonEnrichment);
}

/** @deprecated use applyPeopleEnrichment */
export function applyPeopleDates(people: Person[]): Person[] {
  return applyPeopleEnrichment(people);
}
