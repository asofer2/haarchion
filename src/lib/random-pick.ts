import type { Person, Production, ProductionKind } from "./types";
import {
  uniqueCalendarDays,
  uniqueCalendarYears,
} from "./year-calendar";

export const RANDOM_FILM_KINDS = new Set<ProductionKind>([
  "film",
  "film_cinema",
  "film_dubbed_foreign",
  "film_student",
  "documentary",
]);

export const RANDOM_SHOW_KINDS = new Set<ProductionKind>([
  "series",
  "tv_series",
  "tv_program",
  "miniseries",
  "series_israeli_foreign_dubbed",
]);

export const RANDOM_GAME_KINDS = new Set<ProductionKind>([
  "game_israeli",
  "game_dubbed_foreign",
]);

export function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export function randomFilmPath(productions: Production[]): string | undefined {
  const films = productions.filter((p) => RANDOM_FILM_KINDS.has(p.kind));
  const film = pickRandom(films);
  return film ? `/productions/${encodeURIComponent(film.id)}` : undefined;
}

export function randomShowPath(productions: Production[]): string | undefined {
  const shows = productions.filter((p) => RANDOM_SHOW_KINDS.has(p.kind));
  const show = pickRandom(shows);
  return show ? `/productions/${encodeURIComponent(show.id)}` : undefined;
}

export function randomGamePath(productions: Production[]): string | undefined {
  const games = productions.filter((p) => RANDOM_GAME_KINDS.has(p.kind));
  const game = pickRandom(games);
  return game ? `/productions/${encodeURIComponent(game.id)}` : undefined;
}

export function randomPersonPath(people: Person[]): string | undefined {
  const person = pickRandom(people);
  return person ? `/people/${encodeURIComponent(person.id)}` : undefined;
}

export function randomDayPath(people: Person[]): string | undefined {
  const day = pickRandom(uniqueCalendarDays(people));
  return day ? `/d/${day.month}/${day.day}` : undefined;
}

export function randomYearPath(people: Person[]): string | undefined {
  const year = pickRandom(uniqueCalendarYears(people));
  return year ? `/y/${year}` : undefined;
}
