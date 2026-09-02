/**
 * Scrape classic ishim.co.il from a Wayback snapshot into src/data/ishim-archive.json.
 * Resumable: HTML cache + parsed JSON + progress.json.
 *
 *   node scripts/scrape-ishim.mjs --test
 *   node scripts/scrape-ishim.mjs
 *   node scripts/scrape-ishim.mjs --limit 50
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SNAPSHOT = "20210205102021";
const ORIGIN = "https://www.ishim.co.il/";
const WAYBACK = `http://web.archive.org/web/${SNAPSHOT}id_/${ORIGIN}`;
const DELAY_MS = Number(process.env.ISHIM_DELAY_MS || 250);
const CONCURRENCY = Number(process.env.ISHIM_CONCURRENCY || 1);
const CACHE = path.join(ROOT, "scripts/ishim-archive/cache");
const PARSED = path.join(ROOT, "scripts/ishim-archive/parsed");
const PROGRESS_PATH = path.join(ROOT, "scripts/ishim-archive/progress.json");
const OUT_PATH = path.join(ROOT, "src/data/ishim-archive.json");
const KS_SAMPLE = path.join(ROOT, "scripts/ishim-archive/ks.php.html");
const P_SAMPLE = path.join(ROOT, "scripts/ishim-archive/p-sample.html");

const PRIORITY_KEYS = [
  "מדבבים",
  "במאים",
  "כוכבי ילדים",
  "זמרים",
  "מלחינים",
  "מפיקי טלוויזיה",
  "מפיקי קולנוע",
  "צלמים",
  "עיתונאים",
  "סופרים",
  "משוררים ופזמונאים",
  "אמרגנים",
  "סטנדאפ",
  "דוגמנים ודוגמניות",
  "ניסן נתיב",
  "בית צבי",
  "הגשש החיוור",
  "מפיקים מוזיקליים",
  "בובות",
];

const KIND_FROM_LABEL = {
  "סרט קולנוע": "film_cinema",
  "סרט זר מדובב": "film_dubbed_foreign",
  סרט: "film_dubbed_foreign",
  "סרטי רז": "film",
  "סדרת טלוויזיה": "tv_series",
  "סידרת TV": "tv_series",
  "סדרה זרה מדובבת": "series",
  סדרה: "series",
  "תוכנית טלוויזיה": "tv_program",
  "קלטת ילדים": "cassette_kids",
  "תוכנית רדיו": "radio_program",
  "סרט סטודנטים": "film_student",
  הרכב: "ensemble",
  "סדרה ישראלית עם קטעים זרים מדובבים": "series_israeli_foreign_dubbed",
  "סרט טלוויזיה": "tv_program",
};

const CHANNEL_FRAGMENTS = new Set([
  "ערוץ הילדים",
  "חינוכית",
  "ערוץ 2",
  "ערוץ 1",
  "ערוץ 10",
  "ערוץ 24",
  "הוט",
  "yes",
  "YES",
]);

const args = process.argv.slice(2);
const TEST = args.includes("--test");
const COMPILE_ONLY = args.includes("--compile-only");
const LIMIT = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 ? Number(args[i + 1]) : 0;
})();
const SKIP_PRODS = args.includes("--people-only");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(s) {
  return decodeHtml(String(s || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeQueryValue(raw) {
  const cleaned = decodeHtml(raw).replace(/\+/g, " ");
  try {
    return decodeURIComponent(cleaned);
  } catch {
    return cleaned;
  }
}

function encodeS(s) {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

function fileKey(s) {
  return encodeURIComponent(s).replace(/%/g, "_");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

export function mapRole(heading) {
  const h = heading.replace(/\s+/g, " ").trim();
  const table = [
    [/במאית דיבוב|במאי דיבוב/, "dub_director"],
    [/מפיקת דיבוב|מפיק דיבוב/, "producer"],
    [/בתפקיד עצמו/, "host"],
    [/הרכב/, "musical_performer"],
    [/מדבב/, "dubber"],
    [/קריינ/, "dubber"],
    [/שחקנ|שחקן/, "actor"],
    [/במא/, "director"],
    [/תסריט|כותב|עורך|עריכה|תחקיר|יוצר/, "writer"],
    [/צלמ|צלם/, "cinematographer"],
    [/מנח|מגיש/, "host"],
    [/מחזמר/, "musical_performer"],
    [/מלחין|מלחינה/, "composer"],
    [/מוזיקה|זמר|שיר|פזמונ/, "singer"],
    [/מפיק/, "producer"],
  ];
  for (const [re, role] of table) {
    if (re.test(h)) return role;
  }
  return null;
}

function kindFromFragment(fragment) {
  if (!fragment) return { kind: null, channel: null, yearHint: null };
  if (/^\d{4}$/.test(fragment)) return { kind: null, channel: null, yearHint: Number(fragment) };
  if (CHANNEL_FRAGMENTS.has(fragment)) {
    return { kind: null, channel: fragment, yearHint: null };
  }
  const kind = KIND_FROM_LABEL[fragment] || null;
  return { kind, channel: kind ? null : fragment, yearHint: null };
}

function parseHrefS(href) {
  const m = href.match(/[mp]\.php\?s=([^"']+)/i);
  if (!m) return { s: "", title: "", fragment: "" };
  const s = decodeQueryValue(m[1]);
  const hash = s.indexOf("#");
  const title = hash >= 0 ? s.slice(0, hash) : s;
  const fragment = hash >= 0 ? s.slice(hash + 1) : "";
  return { s, title, fragment };
}

function parseIshimDate(block, labels) {
  const joined = labels.join("|");
  const re = new RegExp(
    `(?:${joined})[^]*?<a href='dm\\.php\\?d=(\\d+)&(?:amp;)?m=(\\d+)'>[^<]*</a>/<a href='y\\.php\\?y=(\\d+)'>`
  );
  const m = block.match(re);
  if (!m) return undefined;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function extractListLinks(html, hrefRe) {
  const out = [];
  const re = new RegExp(hrefRe, "g");
  let m;
  while ((m = re.exec(html))) {
    const s = decodeQueryValue(m[1]);
    const text = stripTags(m[2] || s.split("#")[0]);
    out.push({ s, text });
  }
  return out;
}

export function parsePersonHtml(html, sParam) {
  if (!html || /captcha|Just a moment/i.test(html)) return { error: "blocked" };
  if (!html.includes('id="sId"') && !html.includes("id='sId'")) {
    if (html.includes("s.php") && html.includes("תוצאות")) return { error: "search" };
    if (!/<h1>/.test(html)) return { error: "not-person" };
  }

  const h1 = stripTags((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || "");
  const name = h1 || sParam.split("#")[0];
  const ishimId = (html.match(/id="sId"\s+value="(\d+)"/) || [])[1] || "";

  const birthDate = parseIshimDate(html, ["נולד ב:", "נולדה ב:"]);
  const deathDate = parseIshimDate(html, ["נפטר ב-", "נפטרה ב-", "נפטר ב:", "נפטרה ב:"]);
  const deathNote = (
    html.match(/נפטר[ה]? ב-[\s\S]{0,180}?<\/a>\)\s*\(([^)]+)\)/) || []
  )[1];

  const birthName = stripTags(
    (html.match(/<div class='detail'><b>נולד[ה]? בשם:<\/b>([^<]*)<\/div>/) || [])[1] || ""
  );
  const nameOriginal = stripTags(
    (
      html.match(
        /<div class='detail'><b>(?:שם באנגלית|באנגלית|שם מקורי):<\/b>([^<]*)<\/div>/
      ) || []
    )[1] || ""
  );

  const keysBlock = (html.match(/מפתחות:<\/b><div>([\s\S]*?)<\/div>/) || [])[1] || "";
  const keys = extractListLinks(keysBlock, `k\\.php\\?k=([^"']+)['"]>([^<]*)`).map((x) => x.text);

  const rolesSrc =
    (html.split(/id="roles"/)[1] || "").split(/id="trivia"/)[0].split(/class="sidebar"/)[0] || "";
  const credits = [];
  const unknownHeadings = [];
  const sections = rolesSrc.split(/<h3>/).slice(1);
  for (const section of sections) {
    const heading = stripTags((section.match(/^([^<]+)/) || [])[1] || "");
    const role = mapRole(heading);
    if (!role) {
      if (heading && heading !== "כללי") unknownHeadings.push(heading);
      continue;
    }
    const re =
      /<div>(?:<span>(\+?\d{4})<\/span>)?<a href=['"]([^'"]+)['"]>([\s\S]*?)<\/a>(?:<div>([\s\S]*?)<\/div>)?<\/div>/g;
    let m;
    while ((m = re.exec(section))) {
      const href = decodeHtml(m[2]);
      const parsed = parseHrefS(href);
      const fragInfo = kindFromFragment(parsed.fragment);
      const year = m[1] ? Number(String(m[1]).replace("+", "")) : fragInfo.yearHint;
      credits.push({
        role,
        heading,
        year: year || undefined,
        title: stripTags(m[3]) || parsed.title,
        s: parsed.s,
        character: stripTags(m[4] || "") || undefined,
        kind: fragInfo.kind,
        channel: fragInfo.channel,
        yearHint: fragInfo.yearHint,
      });
    }
  }

  const triviaSrc = (html.split(/id="trivia"/)[1] || "").split(/class="sidebar"/)[0] || "";
  const general = [];
  const trivia = [];
  const triviaParts = triviaSrc.split(/<h3>/).slice(1);
  for (const part of triviaParts) {
    const heading = stripTags((part.match(/^([^<]+)/) || [])[1] || "");
    const items = [...part.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => stripTags(m[1])).filter(Boolean);
    if (/כללי/.test(heading)) general.push(...items);
    else trivia.push(...items);
  }

  const morePeople = [...html.matchAll(/p\.php\?s=([^"']+)/g)].map((m) => decodeQueryValue(m[1]));

  return {
    s: sParam,
    name,
    ishimId,
    birthDate,
    deathDate,
    deathNote: deathNote ? stripTags(deathNote) : undefined,
    birthName: birthName || undefined,
    nameOriginal: nameOriginal || undefined,
    keys,
    credits,
    general,
    trivia,
    morePeople: [...new Set(morePeople.filter((p) => p && p !== sParam))],
    unknownHeadings: [...new Set(unknownHeadings)],
  };
}

export function parseProductionHtml(html, sParam) {
  if (!html || !html.includes('id="sId"')) return { error: "not-production" };
  const h1raw = (html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || "";
  const title = stripTags((h1raw.match(/<span[^>]*>([\s\S]*?)<\/span>/) || [])[1] || h1raw);
  const yearMatch = h1raw.match(/\((\d{4})\)/);
  const year = yearMatch ? Number(yearMatch[1]) : undefined;
  const kindLabel = stripTags((html.match(/<b>סוג:<\/b>([^<]*)/) || [])[1] || "");
  const summary = stripTags((html.match(/<b>עלילה:<\/b>([^<]*)/) || [])[1] || "");
  const keysBlock = (html.match(/מפתחות:<\/b><div>([\s\S]*?)<\/div>/) || [])[1] || "";
  const genreBlock = (html.match(/ז'אנר:<\/b><div>([\s\S]*?)<\/div>/) || [])[1] || "";
  const channel = stripTags((html.match(/<b>ערוץ:<\/b>(?:<[^>]+>)?([^<]*)/) || [])[1] || "");
  const parsedS = sParam.includes("#") ? sParam.split("#") : [sParam, ""];
  const fragInfo = kindFromFragment(parsedS[1] || "");
  const kind = KIND_FROM_LABEL[kindLabel] || fragInfo.kind || "tv_series";

  const rolesSrc =
    (html.split(/id="roles"/)[1] || "").split(/id="trivia"/)[0].split(/class="sidebar"/)[0] || "";
  const credits = [];
  const sections = rolesSrc.split(/<h3>/).slice(1);
  for (const section of sections) {
    const heading = stripTags((section.match(/^([^<]+)/) || [])[1] || "");
    const role = mapRole(heading);
    if (!role) continue;
    const re =
      /<div>(?:<span>(\d{4})<\/span>)?<a href=['"]([^'"]+)['"]>([\s\S]*?)<\/a>(?:<div>([\s\S]*?)<\/div>)?<\/div>/g;
    let m;
    while ((m = re.exec(section))) {
      if (!/p\.php\?s=/.test(m[2])) continue;
      credits.push({
        role,
        heading,
        year: m[1] ? Number(m[1]) : year,
        personS: decodeQueryValue((m[2].match(/p\.php\?s=([^"']+)/) || [])[1] || ""),
        personName: stripTags(m[3]),
        character: stripTags(m[4] || "") || undefined,
      });
    }
  }

  return {
    s: sParam,
    title: title || sParam.split("#")[0],
    year,
    kind,
    kindLabel: kindLabel || undefined,
    summary,
    genres: extractListLinks(genreBlock, `g\\.php\\?g=([^"']+)['"]>([^<]*)`).map((x) => x.text),
    keys: extractListLinks(keysBlock, `k\\.php\\?k=([^"']+)['"]>([^<]*)`).map((x) => x.text),
    channel: channel || fragInfo.channel || undefined,
    credits,
  };
}

export function parseKeysIndex(html) {
  return [...new Set(extractListLinks(html, `k\\.php\\?k=([^"'&,]+)['"]>([^<]*)`).map((x) => x.text))];
}

export function parseKeyPagePeople(html) {
  const peopleBlock = (html.split(/<h2>אנשים<\/h2>/)[1] || "").split(/<h2>/)[0] || "";
  return [
    ...new Set(
      [...peopleBlock.matchAll(/p\.php\?s=([^"']+)/g)].map((m) => decodeQueryValue(m[1]))
    ),
  ];
}

let lastFetch = 0;
let waybackFailStreak = 0;
async function politeWait() {
  const wait = DELAY_MS - (Date.now() - lastFetch);
  if (wait > 0) await sleep(wait);
}

async function fetchWayback(relPath) {
  const url = WAYBACK + relPath.replace(/^\//, "");
  if (waybackFailStreak >= 3) {
    console.warn("wayback down, waiting 45s");
    await sleep(45000);
    waybackFailStreak = 0;
  }
  await politeWait();
  lastFetch = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HaarchionArchiveBot/1.0; +https://haarchion.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429 || res.status === 503) {
      const retry = Number(res.headers.get("retry-after") || 20) * 1000;
      console.warn("rate-limited", res.status, "sleep", retry);
      await sleep(retry);
      return fetchWayback(relPath);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${url} ${text.slice(0, 80)}`);
    }
    waybackFailStreak = 0;
    return res.text();
  } catch (err) {
    waybackFailStreak++;
    throw err;
  }
}

async function cachedGet(kind, s, relPath) {
  const dir = path.join(CACHE, kind);
  ensureDir(dir);
  const file = path.join(dir, `${fileKey(s)}.html`);
  if (fs.existsSync(file) && fs.statSync(file).size > 400) {
    return fs.readFileSync(file, "utf8");
  }
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const html = await fetchWayback(relPath);
      if (/Just a moment|captcha|Checking your browser/i.test(html)) {
        throw new Error("blocked");
      }
      fs.writeFileSync(file, html);
      return html;
    } catch (err) {
      lastErr = err;
      await sleep(2000 * (attempt + 1));
    }
  }
  throw lastErr;
}

function loadProgress() {
  const p = readJson(PROGRESS_PATH, {
    keysDone: [],
    peopleDone: [],
    peopleFailed: [],
    productionsDone: [],
    productionsFailed: [],
    peopleQueue: [],
    productionsQueue: [],
  });
  if (p.peopleFailed?.length) {
    for (const s of p.peopleFailed) {
      if (!p.peopleQueue.includes(s) && !p.peopleDone.includes(s)) p.peopleQueue.push(s);
    }
    p.peopleFailed = [];
  }
  return p;
}

function saveProgress(p) {
  writeJson(PROGRESS_PATH, p);
}

function parsedPersonPath(s) {
  return path.join(PARSED, "people", `${fileKey(s)}.json`);
}
function parsedProdPath(s) {
  return path.join(PARSED, "productions", `${fileKey(s)}.json`);
}

function collectProductionsFromPerson(person, progress) {
  for (const credit of person.credits || []) {
    if (!credit.s) continue;
    if (
      !progress.productionsDone.includes(credit.s) &&
      !progress.productionsQueue.includes(credit.s)
    ) {
      progress.productionsQueue.push(credit.s);
    }
  }
  for (const name of person.morePeople || []) {
    if (
      !progress.peopleDone.includes(name) &&
      !progress.peopleQueue.includes(name) &&
      !progress.peopleFailed.includes(name)
    ) {
      progress.peopleQueue.push(name);
    }
  }
}

function compactCredit(c) {
  const row = { role: c.role, year: c.year, title: c.title };
  if (c.s && c.s !== c.title) row.s = c.s;
  if (c.character) row.character = c.character;
  if (c.kind) row.kind = c.kind;
  if (c.channel) row.channel = c.channel;
  return row;
}

function compactPerson(p) {
  const row = { s: p.s, name: p.name };
  if (p.birthDate) row.birthDate = p.birthDate;
  if (p.deathDate) row.deathDate = p.deathDate;
  if (p.birthName) row.birthName = p.birthName;
  if (p.nameOriginal) row.nameOriginal = p.nameOriginal;
  if (p.keys?.length) row.keys = p.keys;
  if (p.general?.length) row.general = p.general;
  if (p.trivia?.length) row.trivia = p.trivia;
  row.credits = (p.credits || []).map(compactCredit);
  return row;
}

function compactProduction(p) {
  const row = { s: p.s, title: p.title, year: p.year || 0, kind: p.kind || "tv_series" };
  if (p.summary) row.summary = p.summary;
  if (p.genres?.length) row.genres = p.genres;
  if (p.keys?.length) row.keys = p.keys;
  if (p.channel) row.channel = p.channel;
  if (p.credits?.length) {
    row.credits = p.credits.map((c) => {
      const cr = { role: c.role, personName: c.personName };
      if (c.personS) cr.personS = c.personS;
      if (c.character) cr.character = c.character;
      if (c.year) cr.year = c.year;
      return cr;
    });
  }
  return row;
}

function compileArchive() {
  const peopleDir = path.join(PARSED, "people");
  const prodDir = path.join(PARSED, "productions");
  const people = [];
  const productions = [];
  if (fs.existsSync(peopleDir)) {
    for (const file of fs.readdirSync(peopleDir)) {
      if (!file.endsWith(".json")) continue;
      const rec = readJson(path.join(peopleDir, file), null);
      if (rec && !rec.error && rec.name) people.push(rec);
    }
  }
  if (fs.existsSync(prodDir)) {
    for (const file of fs.readdirSync(prodDir)) {
      if (!file.endsWith(".json")) continue;
      const rec = readJson(path.join(prodDir, file), null);
      if (rec && !rec.error && rec.title) productions.push(rec);
    }
  }

  const prodByS = new Map(productions.map((p) => [p.s, p]));
  for (const person of people) {
    for (const credit of person.credits || []) {
      if (!credit.s) continue;
      if (!prodByS.has(credit.s)) {
        const stub = {
          s: credit.s,
          title: credit.title,
          year: credit.year,
          kind: credit.kind || "tv_series",
          summary: "",
          genres: [],
          keys: [],
          channel: credit.channel,
          credits: [],
          fromPersonCredits: true,
        };
        productions.push(stub);
        prodByS.set(credit.s, stub);
      } else {
        const existing = prodByS.get(credit.s);
        if (!existing.year && credit.year) existing.year = credit.year;
        if ((!existing.kind || existing.kind === "tv_series") && credit.kind) {
          existing.kind = credit.kind;
        }
      }
    }
  }

  const uniqueTitles = new Set();
  for (const person of people) {
    for (const credit of person.credits || []) {
      uniqueTitles.add(credit.s || credit.title);
    }
  }
  const richProductions = productions.filter(
    (p) => p.summary || (p.credits && p.credits.length)
  );
  const payload = {
    snapshot: SNAPSHOT,
    scrapedAt: new Date().toISOString(),
    peopleCount: people.length,
    productionsCount: Math.max(uniqueTitles.size, richProductions.length),
    creditCount: people.reduce((n, p) => n + (p.credits?.length || 0), 0),
    people: people.map(compactPerson),
    productions: richProductions.map(compactProduction),
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload));
  return payload;
}

async function runTest() {
  const personHtml = fs.readFileSync(P_SAMPLE, "utf8");
  const person = parsePersonHtml(personHtml, "יוני חן");
  const keys = parseKeysIndex(fs.readFileSync(KS_SAMPLE, "utf8"));
  const dubbers = parseKeyPagePeople(
    fs.readFileSync(path.join(ROOT, "scripts/ishim-archive/k-dubbers.html"), "utf8")
  );
  console.log(
    JSON.stringify(
      {
        name: person.name,
        birthDate: person.birthDate,
        deathDate: person.deathDate,
        birthName: person.birthName,
        keys: person.keys,
        credits: person.credits.length,
        first: person.credits[0],
        halehaka: person.credits.find((c) => c.title === "הלהקה"),
        general: person.general,
        trivia: person.trivia.slice(0, 1),
        unknownHeadings: person.unknownHeadings,
        keyCount: keys.length,
        dubberCount: dubbers.length,
      },
      null,
      2
    )
  );
  if (person.name !== "יוני חן") throw new Error("name");
  if (person.birthDate !== "1953-08-10") throw new Error("birth");
  if (person.deathDate !== "1995-06-27") throw new Error("death");
  if (person.credits.length < 80) throw new Error("credits " + person.credits.length);
  console.log("parser ok");
}

async function scrape() {
  ensureDir(CACHE);
  ensureDir(path.join(PARSED, "people"));
  ensureDir(path.join(PARSED, "productions"));

  const progress = loadProgress();
  const seedFiles = [
    ["k", "מדבבים", path.join(ROOT, "scripts/ishim-archive/k-dubbers.html")],
    ["k", "במאים", path.join(ROOT, "scripts/ishim-archive/k-directors.html")],
    ["k", "כוכבי ילדים", path.join(ROOT, "scripts/ishim-archive/k-kids.html")],
    ["p", "יוני חן", P_SAMPLE],
  ];
  for (const [kind, s, src] of seedFiles) {
    if (!fs.existsSync(src)) continue;
    const dest = path.join(CACHE, kind, `${fileKey(s)}.html`);
    if (!fs.existsSync(dest)) {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
    }
  }

  let ksHtml;
  if (fs.existsSync(KS_SAMPLE)) ksHtml = fs.readFileSync(KS_SAMPLE, "utf8");
  else ksHtml = await cachedGet("index", "ks", "ks.php");
  const allKeys = parseKeysIndex(ksHtml);
  const keys = [
    ...PRIORITY_KEYS.filter((k) => allKeys.includes(k)),
    ...allKeys.filter((k) => !PRIORITY_KEYS.includes(k)),
  ];
  console.log("keys", keys.length);

  for (const key of keys) {
    if (progress.keysDone.includes(key)) continue;
    process.stdout.write(`key ${key} `);
    const html = await cachedGet("k", key, `k.php?k=${encodeS(key)}`);
    const people = parseKeyPagePeople(html);
    console.log(people.length);
    for (const s of people) {
      if (!progress.peopleQueue.includes(s) && !progress.peopleDone.includes(s)) {
        progress.peopleQueue.push(s);
      }
    }
    progress.keysDone.push(key);
    saveProgress(progress);
  }

  const peopleDir = path.join(PARSED, "people");
  if (fs.existsSync(peopleDir)) {
    for (const file of fs.readdirSync(peopleDir)) {
      if (!file.endsWith(".json")) continue;
      const existing = readJson(path.join(peopleDir, file), null);
      if (existing?.s && !existing.error) {
        if (!progress.peopleDone.includes(existing.s)) progress.peopleDone.push(existing.s);
        collectProductionsFromPerson(existing, progress);
      }
    }
  }

  console.log("people queued", progress.peopleQueue.length, "done", progress.peopleDone.length);

  async function scrapePersonQueue() {
    let n = 0;
    const retries = new Map();
    async function takeNext() {
      while (progress.peopleQueue.length) {
        if (LIMIT && n >= LIMIT) return;
        const s = progress.peopleQueue.shift();
        if (!s || progress.peopleDone.includes(s) || progress.peopleFailed.includes(s)) {
          continue;
        }
        const parsedFile = parsedPersonPath(s);
        if (fs.existsSync(parsedFile)) {
          const existing = readJson(parsedFile, null);
          if (existing && !existing.error) {
            progress.peopleDone.push(s);
            collectProductionsFromPerson(existing, progress);
            continue;
          }
        }
        try {
          const html = await cachedGet("p", s, `p.php?s=${encodeS(s)}`);
          const parsed = parsePersonHtml(html, s);
          writeJson(parsedFile, parsed);
          if (parsed.error) {
            progress.peopleFailed.push(s);
            console.warn("person fail", s, parsed.error);
          } else {
            progress.peopleDone.push(s);
            collectProductionsFromPerson(parsed, progress);
            n++;
            if (n % 10 === 0) {
              saveProgress(progress);
              compileArchive();
              console.log(
                `people ${progress.peopleDone.length} queue ${progress.peopleQueue.length} productionsQ ${progress.productionsQueue.length}`
              );
            } else {
              process.stdout.write(".");
            }
          }
        } catch (err) {
          const r = (retries.get(s) || 0) + 1;
          retries.set(s, r);
          console.warn("person err", s, err.message, `retry ${r}`);
          if (r >= 8) progress.peopleFailed.push(s);
          else {
            progress.peopleQueue.push(s);
            await sleep(3000 * r);
          }
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, () => takeNext()));
    saveProgress(progress);
    return n;
  }

  await scrapePersonQueue();
  saveProgress(progress);
  const peopleBatch = compileArchive();
  console.log(
    "people batch",
    peopleBatch.peopleCount,
    "people",
    peopleBatch.productionsCount,
    "productions from credits",
    peopleBatch.creditCount,
    "credits"
  );

  if (!SKIP_PRODS) {
    let pn = 0;
    while (progress.productionsQueue.length) {
      if (LIMIT && pn >= LIMIT) break;
      const s = progress.productionsQueue.shift();
      if (progress.productionsDone.includes(s)) continue;
      const parsedFile = parsedProdPath(s);
      if (fs.existsSync(parsedFile)) {
        progress.productionsDone.push(s);
        continue;
      }
      try {
        const html = await cachedGet("m", s, `m.php?s=${encodeS(s)}`);
        const parsed = parseProductionHtml(html, s);
        writeJson(parsedFile, parsed);
        if (parsed.error) {
          progress.productionsFailed.push(s);
        } else {
          progress.productionsDone.push(s);
          for (const credit of parsed.credits || []) {
            if (
              credit.personS &&
              !progress.peopleDone.includes(credit.personS) &&
              !progress.peopleQueue.includes(credit.personS) &&
              !progress.peopleFailed.includes(credit.personS)
            ) {
              progress.peopleQueue.push(credit.personS);
            }
          }
        }
        pn++;
        if (pn % 15 === 0) {
          saveProgress(progress);
          compileArchive();
          console.log(
            `productions ${progress.productionsDone.length} queue ${progress.productionsQueue.length}`
          );
        }
      } catch (err) {
        progress.productionsFailed.push(s);
        console.warn("prod err", s, err.message);
        saveProgress(progress);
      }
    }
    saveProgress(progress);
    if (progress.peopleQueue.length && !LIMIT) {
      console.log("follow-up people", progress.peopleQueue.length);
      await scrapePersonQueue();
    }
  }

  const out = compileArchive();
  saveProgress(progress);
  console.log(
    "done",
    out.peopleCount,
    "people",
    out.productionsCount,
    "productions",
    out.creditCount,
    "credits"
  );
}

if (TEST) {
  await runTest();
} else if (COMPILE_ONLY) {
  const out = compileArchive();
  console.log(
    "compiled",
    out.peopleCount,
    "people",
    out.productionsCount,
    "productions",
    out.creditCount,
    "credits"
  );
} else {
  await scrape();
}
