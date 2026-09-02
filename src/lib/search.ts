import { kindMatchesActivity } from "./filmography";
import {
  ACTIVITY_LABELS,
  ACTIVITY_SEARCH_ALIASES,
  productionKindLabel,
  type ActivityCategory,
  type ArchiveData,
  type Person,
  type Production,
  type ProductionKind,
} from "./types";

/** היקף חיפוש — אישים, סדרות, סרטים, ושאר הפקות */
export type SearchScope =
  | "all"
  | "people"
  | "series"
  | "films"
  | "productions";

export const SEARCH_SCOPE_LABELS: Record<SearchScope, string> = {
  all: "הכול",
  people: "אישים",
  series: "סדרות",
  films: "סרטים",
  productions: "הפקות",
};

export const SEARCH_SCOPE_LIST = Object.keys(
  SEARCH_SCOPE_LABELS
) as SearchScope[];

export type SearchResults = {
  people: Person[];
  series: Production[];
  films: Production[];
  productions: Production[];
};

/** נרמול טקסט לחיפוש עברי (ניקוד, מקפים, גרשיים) */
export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[\u05BE\u2013\u2014\-־]+/g, " ")
    .replace(/['׳״"„]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function blobMatches(blob: string, term: string): boolean {
  if (!term) return false;
  return normalizeSearchText(blob).includes(term);
}

export function isSeriesProduction(p: Production): boolean {
  return kindMatchesActivity(p.kind, "series");
}

export function isFilmProduction(p: Production): boolean {
  const kind = p.kind as ProductionKind;
  return (
    kind === "film" ||
    kind === "documentary" ||
    kind === "film_cinema" ||
    kind === "film_dubbed_foreign" ||
    kind === "film_student"
  );
}

function personSearchBlob(person: Person): string {
  const activities = person.activities || [];
  const activityLabels = activities.map(
    (a: ActivityCategory) => ACTIVITY_LABELS[a] || a
  );
  const aliases = activities.flatMap(
    (a: ActivityCategory) => ACTIVITY_SEARCH_ALIASES[a] || []
  );
  const noteText = (person.ishimNotes || [])
    .flatMap((n) => n.items)
    .join(" ");
  return [
    person.name,
    person.nameOriginal,
    ...(person.nicknames || []),
    ...(person.tags || []),
    person.bio,
    noteText,
    ...activityLabels,
    ...aliases,
  ]
    .filter(Boolean)
    .join(" ");
}

function productionSearchBlob(production: Production): string {
  return [
    production.title,
    production.originalTitle,
    production.summary,
    production.channel,
    production.studio,
    production.dubbingStudio,
    String(production.year || ""),
    production.endYear ? String(production.endYear) : "",
    productionKindLabel(production.kind),
    ...(production.genres || []),
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * חיפוש מאוחד בכל סוגי הערכים: אישים + סדרות + סרטים + שאר הפקות.
 * כולל שמות דמויות מקרדיטים.
 */
export function searchArchive(data: ArchiveData, query: string): SearchResults {
  const term = normalizeSearchText(query);
  const empty: SearchResults = {
    people: [],
    series: [],
    films: [],
    productions: [],
  };
  if (!term) return empty;

  const personById = new Map(data.people.map((p) => [p.id, p]));
  const productionById = new Map(data.productions.map((p) => [p.id, p]));

  const matchedPeople = new Set<string>();
  const matchedProductions = new Set<string>();

  for (const person of data.people) {
    if (blobMatches(personSearchBlob(person), term)) {
      matchedPeople.add(person.id);
    }
  }

  for (const production of data.productions) {
    if (blobMatches(productionSearchBlob(production), term)) {
      matchedProductions.add(production.id);
    }
  }

  // קרדיטים: שם דמות — מושך גם את האישיות וגם את ההפקה
  for (const credit of data.credits) {
    if (!credit.characterName || !blobMatches(credit.characterName, term)) {
      continue;
    }
    if (personById.has(credit.personId)) matchedPeople.add(credit.personId);
    if (productionById.has(credit.productionId)) {
      matchedProductions.add(credit.productionId);
    }
  }

  const byYearThenTitle = (a: Production, b: Production) =>
    b.year - a.year || a.title.localeCompare(b.title, "he");

  const people = data.people
    .filter((p) => matchedPeople.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, "he"));

  const series: Production[] = [];
  const films: Production[] = [];
  const productions: Production[] = [];

  for (const production of data.productions) {
    if (!matchedProductions.has(production.id)) continue;
    if (isSeriesProduction(production)) series.push(production);
    else if (isFilmProduction(production)) films.push(production);
    else productions.push(production);
  }

  series.sort(byYearThenTitle);
  films.sort(byYearThenTitle);
  productions.sort(byYearThenTitle);

  return { people, series, films, productions };
}

export function searchResultCount(results: SearchResults): number {
  return (
    results.people.length +
    results.series.length +
    results.films.length +
    results.productions.length
  );
}
