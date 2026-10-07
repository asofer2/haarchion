import { portrait } from "./portrait";
import { slugify } from "./ids";
import type {
  ActivityCategory,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";

const UA =
  "IshimAgent/1.0 (https://haarchion.vercel.app; educational daily catalog)";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_NEW_PEOPLE = 8;
const MAX_NEW_PRODUCTIONS = 4;
const MAX_CAST = 8;
const MAX_DEATHS = 8;

const PERSON_CATEGORIES: { category: string; activity: ActivityCategory; gender?: "male" | "female" }[] = [
  { category: "מדבבים ישראלים", activity: "dubbing", gender: "male" },
  { category: "מדבבות ישראליות", activity: "dubbing", gender: "female" },
  { category: "שחקנים ישראלים", activity: "acting", gender: "male" },
  { category: "שחקניות ישראליות", activity: "acting", gender: "female" },
];

const SHOW_CATEGORIES = [
  "סדרות הנפשה ישראליות",
  "סדרות טלוויזיה ישראליות",
  "סרטי קולנוע ישראליים",
];

const EDB_PAGES = [
  "https://www.edb.co.il/browse/b/c/israel/t/movies/v/new/",
  "https://www.edb.co.il/browse/b/c/israel/t/tvshows/",
  "https://www.edb.co.il/browse/b/t/tvshows/m/screens/v/new/",
];

const ROLE_HEADING: Record<CreditRole, string> = {
  actor: "שחקן",
  dubber: "מדבב",
  director: "במאי",
  dub_director: "במאי דיבוב",
  writer: "תסריטאי",
  producer: "מפיק",
  composer: "מלחין",
  host: "מנחה",
  singer: "זמר",
  musical_performer: "מחזמר",
  cinematographer: "צלם",
};

const FIELD_ROLES: { key: RegExp; role: CreditRole }[] = [
  { key: /^(מדבבים|מדבב|מדבבות|מדבבת|דיבוב)$/, role: "dubber" },
  { key: /^(שחקנים|שחקן|שחקניות|שחקנית)$/, role: "actor" },
  { key: /^(בימוי דיבוב|במאי דיבוב|במאית דיבוב|בימוי קולות)$/, role: "dub_director" },
  { key: /^(בימוי|במאי|במאית)$/, role: "director" },
  { key: /^(תסריט|תסריטאי|תסריטאית|כתיבה)$/, role: "writer" },
  { key: /^(הפקה|מפיק|מפיקה|מפיקים)$/, role: "producer" },
  { key: /^(מוזיקה|מלחין|מלחינה)$/, role: "composer" },
  { key: /^(מנחה|מגיש|מגישה)$/, role: "host" },
];

export type AgentCreditInput = {
  activity: ActivityCategory;
  role: CreditRole;
  title: string;
  year?: number;
  characterName?: string;
};

export type AgentDraft =
  | {
      kind: "person-create";
      title: string;
      wikipediaUrl: string;
      person: Person;
      creditInputs?: AgentCreditInput[];
    }
  | {
      kind: "production-create";
      title: string;
      wikipediaUrl: string;
      production: Production;
      credits: Credit[];
      relatedPeople: Person[];
    }
  | {
      kind: "death-update";
      title: string;
      wikipediaUrl: string;
      person: Person;
      deathDate: string;
    };

export type CastMention = {
  name: string;
  role: CreditRole;
  heading: string;
  characterName?: string;
};

type WikiMember = { title: string; timestamp: string };

function normName(value: string): string {
  return value
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/[\u05BE\u2013\u2014\-־]/g, " ")
    .replace(/['׳״"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function wikiUrl(title: string): string {
  return `https://he.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function clip(text: string | undefined, max = 700): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function yearFrom(text: string): number | undefined {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

function activityFor(role: CreditRole): ActivityCategory {
  if (role === "dubber" || role === "dub_director") return "dubbing";
  if (role === "actor") return "acting";
  if (role === "host") return "hosting";
  if (role === "singer" || role === "musical_performer") return "musical";
  return "film";
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

async function recentCategoryMembers(
  category: string,
  sinceMs: number
): Promise<WikiMember[]> {
  const url =
    "https://he.wikipedia.org/w/api.php?action=query&list=categorymembers" +
    `&cmtitle=${encodeURIComponent(`קטגוריה:${category}`)}` +
    "&cmnamespace=0&cmprop=title|timestamp&cmsort=timestamp&cmdir=desc&cmlimit=8&format=json";
  const data = await wikiJson<{
    query?: { categorymembers?: WikiMember[] };
  }>(url);
  return (data?.query?.categorymembers || []).filter(
    (member) => Date.parse(member.timestamp) >= sinceMs
  );
}

type Summary = {
  title?: string;
  extract?: string;
  description?: string;
  type?: string;
};

async function pageSummary(title: string): Promise<Summary | null> {
  const data = await wikiJson<Summary>(
    `https://he.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
  if (!data || data.type === "disambiguation") return null;
  return data;
}

async function pageWikitext(title: string): Promise<string> {
  const data = await wikiJson<{
    parse?: { wikitext?: string | { "*"?: string } };
  }>(
    "https://he.wikipedia.org/w/api.php?action=parse&prop=wikitext&format=json" +
      `&page=${encodeURIComponent(title)}`
  );
  const raw = data?.parse?.wikitext;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw["*"] || "";
}

function wikiTime(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return undefined;
  if (match[2] === "00" || match[3] === "00") return match[1];
  return `${match[1]}-${match[2]}-${match[3]}`;
}

async function wikiDates(title: string): Promise<{
  birthDate?: string;
  deathDate?: string;
}> {
  const pages = await wikiJson<{
    query?: {
      pages?: Record<string, { pageprops?: { wikibase_item?: string } }>;
    };
  }>(
    "https://he.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item" +
      `&titles=${encodeURIComponent(title)}&format=json`
  );
  const item = Object.values(pages?.query?.pages || {})[0]?.pageprops
    ?.wikibase_item;
  if (!item) return {};
  const entity = await wikiJson<{
    entities?: Record<
      string,
      {
        claims?: {
          P569?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[];
          P570?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[];
        };
      }
    >;
  }>(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${item}&props=claims&format=json`
  );
  const claims = entity?.entities?.[item]?.claims;
  return {
    birthDate: wikiTime(claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time),
    deathDate: wikiTime(claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time),
  };
}

function cleanDisplayName(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, "").replace(/_/g, " ").trim();
}

function inferGender(text: string): "male" | "female" | undefined {
  if (/היא (שחקנית|מדבבת|במאית|מנחה|תסריטאית|מפיקה)/.test(text)) return "female";
  if (/הוא (שחקן|מדבב|במאי|מנחה|תסריטאי|מפיק)/.test(text)) return "male";
  return undefined;
}

function looksLikePerson(summary: Summary): boolean {
  const blob = `${summary.description || ""} ${(summary.extract || "").slice(0, 180)}`;
  if (/^(סרט|סדרה|תוכנית|ערוץ|אלבום|ספר)/.test(summary.description || "")) return false;
  return /שחק|מדבב|במאי|מנחה|תסריט|מפיק|זמר|קריין|מלחין|יוצר/.test(blob);
}

function personRecord(
  title: string,
  summary: Summary,
  activity: ActivityCategory,
  dates: { birthDate?: string; deathDate?: string },
  gender?: "male" | "female"
): Person {
  const now = new Date().toISOString();
  const name = cleanDisplayName(title) || title;
  return {
    id: slugify(name) || slugify(title),
    name,
    nicknames: [],
    bio: clip(summary.extract) || clip(summary.description) || "",
    tags: ["ויקיפדיה"],
    activities: [activity],
    gender: gender || inferGender(`${summary.description || ""} ${summary.extract || ""}`),
    birthDate: dates.birthDate,
    deathDate: dates.deathDate,
    wikipediaUrl: wikiUrl(title),
    imageUrl: portrait(name),
    sourceNote: "ויקיפדיה",
    sourceUrl: wikiUrl(title),
    createdAt: now,
    updatedAt: now,
  };
}

function stripWikiNoise(value: string): string {
  return value
    .replace(/<ref[\s\S]*?<\/ref>/gi, " ")
    .replace(/\{\{הערה\|[\s\S]*?\}\}/g, " ")
    .replace(/\{\{ש\}\}/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\{\{דגל\|[^}]*\}\}/g, " ");
}

function infoboxBody(wikitext: string): string {
  const start = wikitext.search(
    /\{\{(?:תוכנית טלוויזיה|סרט קולנוע|סרט|אישיות משחק|סרט טלוויזיה)/
  );
  if (start < 0) return "";
  const slice = wikitext.slice(start);
  const end = slice.search(/\n\}\}/);
  return end > 0 ? slice.slice(0, end) : slice.slice(0, 5000);
}

function infoboxFields(body: string): { key: string; value: string }[] {
  return body
    .split(/\n\|/)
    .slice(1)
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq < 0) return undefined;
      return {
        key: part.slice(0, eq).trim(),
        value: part.slice(eq + 1).trim(),
      };
    })
    .filter((row): row is { key: string; value: string } => Boolean(row?.key));
}

function wikiLinks(segment: string): string[] {
  const names: string[] = [];
  const re = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(segment))) {
    const name = cleanDisplayName(match[1] || "");
    if (!name || name.includes(":")) continue;
    names.push(name);
  }
  return names;
}

function plainName(segment: string): string | undefined {
  const bare = segment
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!bare || bare.length > 40 || !/[\u0590-\u05FF]/.test(bare)) return undefined;
  if (bare.split(" ").length < 2) return undefined;
  return bare;
}

function characterFromSegment(segment: string): string | undefined {
  const role = segment.match(/בתפקיד\s+([^)\]\n]{2,40})/);
  if (role) return role[1].trim();
  const paren = segment.match(/\(([^)]{2,40})\)/);
  if (!paren) return undefined;
  const note = paren[1].trim();
  if (/בימוי|קולות|דיבוב|שחק|מדבב|במאי/.test(note)) return undefined;
  return note;
}

function roleForSegment(segment: string, fallback: CreditRole): CreditRole {
  if (/בימוי קולות|במאי דיבוב|במאית דיבוב/.test(segment)) return "dub_director";
  return fallback;
}

/** שמות ותפקידים מתיבת המידע ומהמשפט הפותח. */
export function parseWikiCast(wikitext: string, extract = ""): CastMention[] {
  const found: CastMention[] = [];
  const seen = new Set<string>();
  const push = (name: string, role: CreditRole, characterName?: string) => {
    const clean = cleanDisplayName(name);
    const key = `${normName(clean)}|${role}|${characterName || ""}`;
    if (!clean || seen.has(key)) return;
    seen.add(key);
    found.push({
      name: clean,
      role,
      heading: ROLE_HEADING[role],
      characterName: characterName?.trim() || undefined,
    });
  };

  for (const field of infoboxFields(infoboxBody(wikitext))) {
    const mapped = FIELD_ROLES.find((row) => row.key.test(field.key));
    if (!mapped) continue;
    for (const segment of stripWikiNoise(field.value).split("\n")) {
      const role = roleForSegment(segment, mapped.role);
      const characterName = characterFromSegment(segment);
      const linked = wikiLinks(segment);
      if (linked.length) {
        for (const name of linked) push(name, role, characterName);
      } else {
        const plain = plainName(segment);
        if (plain) push(plain, role, characterName);
      }
    }
  }

  const lead = `${extract}\n${wikitext.slice(0, 2500)}`;
  const dubbed = lead.match(
    /בשם ([^.\n|]{2,40}?) המדובב(?:ת)? על ידי (?:\[\[)?([^\]|\n.]{2,40})/
  );
  if (dubbed) {
    const characterName = dubbed[1].replace(/\[\[|\]\]/g, "").trim();
    const name = cleanDisplayName(dubbed[2]);
    const existing = found.find(
      (row) => row.role === "dubber" && normName(row.name) === normName(name)
    );
    if (existing && !existing.characterName) existing.characterName = characterName;
    else if (!existing) push(name, "dubber", characterName);
  }

  const director = lead.match(/בבימוי(?:ו|ה)? של (?:\[\[)?([^\]|\n.]{2,40})/);
  if (director) push(cleanDisplayName(director[1]), "director");
  const voiceDirector = lead.match(
    /\[\[([^\]|]+)\]\] שביים(?:ה|ו)? את הקולות/
  );
  if (voiceDirector) push(cleanDisplayName(voiceDirector[1]), "dub_director");

  return found.slice(0, MAX_CAST);
}

export function parseSubjectCredits(wikitext: string): AgentCreditInput[] {
  const credits: AgentCreditInput[] = [];
  const seen = new Set<string>();
  const patterns: { re: RegExp; role: CreditRole }[] = [
    {
      re: /(?:בשנת |בשנים )?((?:19|20)\d{2})?(?:[–\-](?:19|20)\d{2})?[^.\n]{0,40}?דיבב(?:ה|ו)? את ([^.\n]{1,30}?) ב(?:סרט|סדרה|הצגה)?\s*(?:״|"|„|«)?\[\[([^\]|]+)/g,
      role: "dubber",
    },
    {
      re: /(?:בשנת |בשנים )?((?:19|20)\d{2})?(?:[–\-](?:19|20)\d{2})?[^.\n]{0,50}?גילם(?:ה|ו)? את ([^.\n]{1,40}?) ב(?:סרט|סדרה|עונה|הצגה)?\s*(?:״|"|„|«)?\[\[([^\]|]+)/g,
      role: "actor",
    },
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.re.exec(wikitext))) {
      const title = cleanDisplayName(match[3] || "");
      const characterName = (match[2] || "").replace(/\[\[|\]\]/g, "").trim();
      const key = `${normName(title)}|${pattern.role}|${characterName}`;
      if (!title || seen.has(key)) continue;
      seen.add(key);
      const year = match[1] ? Number(match[1]) : undefined;
      credits.push({
        activity: activityFor(pattern.role),
        role: pattern.role,
        title,
        year,
        characterName: characterName || undefined,
      });
      if (credits.length >= 8) return credits;
    }
  }
  const reversed: { re: RegExp; role: CreditRole }[] = [
    {
      re: /בשנת ((?:19|20)\d{2})[^.\n]{0,160}?\[\[([^\]|]+)\]\]["״'׳,\s]{0,8}גילם(?:ה|ו)? את ([^.\n,]{1,40})/g,
      role: "actor",
    },
    {
      re: /בשנת ((?:19|20)\d{2})[^.\n]{0,160}?\[\[([^\]|]+)\]\]["״'׳,\s]{0,8}דיבב(?:ה|ו)? את ([^.\n,]{1,40})/g,
      role: "dubber",
    },
  ];
  for (const pattern of reversed) {
    let match: RegExpExecArray | null;
    while ((match = pattern.re.exec(wikitext))) {
      const title = cleanDisplayName(match[2] || "");
      if (/^(HOT|yes|ערוץ)/i.test(title)) continue;
      const characterName = (match[3] || "").trim();
      const key = `${normName(title)}|${pattern.role}|${characterName}`;
      if (!title || seen.has(key)) continue;
      seen.add(key);
      credits.push({
        activity: activityFor(pattern.role),
        role: pattern.role,
        title,
        year: Number(match[1]),
        characterName: characterName || undefined,
      });
      if (credits.length >= 8) return credits;
    }
  }
  return credits;
}

function fieldValue(fields: { key: string; value: string }[], key: RegExp): string {
  return fields.find((field) => key.test(field.key))?.value || "";
}

function linkedPlain(value: string): string {
  return stripWikiNoise(value)
    .replace(/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g, "$1")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function productionFromArticle(
  title: string,
  summary: Summary,
  wikitext: string
): Production | undefined {
  const fields = infoboxFields(infoboxBody(wikitext));
  const text = `${summary.description || ""} ${summary.extract || ""} ${wikitext.slice(0, 1500)}`;
  const country = linkedPlain(fieldValue(fields, /ארץ מקור|מדינה/));
  const israeli = /ישראל/.test(country) || /ישראל/.test(summary.extract || "");
  const foreignDub = /דובב(?:ה)? לעברית|מדובב לעברית|דיבוב עברי/.test(text) && !israeli;
  const film = /סרט/.test(summary.description || "") && !/סדר/.test(summary.description || "");
  let kind: ProductionKind | undefined;
  if (israeli && film) kind = "film_cinema";
  else if (israeli) kind = "tv_series";
  else if (foreignDub && film) kind = "film_dubbed_foreign";
  else if (foreignDub) kind = "series_dubbed_foreign";
  else if (/סדר/.test(text)) kind = "tv_series";
  if (!kind) return undefined;

  const year =
    yearFrom(linkedPlain(fieldValue(fields, /שידור ראשון|תאריך יציאה|שנת יציאה|הופק/))) ||
    yearFrom(text);
  if (!year) return undefined;
  const endYear = yearFrom(linkedPlain(fieldValue(fields, /שידור אחרון/)));
  const channel = linkedPlain(fieldValue(fields, /רשת שידור|ערוץ/)).slice(0, 80);
  const now = new Date().toISOString();
  const display = cleanDisplayName(title.replace(/\s*\(סדרת טלוויזיה\)\s*$/, "")) || title;
  const genres = [
    /הנפש/.test(text) ? "הנפשה" : "",
    /ילדים/.test(text) ? "ילדים" : "",
    foreignDub ? "מדובב" : "",
  ].filter(Boolean);
  return {
    id: slugify(display) || slugify(title),
    title: display,
    year,
    endYear: endYear && endYear !== year ? endYear : undefined,
    airStatus: "ended",
    kind,
    channel: channel || undefined,
    summary: clip(summary.extract) || clip(summary.description) || "",
    genres,
    imageUrl: portrait(display, undefined, { kind: "film" }),
    sourceNote: "ויקיפדיה",
    sourceUrl: wikiUrl(title),
    createdAt: now,
    updatedAt: now,
  };
}

const EDB_SKIP = /^(סרטים|סדרות|חדשים|מומלצות|מומלצים|קולנוע|אידיבי|נגישות|עוד|מגזין|סיימתי|אנשי קולנוע)/;

async function edbCandidateTitles(): Promise<string[]> {
  const titles: string[] = [];
  for (const url of EDB_PAGES) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const plain = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, "\n");
      let inTrailers = false;
      for (const line of plain.split("\n")) {
        const title = line.replace(/\s+/g, " ").trim();
        if (/טריילרים חדשים/.test(title)) {
          inTrailers = true;
          continue;
        }
        if (inTrailers && /כלים לאנשי|ניווט מהיר|נגישות/.test(title)) inTrailers = false;
        if (!inTrailers) continue;
        if (title.length < 2 || title.length > 40 || EDB_SKIP.test(title)) continue;
        if (!/[\u0590-\u05FF]/.test(title)) continue;
        titles.push(title);
      }
    } catch {
      /* המקור המשני לא חוסם את ויקיפדיה */
    }
  }
  return [...new Set(titles)].slice(0, 6);
}

async function wikiTitleForWork(title: string): Promise<string | undefined> {
  const data = await wikiJson<[string, string[]]>(
    "https://he.wikipedia.org/w/api.php?action=opensearch&format=json&namespace=0&limit=4" +
      `&search=${encodeURIComponent(title)}`
  );
  const hits = data?.[1] || [];
  const wanted = normName(title);
  return (
    hits.find((hit) => normName(cleanDisplayName(hit)) === wanted) ||
    hits.find((hit) => normName(cleanDisplayName(hit)).startsWith(wanted))
  );
}

function isActorOrDubber(person: Person): boolean {
  const activities = person.activities || [];
  if (activities.includes("acting") || activities.includes("dubbing")) return true;
  const tags = (person.tags || []).join(" ");
  return /שחק|מדבב|דיבוב/.test(tags);
}

export async function scanCatalogDay(input: {
  sinceMs: number;
  peopleByName: Map<string, Person>;
  productionTitles: Set<string>;
  alreadyQueued: Set<string>;
}): Promise<AgentDraft[]> {
  const until = Date.now() + 42_000;
  const alive = () => Date.now() < until;
  const personDrafts: Extract<AgentDraft, { kind: "person-create" }>[] = [];
  const productionDrafts: Extract<AgentDraft, { kind: "production-create" }>[] = [];
  const deathDrafts: Extract<AgentDraft, { kind: "death-update" }>[] = [];
  const seenPeople = new Set<string>();
  const seenShows = new Set<string>();

  const queuePerson = (
    person: Person,
    creditInputs?: AgentCreditInput[]
  ): boolean => {
    const key = normName(person.name);
    if (!key || seenPeople.has(key) || input.peopleByName.has(key)) return false;
    if (input.alreadyQueued.has(`create:person:${key}`)) return false;
    if (personDrafts.length >= MAX_NEW_PEOPLE) return false;
    seenPeople.add(key);
    personDrafts.push({
      kind: "person-create",
      title: person.name,
      wikipediaUrl: person.wikipediaUrl || wikiUrl(person.name),
      person,
      creditInputs: creditInputs?.length ? creditInputs : undefined,
    });
    input.peopleByName.set(key, person);
    return true;
  };

  const resolveCastPerson = async (
    mention: CastMention
  ): Promise<Person | undefined> => {
    const key = normName(mention.name);
    const existing = input.peopleByName.get(key);
    if (existing) return existing;
    if (!alive()) return undefined;
    const wikiTitle = (await wikiTitleForWork(mention.name)) || mention.name;
    if (normName(cleanDisplayName(wikiTitle)) !== key && !normName(wikiTitle).startsWith(key)) {
      return undefined;
    }
    const summary = await pageSummary(wikiTitle);
    if (!summary || !looksLikePerson(summary)) return undefined;
    const dates = alive() ? await wikiDates(wikiTitle) : {};
    const person = personRecord(
      wikiTitle,
      summary,
      activityFor(mention.role),
      dates
    );
    person.name = cleanDisplayName(mention.name) || person.name;
    person.id = slugify(person.name) || person.id;
    queuePerson(person);
    return input.peopleByName.get(normName(person.name)) || person;
  };

  for (const source of PERSON_CATEGORIES) {
    if (!alive() || personDrafts.length >= MAX_NEW_PEOPLE) break;
    const members = await recentCategoryMembers(source.category, input.sinceMs);
    for (const member of members) {
      if (!alive() || personDrafts.length >= MAX_NEW_PEOPLE) break;
      const key = normName(member.title);
      if (!key || input.peopleByName.has(key) || seenPeople.has(key)) continue;
      if (input.alreadyQueued.has(`create:person:${key}`)) continue;
      const summary = await pageSummary(member.title);
      if (!summary || !looksLikePerson(summary)) continue;
      const [dates, wikitext] = await Promise.all([
        wikiDates(member.title),
        pageWikitext(member.title),
      ]);
      const person = personRecord(
        member.title,
        summary,
        source.activity,
        dates,
        source.gender
      );
      queuePerson(person, parseSubjectCredits(wikitext));
      if (!alive()) break;
      for (const mention of parseWikiCast(wikitext, summary.extract)) {
        if (normName(mention.name) === key) continue;
        await resolveCastPerson(mention);
      }
    }
  }

  const discovered: string[] = [];
  for (const category of SHOW_CATEGORIES) {
    if (!alive()) break;
    const members = await recentCategoryMembers(category, input.sinceMs);
    for (const member of members) discovered.push(member.title);
  }
  if (alive()) {
    const seriesSearch = await wikiJson<{
      query?: { search?: { title: string; timestamp: string }[] };
    }>(
      "https://he.wikipedia.org/w/api.php?action=query&list=search&srnamespace=0" +
        `&srsearch=${encodeURIComponent("דובב לעברית סדרה")}` +
        "&srsort=create_timestamp_desc&srlimit=8&srprop=timestamp&format=json"
    );
    for (const hit of seriesSearch?.query?.search || []) {
      if (Date.parse(hit.timestamp) < input.sinceMs) continue;
      discovered.push(hit.title);
    }
  }
  if (alive()) {
    for (const title of await edbCandidateTitles()) {
      const wikiTitle = await wikiTitleForWork(title);
      if (wikiTitle) discovered.push(wikiTitle);
    }
  }

  for (const wikiTitle of discovered) {
    if (!alive() || productionDrafts.length >= MAX_NEW_PRODUCTIONS) break;
    const summary = await pageSummary(wikiTitle);
    if (!summary) continue;
    const wikitext = await pageWikitext(wikiTitle);
    const production = productionFromArticle(wikiTitle, summary, wikitext);
    if (!production) continue;
    const key = normName(production.title);
    if (!key || seenShows.has(key) || input.productionTitles.has(key)) continue;
    if (input.alreadyQueued.has(`create:production:${key}`)) continue;
    const mentions = parseWikiCast(wikitext, summary.extract);
    const credits: Credit[] = [];
    const relatedPeople: Person[] = [];
    for (const [index, mention] of mentions.entries()) {
      if (!alive()) break;
      const person = await resolveCastPerson(mention);
      if (!person) continue;
      credits.push({
        personId: person.id,
        productionId: production.id,
        role: mention.role,
        heading: mention.heading,
        characterName: mention.characterName,
        billingOrder: index,
      });
      if (personDrafts.some((draft) => draft.person.id === person.id)) {
        relatedPeople.push(person);
      }
    }
    seenShows.add(key);
    input.productionTitles.add(key);
    productionDrafts.push({
      kind: "production-create",
      title: production.title,
      wikipediaUrl: production.sourceUrl || wikiUrl(wikiTitle),
      production,
      credits,
      relatedPeople,
    });
  }

  const deathCategory = `ישראלים שנפטרו ב-${new Date().getFullYear()}`;
  if (alive()) {
    const deaths = await recentCategoryMembers(deathCategory, input.sinceMs);
    for (const member of deaths) {
      if (deathDrafts.length >= MAX_DEATHS) break;
      const key = normName(member.title);
      const existing = input.peopleByName.get(key);
      if (!existing || !isActorOrDubber(existing)) continue;
      if (input.alreadyQueued.has(`death:${key}`)) continue;
      const dates = await wikiDates(member.title);
      if (!dates.deathDate || dates.deathDate === existing.deathDate) continue;
      deathDrafts.push({
        kind: "death-update",
        title: existing.name,
        wikipediaUrl: wikiUrl(member.title),
        deathDate: dates.deathDate,
        person: {
          ...existing,
          deathDate: dates.deathDate,
          updatedAt: new Date().toISOString(),
          sourceNote: existing.sourceNote || "ויקיפדיה",
          sourceUrl: existing.sourceUrl || wikiUrl(member.title),
        },
      });
    }
  }

  return [...personDrafts, ...productionDrafts, ...deathDrafts];
}

export const scanWikiWeek = scanCatalogDay;
export const WIKI_AGENT_WEEK_MS = DAY_MS;
export const WIKI_AGENT_DAY_MS = DAY_MS;
export { normName as wikiAgentNormName };
