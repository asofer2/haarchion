/**
 * Pass 2: fill remaining deceased dubbers from Wikipedia (search API + slower).
 * Run: npx tsx scripts/enrich-deceased-pass2.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";
import { PERSON_WIKI_ENRICHMENT } from "../src/lib/seed-wiki-enrichment";
import { DECEASED_DUBBERS_PEOPLE } from "../src/lib/seed-deceased-dubbers";

const UA = "IshimArchive/1.0 (educational; deceased dubbers pass2)";
const OUT_DATES = path.join(__dirname, "../src/lib/seed-dates.ts");
const OUT_BIOS = path.join(__dirname, "../src/lib/seed-wiki-enrichment.ts");
const OUT_PEOPLE = path.join(__dirname, "../src/lib/seed-deceased-dubbers.ts");

type Dates = { birthDate?: string; deathDate?: string };
type Enrich = { bio?: string; wikipediaUrl?: string };

const TARGETS: { name: string; id?: string; titles: string[] }[] = [
  { name: "שלמה בר שביט", id: "shlmh-br-shbyt", titles: ["שלמה בר-שביט"] },
  { name: "אברהם מור", id: "avraham-mor", titles: ["אברהם מור"] },
  { name: "נורית כהן", id: "nvryt-khn", titles: ["נורית כהן"] },
  { name: "אריאל פורמן", id: "aryal-pvrmn", titles: ["אריאל פורמן"] },
  { name: "רחל אטאס", id: "rchl-atas", titles: ["רחל אטאס"] },
  { name: "דבי בסרגליק", id: "debi-beserglik", titles: ["דבי בסרגליק"] },
  { name: "רמה מסינגר", id: "rama-messinger", titles: ["רמה מסינגר"] },
  { name: "יוני חן", id: "yoni-chen", titles: ["יוני חן"] },
  { name: "יהודה אפרוני", id: "yhvdh-aprvny", titles: ["יהודה אפרוני"] },
  { name: "יובל זמיר", id: "yvbl-zmyr", titles: ["יובל זמיר"] },
  { name: "ספי ריבלין", id: "sefi-rivlin", titles: ["ספי ריבלין"] },
  { name: "דודיק סמדר", id: "dvdyk-smdr", titles: ["דודיק סמדר"] },
  { name: "חיים טופול", id: "chyym-tvpvl", titles: ["חיים טופול"] },
  { name: "עדי לב", id: "ady-lb", titles: ["עדי לב"] },
  { name: "עמוס שוב", id: "amvs-shvb", titles: ["עמוס שוב"] },
  { name: "גאולה נוני", id: "gavlh-nvny", titles: ["גאולה נוני"] },
  { name: "ראובן שפר", id: "ravbn-shpr", titles: ["ראובן שפר"] },
  { name: "יוסי ידין", id: "yvsy-ydyn", titles: ["יוסי ידין", "יוסף ידין"] },
  { name: "שרון בורגאוקר", id: "shrvn-bvrgavkr", titles: ["שרון בורגאוקר"] },
  { name: "גדעון שמר", id: "gdavn-shmr", titles: ["גדעון שמר"] },
  { name: "אמנון מסקין", id: "amnvn-mskyn", titles: ["אמנון מסקין"] },
  { name: "יוסי גרבר", id: "yvsy-grbr", titles: ["יוסי גרבר"] },
  { name: "רוזינה קמבוס", id: "rvzynh-kmbvs", titles: ["רוזינה קמבוס"] },
  { name: "דידי גת", id: "dydy-gt", titles: ["דידי גת"] },
  { name: "דן תורן", id: "dn-tvrn", titles: ["דן תורן"] },
  { name: "עזרא הס", id: "azra-hs", titles: ["עזרא הס"] },
  { name: "נחמה הנדל", id: "nchmh-hndl", titles: ["נחמה הנדל"] },
  { name: "גלעד ויטל", id: "glad-vytl", titles: ["גלעד ויטל"] },
  { name: "רות פרחי", id: "rvt-prchy", titles: ["רות פרחי"] },
  { name: "אורי לוי", id: "avry-lvy-shchkn", titles: ["אורי לוי (שחקן)"] },
  { name: "אריה מוסקונה", id: "aryh-mvskvnh", titles: ["אריה מוסקונה"] },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toIso(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = Number(m[1]);
  if (y < 1900 || y > 2100) return undefined;
  return `${m[1]}-${m[2] === "00" ? "01" : m[2]}-${m[3] === "00" ? "01" : m[3]}`;
}

function trimBio(extract: string, max = 420): string {
  let t = extract.replace(/\s+/g, " ").trim();
  if (/האם התכוונתם|עמוד פירושונים/i.test(t)) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"));
  return (last > 120 ? cut.slice(0, last + 1) : cut.trim() + "…").trim();
}

function isThin(bio?: string) {
  if (!bio) return true;
  if (bio.length < 80) return true;
  return /לפי קטגוריית מדבבים|לפי רשימת «מדבבים|היה\/הייתה מדבב/.test(bio);
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

async function wikiSearch(q: string): Promise<string | null> {
  const url =
    `https://he.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}` +
    `&srlimit=5&format=json&origin=*`;
  const data = await fetchJson<{
    query?: { search?: { title: string }[] };
  }>(url);
  const hits = data?.query?.search || [];
  const exact = hits.find((h) => h.title.replace(/־/g, "-") === q.replace(/־/g, "-"));
  return exact?.title || hits[0]?.title || null;
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
  births.sort((a, b) => ((b.endsWith("-01-01") ? 0 : 2) - (a.endsWith("-01-01") ? 0 : 2)));
  return {
    ...(births[0] ? { birthDate: births[0] } : {}),
    ...(toIso(claims.P570?.[0]?.mainsnak?.datavalue?.value?.time)
      ? { deathDate: toIso(claims.P570?.[0]?.mainsnak?.datavalue?.value?.time) }
      : {}),
  };
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
  return `/** Wikipedia extracts for people (bios + links) */
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
  const dates: Record<string, Dates> = { ...PERSON_DATES };
  const enrich: Record<string, Enrich> = { ...PERSON_WIKI_ENRICHMENT };
  const newById = new Map(DECEASED_DUBBERS_PEOPLE.map((p) => [p.id, { ...p }]));

  let hits = 0;
  for (const t of TARGETS) {
    const id = t.id!;
    const person = SEED.people.find((p) => p.id === id) || newById.get(id);
    const currentBio = enrich[id]?.bio || person?.bio;
    const hasDeath = !!(dates[id]?.deathDate || person?.deathDate);
    const hasGoodBio = !isThin(currentBio);

    if (hasDeath && hasGoodBio && enrich[id]?.wikipediaUrl) {
      console.log(`SKIP|${t.name}`);
      continue;
    }

    let page: { title: string; qid?: string; extract?: string } | null = null;
    for (const title of t.titles) {
      page = await wikiLookup(title);
      await sleep(450);
      if (page?.extract || page?.qid) break;
      page = null;
    }
    if (!page) {
      const found = await wikiSearch(t.name);
      await sleep(450);
      if (found) {
        page = await wikiLookup(found);
        await sleep(450);
      }
    }
    if (!page) {
      console.log(`MISS|${t.name}`);
      continue;
    }

    let d: Dates = {};
    if (page.qid) {
      d = await datesFromQid(page.qid);
      await sleep(350);
    }
    const bio = page.extract ? trimBio(page.extract) : undefined;
    const wikipediaUrl = `https://he.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;

    enrich[id] = {
      bio: bio && (!currentBio || isThin(currentBio) || bio.length > (currentBio?.length || 0))
        ? bio
        : enrich[id]?.bio || currentBio,
      wikipediaUrl: enrich[id]?.wikipediaUrl || wikipediaUrl,
    };
    dates[id] = {
      birthDate: d.birthDate || dates[id]?.birthDate || person?.birthDate,
      deathDate: d.deathDate || dates[id]?.deathDate || person?.deathDate,
    };

    if (newById.has(id)) {
      const np = newById.get(id)!;
      np.bio = enrich[id].bio || np.bio;
      np.birthDate = dates[id].birthDate || np.birthDate;
      np.deathDate = dates[id].deathDate || np.deathDate;
      np.wikipediaUrl = enrich[id].wikipediaUrl || np.wikipediaUrl;
      newById.set(id, np);
    }

    hits++;
    console.log(
      `OK|${t.name}|${id}|${dates[id].birthDate || "-"}|${dates[id].deathDate || "-"}|bio=${(enrich[id].bio || "").length}`
    );
  }

  fs.writeFileSync(OUT_DATES, formatDates(dates), "utf8");
  fs.writeFileSync(OUT_BIOS, formatBios(enrich), "utf8");
  fs.writeFileSync(
    OUT_PEOPLE,
    formatNewPeople(
      [...newById.values()].map((p) => ({
        id: p.id,
        name: p.name,
        bio: p.bio,
        birthDate: p.birthDate,
        deathDate: p.deathDate,
        wikipediaUrl: p.wikipediaUrl,
      }))
    ),
    "utf8"
  );

  console.log(`\nDone hits=${hits}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
