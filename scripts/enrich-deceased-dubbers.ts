/**
 * Enrich/add deceased Israeli dubbers from the PPTX list.
 * Run: npx tsx scripts/enrich-deceased-dubbers.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";

const UA = "IshimArchive/1.0 (educational; deceased dubbers)";
const OUT_PEOPLE = path.join(__dirname, "../src/lib/seed-deceased-dubbers.ts");
const OUT_DATES = path.join(__dirname, "../src/lib/seed-dates.ts");
const OUT_BIOS = path.join(__dirname, "../src/lib/seed-wiki-enrichment.ts");

type Dates = { birthDate?: string; deathDate?: string };
type Enrich = Dates & { bio?: string; wikipediaUrl?: string; qid?: string };

const DECEASED: { name: string; altTitles?: string[] }[] = [
  { name: "שלמה בר שביט", altTitles: ["שלמה בר-שביט"] },
  { name: "אברהם מור" },
  { name: "נורית כהן" },
  { name: "אריאל פורמן" },
  { name: "רחל אטאס" },
  { name: "דבי בסרגליק", altTitles: ["דבורה בסרגליק"] },
  { name: "רמה מסינגר" },
  { name: "יוני חן", altTitles: ["יונתן חנונו"] },
  { name: "יהודה אפרוני" },
  { name: "יובל זמיר" },
  { name: "ספי ריבלין", altTitles: ["יוסף ריבלין"] },
  { name: "דודיק סמדר" },
  { name: "חיים טופול" },
  { name: "עדי לב" },
  { name: "עמוס שוב" },
  { name: "גאולה נוני" },
  { name: "ראובן שפר" },
  { name: "יוסי ידין", altTitles: ["יוסף ידין"] },
  { name: "שרון בורגאוקר", altTitles: ["שרון בורגאוקר (מדבבת)"] },
  { name: "גדעון שמר" },
  { name: "אמנון מסקין" },
  { name: "יוסי גרבר", altTitles: ["יוסי גרבר"] },
  { name: "רוזינה קמבוס" },
  { name: "דידי גת", altTitles: ["דידי גת (מדבבת)"] },
  { name: "דן תורן" },
  { name: "עזרא הס" },
  { name: "נחמה הנדל" },
  { name: "גלעד ויטל" },
  { name: "רות פרחי" },
  { name: "אורי לוי", altTitles: ["אורי לוי (שחקן)"] },
  { name: "אריה מוסקונה" },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(name: string): string {
  const map: Record<string, string> = {
    א: "a",
    ב: "b",
    ג: "g",
    ד: "d",
    ה: "h",
    ו: "v",
    ז: "z",
    ח: "ch",
    ט: "t",
    י: "y",
    כ: "k",
    ך: "k",
    ל: "l",
    מ: "m",
    ם: "m",
    נ: "n",
    ן: "n",
    ס: "s",
    ע: "a",
    פ: "p",
    ף: "p",
    צ: "tz",
    ץ: "tz",
    ק: "k",
    ר: "r",
    ש: "sh",
    ת: "t",
    " ": "-",
    "-": "-",
    "־": "-",
  };
  return name
    .split("")
    .map((c) => map[c] || "")
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function toIso(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = Number(m[1]);
  if (y < 1900 || y > 2100) return undefined;
  const mm = m[2] === "00" ? "01" : m[2]!;
  const dd = m[3] === "00" ? "01" : m[3]!;
  return `${m[1]}-${mm}-${dd}`;
}

function norm(s: string) {
  return s
    .replace(/['׳״"]/g, "")
    .replace(/־/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function trimBio(extract: string, max = 420): string {
  let t = extract.replace(/\s+/g, " ").trim();
  if (/האם התכוונתם|עמוד פירושונים/i.test(t)) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"));
  return (last > 120 ? cut.slice(0, last + 1) : cut.trim() + "…").trim();
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

async function wikiLookup(title: string) {
  const url =
    `https://he.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}` +
    `&prop=pageprops|extracts&ppprop=wikibase_item&exintro=1&explaintext=1&redirects=1&format=json&origin=*`;
  const data = await fetchJson<{
    query?: {
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

function findExisting(name: string) {
  const nn = norm(name);
  return SEED.people.find((p) => {
    const pn = norm(p.name);
    if (pn === nn || pn.includes(nn) || nn.includes(pn)) return true;
    return (p.nicknames || []).some((k) => {
      const kn = norm(k);
      return kn === nn || kn.includes(nn) || nn.includes(kn);
    });
  });
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

function loadExistingBios(): Record<string, Enrich> {
  const p = OUT_BIOS;
  if (!fs.existsSync(p)) return {};
  const src = fs.readFileSync(p, "utf8");
  // crude parse via eval of object body — safer: keep JSON sidecar
  const jsonPath = path.join(__dirname, "deceased-enrich-progress.json");
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  }
  return {};
}

function formatBios(map: Record<string, Enrich>): string {
  // Merge with existing PERSON_WIKI_ENRICHMENT by reading current file if it's JSON-like
  // We'll rewrite only our keys into a merge file that seed imports... better: update full enrichment file.
  const existingPath = OUT_BIOS;
  let existing: Record<string, Enrich> = {};
  try {
    // Dynamically import would be better after write; for now read progress + we'll merge in main with PERSON import
  } catch {}
  void existing;
  void existingPath;

  const lines = Object.entries(map)
    .filter(([, e]) => e.bio || e.wikipediaUrl)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, e]) => {
      const parts = [
        e.bio ? `bio: ${JSON.stringify(e.bio)}` : null,
        e.wikipediaUrl ? `wikipediaUrl: ${JSON.stringify(e.wikipediaUrl)}` : null,
      ].filter(Boolean);
      return `  "${id}": { ${parts.join(", ")} },`;
    })
    .join("\n");

  return `/** Wikipedia extracts for people (bios + links) — scripts/enrich-all-wiki.ts + deceased dubbers */
export const PERSON_WIKI_ENRICHMENT: Record<
  string,
  { bio?: string; wikipediaUrl?: string }
> = {
${lines}
};
`;
}

function formatNewPeople(
  people: {
    id: string;
    name: string;
    bio: string;
    birthDate?: string;
    deathDate?: string;
    wikipediaUrl?: string;
  }[]
): string {
  const entries = people
    .map((p) => {
      const parts = [
        `bio: ${JSON.stringify(p.bio)}`,
        `tags: ["דיבוב"]`,
        p.birthDate ? `birthDate: "${p.birthDate}"` : null,
        p.deathDate ? `deathDate: "${p.deathDate}"` : null,
        p.wikipediaUrl ? `wikipediaUrl: ${JSON.stringify(p.wikipediaUrl)}` : null,
      ].filter(Boolean);
      return `  p("${p.id}", "${p.name}", ["dubbing", "film", "series", "stage"], {\n    ${parts.join(",\n    ")},\n  }),`;
    })
    .join("\n");

  return `import type { ActivityCategory, Person } from "./types";
import { portrait } from "./portrait";

const now = "2026-07-28T21:00:00.000Z";

function wikiImage(title: string) {
  return portrait(title);
}

function p(
  id: string,
  name: string,
  activities: ActivityCategory[],
  extra: Partial<Person> & { bio: string } = { bio: "" }
): Person {
  const displayName = extra.name || name;
  return {
    id,
    name: displayName,
    nicknames: extra.nicknames || [],
    tags: extra.tags || [],
    activities,
    bio: extra.bio,
    nameOriginal: extra.nameOriginal,
    birthDate: extra.birthDate,
    deathDate: extra.deathDate,
    wikipediaUrl: extra.wikipediaUrl,
    imageUrl: extra.imageUrl ?? wikiImage(displayName),
    createdAt: now,
    updatedAt: now,
  };
}

/** מדבבים ישראלים שנפטרו — מרשימת מצגת «מדבבים ישראלים» + ויקיפדיה */
export const DECEASED_DUBBERS_PEOPLE: Person[] = [
${entries}
];
`;
}

async function main() {
  const { PERSON_WIKI_ENRICHMENT } = await import("../src/lib/seed-wiki-enrichment");
  const dates: Record<string, Dates> = { ...PERSON_DATES };
  const enrich: Record<string, Enrich> = { ...PERSON_WIKI_ENRICHMENT };
  const newPeople: {
    id: string;
    name: string;
    bio: string;
    birthDate?: string;
    deathDate?: string;
    wikipediaUrl?: string;
  }[] = [];

  for (const entry of DECEASED) {
    const existing = findExisting(entry.name);
    const titles = [entry.name, ...(entry.altTitles || [])];
    let found: Enrich | null = null;
    let pageTitle = entry.name;

    for (const title of titles) {
      const page = await wikiLookup(title);
      await sleep(200);
      if (!page?.extract && !page?.qid) continue;
      let d: Dates = {};
      if (page.qid) {
        d = await datesFromQid(page.qid);
        await sleep(150);
      }
      const bio = page.extract ? trimBio(page.extract) : undefined;
      if (!d.birthDate && !d.deathDate && !bio) continue;
      found = {
        ...d,
        ...(bio ? { bio } : {}),
        wikipediaUrl: `https://he.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
        qid: page.qid,
      };
      pageTitle = page.title;
      break;
    }

    if (!found) {
      console.log(`NO_WIKI|${entry.name}`);
      if (!existing) {
        // still add stub so they appear from the PPTX list
        const id = slugify(entry.name);
        newPeople.push({
          id,
          name: entry.name,
          bio: `${entry.name} היה/הייתה מדבב/ת ושחקן/ית ישראלי/ת (ז״ל). לפי רשימת «מדבבים ישראלים שנפטרו».`,
          deathDate: undefined,
        });
      }
      continue;
    }

    if (existing) {
      const id = existing.id;
      enrich[id] = {
        ...enrich[id],
        bio: found.bio || enrich[id]?.bio,
        wikipediaUrl: found.wikipediaUrl || enrich[id]?.wikipediaUrl,
      };
      dates[id] = {
        birthDate: found.birthDate || dates[id]?.birthDate || existing.birthDate,
        deathDate: found.deathDate || dates[id]?.deathDate || existing.deathDate,
      };
      console.log(
        `UPDATE|${entry.name}|${id}|${dates[id]?.birthDate || "-"}|${dates[id]?.deathDate || "-"}|${pageTitle}`
      );
    } else {
      const id = slugify(entry.name);
      newPeople.push({
        id,
        name: entry.name,
        bio:
          found.bio ||
          `${entry.name} היה/הייתה מדבב/ת ושחקן/ית ישראלי/ת (ז״ל).`,
        birthDate: found.birthDate,
        deathDate: found.deathDate,
        wikipediaUrl: found.wikipediaUrl,
      });
      enrich[id] = {
        bio: found.bio,
        wikipediaUrl: found.wikipediaUrl,
      };
      dates[id] = {
        birthDate: found.birthDate,
        deathDate: found.deathDate,
      };
      console.log(
        `ADD|${entry.name}|${id}|${found.birthDate || "-"}|${found.deathDate || "-"}|${pageTitle}`
      );
    }
  }

  fs.writeFileSync(OUT_DATES, formatDates(dates), "utf8");
  fs.writeFileSync(OUT_BIOS, formatBios(enrich), "utf8");
  fs.writeFileSync(OUT_PEOPLE, formatNewPeople(newPeople), "utf8");
  fs.writeFileSync(
    path.join(__dirname, "deceased-enrich-progress.json"),
    JSON.stringify({ newPeople, enrichKeys: Object.keys(enrich).length }, null, 2),
    "utf8"
  );

  console.log(`\nDone. newPeople=${newPeople.length} dates=${Object.keys(dates).length} bios=${Object.keys(enrich).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
