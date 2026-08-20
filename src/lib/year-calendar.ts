import type { Person } from "./types";

export const HEBREW_MONTHS = [
  "",
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
] as const;

export function hebrewDayTitle(month: number, day: number): string {
  const name = HEBREW_MONTHS[month];
  if (!name) return `${day}/${month}`;
  return `${day} ב${name}`;
}

export function parseMonthDayParam(
  monthRaw: string | string[] | undefined,
  dayRaw: string | string[] | undefined
): { month: number; day: number } | null {
  const monthValue = Array.isArray(monthRaw) ? monthRaw[0] : monthRaw;
  const dayValue = Array.isArray(dayRaw) ? dayRaw[0] : dayRaw;
  const month = Number(monthValue);
  const day = Number(dayValue);
  if (!Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(2000, month - 1, day);
  if (probe.getMonth() !== month - 1 || probe.getDate() !== day) return null;
  return { month, day };
}

export function shiftCalendarDay(
  month: number,
  day: number,
  delta: number
): { month: number; day: number } {
  const date = new Date(2000, month - 1, day);
  date.setDate(date.getDate() + delta);
  return { month: date.getMonth() + 1, day: date.getDate() };
}

export function monthDayFromIso(
  iso?: string
): { month: number; day: number } | undefined {
  if (!iso) return undefined;
  const parts = iso.split("-");
  const month = parts[1] ? Number(parts[1]) : 0;
  const day = parts[2] ? Number(parts[2]) : 0;
  if (!month || !day) return undefined;
  return { month, day };
}

export function peopleBornOnDay(
  people: Person[],
  month: number,
  day: number
): Person[] {
  return people
    .filter((person) => {
      const md = monthDayFromIso(person.birthDate);
      return md?.month === month && md.day === day;
    })
    .sort((a, b) => (yearFromIso(a.birthDate) || 0) - (yearFromIso(b.birthDate) || 0));
}

export function peopleDiedOnDay(
  people: Person[],
  month: number,
  day: number
): Person[] {
  return people
    .filter((person) => {
      const md = monthDayFromIso(person.deathDate);
      return md?.month === month && md.day === day;
    })
    .sort((a, b) => (yearFromIso(a.deathDate) || 0) - (yearFromIso(b.deathDate) || 0));
}

export function uniqueCalendarDays(
  people: Person[]
): { month: number; day: number }[] {
  const seen = new Set<string>();
  const days: { month: number; day: number }[] = [];
  for (const person of people) {
    for (const iso of [person.birthDate, person.deathDate]) {
      const md = monthDayFromIso(iso);
      if (!md) continue;
      const key = `${md.month}-${md.day}`;
      if (seen.has(key)) continue;
      seen.add(key);
      days.push(md);
    }
  }
  return days;
}

export function uniqueCalendarYears(people: Person[]): number[] {
  const years = new Set<number>();
  for (const person of people) {
    const born = yearFromIso(person.birthDate);
    const died = yearFromIso(person.deathDate);
    if (born) years.add(born);
    if (died) years.add(died);
  }
  return [...years].sort((a, b) => a - b);
}


/** Year from an ISO date that may be YYYY, YYYY-MM, or YYYY-MM-DD. */
export function yearFromIso(iso?: string): number | undefined {
  if (!iso) return undefined;
  const match = /^(\d{4})/.exec(iso.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  if (year < 1000 || year > 9999) return undefined;
  return year;
}

export function parseYearParam(
  raw: string | string[] | undefined
): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  if (year < 1000 || year > 2100) return null;
  return year;
}

function dateKey(iso?: string): [number, number] {
  if (!iso) return [99, 99];
  const [, monthPart, dayPart] = iso.split("-");
  const month = monthPart ? Number(monthPart) : 99;
  const day = dayPart ? Number(dayPart) : 99;
  return [month || 99, day || 99];
}

function comparePeopleByIsoDate(
  a: Person,
  b: Person,
  isoOf: (person: Person) => string | undefined
): number {
  const [am, ad] = dateKey(isoOf(a));
  const [bm, bd] = dateKey(isoOf(b));
  if (am !== bm) return am - bm;
  if (ad !== bd) return ad - bd;
  return a.name.localeCompare(b.name, "he");
}

export function peopleBornInYear(people: Person[], year: number): Person[] {
  return people
    .filter((person) => yearFromIso(person.birthDate) === year)
    .sort((a, b) => comparePeopleByIsoDate(a, b, (p) => p.birthDate));
}

export function peopleDiedInYear(people: Person[], year: number): Person[] {
  return people
    .filter((person) => yearFromIso(person.deathDate) === year)
    .sort((a, b) => comparePeopleByIsoDate(a, b, (p) => p.deathDate));
}

/** Ishim-style day/month; year is already the page title. */
export function compactDayMonth(iso?: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  const month = parts[1] ? Number(parts[1]) : 0;
  const day = parts[2] ? Number(parts[2]) : 0;
  if (day && month) return `${day}/${month}`;
  if (month) return String(month);
  return "";
}
