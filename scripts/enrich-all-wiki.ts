/**
 * Enrich ALL people from Hebrew Wikipedia:
 * - birth/death (via Wikidata QID)
 * - short bio extract
 * - wikipediaUrl
 *
 * Progress is saved so the run can resume.
 * Run: npx tsx scripts/enrich-all-wiki.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";

const UA = "IshimArchive/1.0 (educational; full wiki enrich)";
const PROGRESS = path.join(__dirname, "enrich-all-progress.json");
const OUT_JSON = path.join(__dirname, "wiki-enrichment.json");
const OUT_DATES = path.join(__dirname, "../src/lib/seed-dates.ts");
const OUT_BIOS = path.join(__dirname, "../src/lib/seed-wiki-enrichment.ts");

type Dates = { birthDate?: string; deathDate?: string };
type Enrich = Dates & { bio?: string; wikipediaUrl?: string; qid?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toIso(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = Number(m[1]);
  if (y < 1920 || y > 2100) return undefined;
  const mm = m[2] === "00" ? "01" : m[2]!;
  const dd = m[3] === "00" ? "01" : m[3]!;
  return `${m[1]}-${mm}-${dd}`;
}

function cleanName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/־/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(name: string): string {
  return cleanName(name)
    .replace(/['׳״"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    const text = await res.text();
    if (text.startsWith("You are")) return null;
    if (!res.ok) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function wikiLookup(title: string): Promise<{
  title: string;
  qid?: string;
  extract?: string;
} | null> {
  const url =
    `https://he.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}` +
    `&prop=pageprops|extracts&ppprop=wikibase_item&exintro=1&explaintext=1&redirects=1&format=json&origin=*`;
  const data = await fetchJson<{
    query?: {
      redirects?: { to: string }[];
      pages?: Record<
        string,
        {
          missing?: string;
          title?: string;
          extract?: string;
          pageprops?: { wikibase_item?: string };
        }
      >;
    };
  }>(url);
  if (!data?.query?.pages) return null;
  for (const page of Object.values(data.query.pages)) {
    if (page.missing !== undefined) continue;
    return {
      title: page.title || title,
      qid: page.pageprops?.wikibase_item,
      extract: page.extract?.trim(),
    };
  }
  return null;
}

async function datesFromQid(qid: string): Promise<Dates> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`;
  const data = await fetchJson<{
    entities?: Record<string, { claims?: any }>;
  }>(url);
  const claims = data?.entities?.[qid]?.claims;
  if (!claims) return {};
  const births = (claims.P569 || [])
    .map((c: any) => toIso(c?.mainsnak?.datavalue?.value?.time))
    .filter(Boolean) as string[];
  births.sort((a, b) => {
    const score = (d: string) => (d.endsWith("-01-01") ? 0 : 2);
    return score(b) - score(a);
  });
  const deathDate = toIso(claims.P570?.[0]?.mainsnak?.datavalue?.value?.time);
  return {
    ...(births[0] ? { birthDate: births[0] } : {}),
    ...(deathDate ? { deathDate } : {}),
  };
}

function trimBio(extract: string, max = 420): string {
  let t = extract.replace(/\s+/g, " ").trim();
  // Drop disambiguation / list pages
  if (/האם התכוונתם|עמוד פירושונים|may refer to/i.test(t)) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("。"), cut.lastIndexOf("!"));
  return (last > 120 ? cut.slice(0, last + 1) : cut.trim() + "…").trim();
}

function formatDates(map: Record<string, Dates>): string {
  const lines = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, d]) => d.birthDate || d.deathDate)
    .map(([id, d]) => {
      const parts = [
        d.birthDate ? `birthDate: "${d.birthDate}"` : null,
        d.deathDate ? `deathDate: "${d.deathDate}"` : null,
      ].filter(Boolean);
      return `  "${id}": { ${parts.join(", ")} },`;
    })
    .join("\n");
  return `/** Birth/death dates from Wikidata/Wikipedia (+ curated fills) */
export const PERSON_DATES: Record<
  string,
  { birthDate?: string; deathDate?: string }
> = {
${lines}
};
`;
}

function formatBios(map: Record<string, Enrich>): string {
  const entries = Object.entries(map)
    .filter(([, e]) => e.bio || e.wikipediaUrl)
    .sort(([a], [b]) => a.localeCompare(b));

  const lines = entries
    .map(([id, e]) => {
      const parts = [
        e.bio ? `bio: ${JSON.stringify(e.bio)}` : null,
        e.wikipediaUrl ? `wikipediaUrl: ${JSON.stringify(e.wikipediaUrl)}` : null,
      ].filter(Boolean);
      return `  "${id}": { ${parts.join(", ")} },`;
    })
    .join("\n");

  return `/** Wikipedia extracts for people (bios + links) — scripts/enrich-all-wiki.ts */
export const PERSON_WIKI_ENRICHMENT: Record<
  string,
  { bio?: string; wikipediaUrl?: string }
> = {
${lines}
};
`;
}

/** Curated fills for known people / Hop Tamir when automation misses */
const CURATED: Record<string, Enrich> = {
  "yvbl-zmyr": {
    birthDate: "1963-07-15",
    deathDate: "2011-12-21",
    bio: "יובל זמיר (1963–2011) היה שחקן תיאטרון וקולנוע, מדבב, במאי וזמר אופרה ישראלי. דיבב בין השאר בפינוקיו, סינדרלה, נסיך מצרים ובאג לייף.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/יובל_זמיר",
  },
  "gyh-bar-gvrbyts": { birthDate: "1990-12-02" },
  "ht-chny-nchmyas": {
    birthDate: "1959-04-09",
    bio: "חני נחמיאס היא שחקנית, קומיקאית, מדבבת ומנחת טלוויזיה ישראלית. כיכבה בתוכניות ילדים ובדיבוב עברי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/חני_נחמיאס",
  },
  "ht-avdd-mnshh": {
    birthDate: "1969-09-29",
    bio: "עודד מנשה הוא שחקן, מנחה ומדבב ישראלי. מוכר מהנחיית תוכניות ילדים ומהפקות דיבוב.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/עודד_מנשה",
  },
  "ht-aly-gvrnshtyyn": {
    birthDate: "1952-08-31",
    bio: "אלי גורנשטיין הוא שחקן ומדבב ישראלי. דיבב דמויות מרכזיות בדיסני ובהפקות ילדים.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/אלי_גורנשטיין",
  },
  "ht-apy-bn-yshral": {
    birthDate: "1955-05-26",
    bio: "אפי בן ישראל היא שחקנית, מדבבת ומנחה. מנחת «פרפר נחמד» ומדבבת בהפקות דיסני קלאסיות.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/אפי_בן_ישראל",
  },
  "ht-avrnh-lbya-plynt": {
    birthDate: "1953-10-14",
    bio: "אורנה לביא פלינט היא מדבבת ובובנאית ישראלית. דיבבה בין השאר את הפרפר ב«פרפר נחמד».",
  },
  "ht-nvryt-bnay-kvrn": {
    birthDate: "1964-06-08",
    bio: "נורית בנאי קורן היא מדבבת ושחקנית ישראלית בהפקות ילדים ודיבוב עברי.",
  },
  "ht-lah-navr": {
    birthDate: "1935-01-01",
    bio: "לאה נאור היא סופרת, מתרגמת ומדבבת ישראלית. כתבה ותרגמה יצירות ילדים רבות.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/לאה_נאור",
  },
};

async function main() {
  let progress: Record<string, Enrich> = {};
  if (fs.existsSync(PROGRESS)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS, "utf8"));
    console.log("Resuming with", Object.keys(progress).length, "cached");
  }

  const dates: Record<string, Dates> = { ...PERSON_DATES };
  const enrich: Record<string, Enrich> = { ...progress };

  for (const [id, e] of Object.entries(CURATED)) {
    enrich[id] = { ...enrich[id], ...e };
    if (e.birthDate || e.deathDate) {
      dates[id] = {
        birthDate: e.birthDate || dates[id]?.birthDate,
        deathDate: e.deathDate || dates[id]?.deathDate,
      };
    }
  }

  // Prefer: missing birth, then Hop Tamir / thin bio, skip rich bios that already have dates
  const people = [...SEED.people]
    .filter((p) => {
      const hasBirth = !!(p.birthDate || dates[p.id]?.birthDate || enrich[p.id]?.birthDate);
      const hasBio = !!(enrich[p.id]?.bio && enrich[p.id]!.bio!.length > 60);
      const thin =
        !p.bio ||
        p.bio.length < 60 ||
        /ארכיון ערוץ הופ|לפי קטגוריית מדבבים|מדבב\/ת ועורך/.test(p.bio);
      if (hasBirth && hasBio) return false;
      if (hasBirth && !thin && !p.id.startsWith("ht-")) return false;
      return true;
    })
    .sort((a, b) => {
      const aMiss = !(a.birthDate || dates[a.id]?.birthDate) ? 0 : 1;
      const bMiss = !(b.birthDate || dates[b.id]?.birthDate) ? 0 : 1;
      if (aMiss !== bMiss) return aMiss - bMiss;
      const aHt = a.id.startsWith("ht-") ? 0 : 1;
      const bHt = b.id.startsWith("ht-") ? 0 : 1;
      return aHt - bHt;
    });

  console.log("People to enrich:", people.length);
  let i = 0;
  let hits = 0;
  for (const person of people) {
    i++;
    if (enrich[person.id]?.bio && (person.birthDate || dates[person.id]?.birthDate || enrich[person.id]?.birthDate)) {
      // already enriched enough
      if (enrich[person.id].birthDate && !dates[person.id]?.birthDate) {
        dates[person.id] = {
          birthDate: enrich[person.id].birthDate,
          deathDate: enrich[person.id].deathDate || dates[person.id]?.deathDate,
        };
      }
      continue;
    }

    // Skip re-fetch if we already tried and marked empty
    if (enrich[person.id]?.qid === "NONE" && dates[person.id]?.birthDate) continue;

    const titles = [
      cleanName(person.name),
      person.name,
      person.nameOriginal,
      ...(person.nicknames || []),
    ].filter(Boolean) as string[];

    let found: Enrich | null = null;
    for (const title of [...new Set(titles)]) {
      const page = await wikiLookup(title);
      await sleep(180);
      if (!page) continue;

      let d: Dates = {};
      if (page.qid) {
        d = await datesFromQid(page.qid);
        await sleep(150);
      }
      const bio = page.extract ? trimBio(page.extract) : undefined;
      if (!d.birthDate && !bio) continue;

      found = {
        ...d,
        ...(bio ? { bio } : {}),
        wikipediaUrl: `https://he.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
        qid: page.qid,
      };
      break;
    }

    if (found) {
      hits++;
      enrich[person.id] = { ...enrich[person.id], ...found };
      if (found.birthDate || found.deathDate) {
        dates[person.id] = {
          birthDate: found.birthDate || dates[person.id]?.birthDate,
          deathDate: found.deathDate || dates[person.id]?.deathDate,
        };
      }
      console.log(
        `[${i}/${people.length}] ✓ ${person.name}: ${found.birthDate || "—"} ${found.deathDate ? "/ " + found.deathDate : ""} bio=${found.bio ? found.bio.length : 0}`
      );
    } else {
      enrich[person.id] = { ...enrich[person.id], qid: "NONE" };
      if (i % 25 === 0) console.log(`[${i}/${people.length}] …`);
    }

    if (i % 20 === 0) {
      fs.writeFileSync(PROGRESS, JSON.stringify(enrich, null, 2), "utf8");
    }
  }

  // Mirror dates/bios by identical Hebrew name (ht-* ↔ main ids)
  const byName = new Map<string, string[]>();
  for (const p of SEED.people) {
    const k = normalizeKey(p.name);
    const list = byName.get(k) || [];
    list.push(p.id);
    byName.set(k, list);
  }
  let mirrored = 0;
  for (const ids of byName.values()) {
    if (ids.length < 2) continue;
    const bestDates = ids
      .map((id) => dates[id] || enrich[id])
      .find((d) => d?.birthDate);
    const bestBio = ids.map((id) => enrich[id]).find((e) => e?.bio && e.bio.length > 40);
    for (const id of ids) {
      if (bestDates?.birthDate && !dates[id]?.birthDate) {
        dates[id] = {
          birthDate: bestDates.birthDate,
          deathDate: bestDates.deathDate || dates[id]?.deathDate,
        };
        mirrored++;
      }
      if (bestBio?.bio && (!enrich[id]?.bio || (enrich[id]!.bio!.length < bestBio.bio.length))) {
        enrich[id] = {
          ...enrich[id],
          bio: bestBio.bio,
          wikipediaUrl: enrich[id]?.wikipediaUrl || bestBio.wikipediaUrl,
        };
        mirrored++;
      }
    }
  }
  console.log("Mirrored across duplicate names:", mirrored);

  // Strip qid helper field from public export
  const publicEnrich: Record<string, Enrich> = {};
  for (const [id, e] of Object.entries(enrich)) {
    if (e.qid === "NONE" && !e.bio && !e.birthDate) continue;
    const { qid: _q, ...rest } = e;
    if (rest.bio || rest.wikipediaUrl || rest.birthDate || rest.deathDate) {
      publicEnrich[id] = rest;
    }
  }

  fs.writeFileSync(PROGRESS, JSON.stringify(enrich, null, 2), "utf8");
  fs.writeFileSync(OUT_JSON, JSON.stringify(publicEnrich, null, 2), "utf8");
  fs.writeFileSync(OUT_DATES, formatDates(dates), "utf8");
  fs.writeFileSync(OUT_BIOS, formatBios(publicEnrich), "utf8");

  const withBirth = SEED.people.filter(
    (p) => p.birthDate || dates[p.id]?.birthDate
  ).length;
  const withBio = Object.values(publicEnrich).filter((e) => e.bio).length;
  console.log(`\nDone. hits=${hits} withBirth=${withBirth}/${SEED.people.length} wikiBios=${withBio}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
