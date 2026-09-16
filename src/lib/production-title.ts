import type { Production, ProductionKind } from "./types";

/** En-dash for year ranges (Hebrew-friendly). */
const EN_DASH = "\u2013";

/** Title already ends with (YYYY) or (YYYY–YYYY) / (YYYY-YYYY). */
const TITLE_YEAR_SUFFIX =
  /\(\s*\d{4}(?:\s*[\u2013\u2014\-־–]\s*\d{0,4})?\s*\)\s*$/u;

const SERIES_KINDS = new Set<ProductionKind>([
  "series",
  "miniseries",
  "tv_series",
  "series_israeli_foreign_dubbed",
  "tv_program",
]);

const FILM_KINDS = new Set<ProductionKind>([
  "film",
  "documentary",
  "film_cinema",
  "film_dubbed_foreign",
  "film_student",
]);

const RADIO_KINDS = new Set<ProductionKind>(["radio", "radio_program"]);

/** Kinds that show activity years on the display title. */
export function showsActivityYearsInTitle(
  kind: ProductionKind | string
): boolean {
  const k = kind as ProductionKind;
  return (
    SERIES_KINDS.has(k) ||
    FILM_KINDS.has(k) ||
    RADIO_KINDS.has(k) ||
    k === "ensemble"
  );
}

/** Format year or range: `2008`, `2008–2014`. Missing endYear → start only. */
export function formatProductionYears(
  year: number,
  endYear?: number | null
): string {
  if (!year || !Number.isFinite(year)) return "";
  if (endYear && endYear !== year) {
    return `${year}${EN_DASH}${endYear}`;
  }
  return String(year);
}

/**
 * Classic ishim cast years: `[2009]` or `[1989–1995]`.
 * Empty when there is no usable year.
 */
export function formatCreditYearsBracket(
  year: number,
  endYear?: number | null
): string {
  const inner = formatProductionYears(year, endYear);
  return inner ? `[${inner}]` : "";
}

/** True when the production is a single year (no distinct end year). */
export function productionHasSingleYear(
  production: Pick<Production, "year" | "endYear">
): boolean {
  const { year, endYear } = production;
  if (!year || !Number.isFinite(year)) return true;
  return !endYear || endYear === year;
}

function titleAlreadyHasYears(title: string): boolean {
  return TITLE_YEAR_SUFFIX.test(title.trim());
}

/**
 * Display title with activity years in parentheses for series, films,
 * radio and ensembles — e.g. `רמזור (2008–2014)` or `סרט X (1999)`.
 * Does not mutate stored seed titles.
 */
export function formatProductionTitle(
  production: Pick<Production, "title" | "year" | "endYear" | "kind">
): string {
  const title = (production.title || "").trim();
  if (!title) return title;
  if (!showsActivityYearsInTitle(production.kind)) return title;
  if (titleAlreadyHasYears(title)) return title;

  const years = formatProductionYears(production.year, production.endYear);
  if (!years) return title;
  return `${title} (${years})`;
}
