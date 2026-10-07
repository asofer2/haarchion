import type { Person } from "./types";

const UA =
  "IshimAgent/1.0 (https://haarchion.vercel.app; educational daily catalog)";

const WINDOW = 40;
const NAME_CONCURRENCY = 4;
const MAX_HITS = 40;

export type DeathHit = {
  person: Person;
  deathDate: string;
  wikipediaUrl: string;
};

export type DeathScanInput = {
  people: Person[];
  /** Continue after this person id. Empty starts at the beginning. */
  resumeAfterId?: string;
  alreadyQueued: Set<string>;
  budgetMs?: number;
  now?: number;
};

export type DeathScanOutput = {
  living: number;
  checked: number;
  hits: DeathHit[];
  /** Next person id to check. Empty when the pass wrapped to the start. */
  resumeAfterId: string;
  wrapped: boolean;
};

type WikiPage = {
  title?: string;
  missing?: string;
  pageprops?: { wikibase_item?: string };
};

function normName(value: string): string {
  return value
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/[\u05BE\u2013\u2014\-־]/g, " ")
    .replace(/['׳״"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanDisplayName(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, "").replace(/_/g, " ").trim();
}

function wikiUrl(title: string): string {
  return `https://he.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function titleFromWikiUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "he.wikipedia.org") return undefined;
    const marker = "/wiki/";
    const at = parsed.pathname.indexOf(marker);
    if (at < 0) return undefined;
    const title = decodeURIComponent(parsed.pathname.slice(at + marker.length));
    const clean = title.replace(/_/g, " ").trim();
    return clean || undefined;
  } catch {
    return undefined;
  }
}

function wikiTime(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return undefined;
  if (match[2] === "00" || match[3] === "00") return match[1];
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function plausibleDeath(deathDate: string, birthDate?: string, now = Date.now()): boolean {
  const year = Number(deathDate.slice(0, 4));
  if (!Number.isInteger(year) || year < 1850) return false;
  const currentYear = new Date(now).getUTCFullYear();
  if (year > currentYear) return false;
  if (deathDate.length >= 10 && deathDate > new Date(now).toISOString().slice(0, 10)) return false;
  if (birthDate) {
    const born = Number(birthDate.slice(0, 4));
    if (Number.isInteger(born) && year < born) return false;
  }
  return true;
}

function looksLikePerson(description?: string, extract?: string): boolean {
  if (/^(סרט|סדרה|תוכנית|ערוץ|אלבום|ספר)/.test(description || "")) return false;
  const blob = `${description || ""} ${(extract || "").slice(0, 180)}`;
  return /שחק|מדבב|במאי|מנחה|תסריט|מפיק|זמר|קריין|מלחין|יוצר|נולד|נולדה/.test(blob);
}

async function wikiJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]);
    }
  }
  const workers = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

async function deathByTitles(titles: string[]): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (!titles.length) return found;
  const data = await wikiJson<{
    query?: {
      redirects?: { from: string; to: string }[];
      normalized?: { from: string; to: string }[];
      pages?: Record<string, WikiPage>;
    };
  }>(
    "https://he.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1" +
      `&titles=${titles.map((title) => encodeURIComponent(title)).join("|")}&format=json`
  );
  const alias = new Map<string, string>();
  for (const row of data?.query?.normalized || []) alias.set(row.from, row.to);
  for (const row of data?.query?.redirects || []) alias.set(row.from, row.to);
  const resolve = (title: string) => {
    let current = title;
    for (let step = 0; step < 4; step += 1) {
      const next = alias.get(current);
      if (!next || next === current) break;
      current = next;
    }
    return current;
  };
  const qidByTitle = new Map<string, string>();
  for (const page of Object.values(data?.query?.pages || {})) {
    const qid = page.pageprops?.wikibase_item;
    if (!page.title || !qid || page.missing !== undefined) continue;
    qidByTitle.set(page.title, qid);
  }
  const ids = [...new Set(qidByTitle.values())];
  if (!ids.length) return found;
  const entity = await wikiJson<{
    entities?: Record<
      string,
      { claims?: { P570?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[] } }
    >;
  }>(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=claims&format=json`
  );
  const deathByQid = new Map<string, string>();
  for (const qid of ids) {
    const time = entity?.entities?.[qid]?.claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time;
    const deathDate = wikiTime(time);
    if (deathDate) deathByQid.set(qid, deathDate);
  }
  for (const title of titles) {
    const qid = qidByTitle.get(resolve(title)) || qidByTitle.get(title);
    const deathDate = qid ? deathByQid.get(qid) : undefined;
    if (deathDate) found.set(title, deathDate);
  }
  return found;
}

async function exactPersonTitle(name: string): Promise<string | undefined> {
  const data = await wikiJson<[string, string[]]>(
    "https://he.wikipedia.org/w/api.php?action=opensearch&format=json&namespace=0&limit=4" +
      `&search=${encodeURIComponent(name)}`
  );
  const wanted = normName(name);
  const hits = (data?.[1] || []).filter((hit) => normName(cleanDisplayName(hit)) === wanted);
  const people: string[] = [];
  for (const hit of hits.slice(0, 3)) {
    const summary = await wikiJson<{
      title?: string;
      description?: string;
      extract?: string;
      type?: string;
    }>(`https://he.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit)}`);
    if (!summary || summary.type === "disambiguation") continue;
    if (!looksLikePerson(summary.description, summary.extract)) continue;
    people.push(summary.title || hit);
  }
  return people.length === 1 ? people[0] : undefined;
}

function queued(person: Person, alreadyQueued: Set<string>): boolean {
  return (
    alreadyQueued.has(`death:${person.id}`) ||
    alreadyQueued.has(`death:${normName(person.name)}`)
  );
}

/** Living catalog people whose Hebrew Wikipedia page records a death date. */
export async function scanLivingDeaths(input: DeathScanInput): Promise<DeathScanOutput> {
  const now = input.now ?? Date.now();
  const deadline = now + (input.budgetMs ?? 42_000);
  const living = input.people
    .filter((person) => person.name.trim() && !person.deathDate?.trim())
    .sort((a, b) => a.id.localeCompare(b.id));
  let start = 0;
  if (input.resumeAfterId) {
    const at = living.findIndex((person) => person.id === input.resumeAfterId);
    if (at >= 0) start = at + 1;
    else {
      const next = living.findIndex((person) => person.id.localeCompare(input.resumeAfterId!) > 0);
      start = next >= 0 ? next : 0;
    }
  }
  if (start >= living.length) start = 0;

  const hits: DeathHit[] = [];
  let checked = 0;
  let index = start;
  let wrapped = false;

  while (index < living.length && Date.now() < deadline && hits.length < MAX_HITS) {
    const window = living.slice(index, index + WINDOW);
    if (!window.length) break;
    const titled = window.map((person) => ({
      person,
      title: titleFromWikiUrl(person.wikipediaUrl),
    }));
    const known = titled.filter((row) => row.title);
    const unknown = titled.filter((row) => !row.title);
    const deathByTitle = await deathByTitles(known.map((row) => row.title as string));
    const resolvedNames = await mapPool(unknown, NAME_CONCURRENCY, async (row) => {
      if (Date.now() >= deadline) return undefined;
      return exactPersonTitle(row.person.name);
    });
    const namedTitles = resolvedNames.filter((title): title is string => Boolean(title));
    const namedDeaths = await deathByTitles(namedTitles);

    let stop = false;
    for (const row of window) {
      checked += 1;
      const knownTitle = titleFromWikiUrl(row.wikipediaUrl);
      const searched = knownTitle
        ? undefined
        : resolvedNames[unknown.findIndex((item) => item.person.id === row.id)];
      const title = knownTitle || searched;
      const deathDate = title
        ? knownTitle
          ? deathByTitle.get(knownTitle)
          : namedDeaths.get(title)
        : undefined;
      if (
        title &&
        deathDate &&
        plausibleDeath(deathDate, row.birthDate, now) &&
        !queued(row, input.alreadyQueued)
      ) {
        hits.push({
          person: row,
          deathDate,
          wikipediaUrl: row.wikipediaUrl || wikiUrl(title),
        });
      }
      index += 1;
      if (hits.length >= MAX_HITS) {
        stop = true;
        break;
      }
    }

    if (index >= living.length) wrapped = true;
    if (stop || wrapped) break;
  }

  const resumeAfterId =
    wrapped || index <= 0 || index >= living.length ? "" : living[index - 1]?.id || "";

  return {
    living: living.length,
    checked,
    hits,
    resumeAfterId,
    wrapped,
  };
}
