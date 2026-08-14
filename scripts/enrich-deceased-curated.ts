/** Apply curated Wikipedia REST summaries for deceased dubbers that API action=query missed. */
import fs from "fs";
import path from "path";
import { PERSON_DATES } from "../src/lib/seed-dates";
import { PERSON_WIKI_ENRICHMENT } from "../src/lib/seed-wiki-enrichment";

const UA = "IshimArchive/1.0 (educational; deceased curated)";

type Dates = { birthDate?: string; deathDate?: string };
type Enrich = { bio?: string; wikipediaUrl?: string };

const CURATED: {
  id: string;
  name: string;
  title: string;
  qid?: string;
  isNew?: boolean;
}[] = [
  { id: "yvsy-ydyn", name: "יוסי ידין", title: "יוסף ידין", qid: "Q3572713", isNew: true },
  { id: "rvzynh-kmbvs", name: "רוזינה קמבוס", title: "רוזינה קמבוס", qid: "Q12411256", isNew: true },
  { id: "gavlh-nvny", name: "גאולה נוני", title: "גאולה נוני", qid: "Q6695608" },
  { id: "gdavn-shmr", name: "גדעון שמר", title: "גדעון שמר", qid: "Q6821445" },
  { id: "amnvn-mskyn", name: "אמנון מסקין", title: "אמנון מסקין", qid: "Q18368431" },
  { id: "nchmh-hndl", name: "נחמה הנדל", title: "נחמה הנדל", qid: "Q2906902" },
  { id: "dn-tvrn", name: "דן תורן", title: "דן תורן", qid: "Q12405841" },
  { id: "azra-hs", name: "עזרא הס", title: "עזרא הס", qid: "Q6578459" },
  { id: "dydy-gt", name: "דידי גת", title: "דידי גת", qid: "Q105811416", isNew: true },
  { id: "glad-vytl", name: "גלעד ויטל", title: "גלעד ויטל שמעון", qid: "Q54399350", isNew: true },
  { id: "rvt-prchy", name: "רות פרחי", title: "רות פרחי", qid: "Q51747108", isNew: true },
  { id: "avraham-mor", name: "אברהם מור", title: "אברהם מור" },
  { id: "aryal-pvrmn", name: "אריאל פורמן", title: "אריאל פורמן" },
  { id: "nvryt-khn", name: "נורית כהן", title: "נורית כהן" },
  { id: "rchl-atas", name: "רחל אטאס", title: "רחל אטאס" },
  { id: "debi-beserglik", name: "דבי בסרגליק", title: "דבי בסרגליק" },
  { id: "yvbl-zmyr", name: "יובל זמיר", title: "יובל זמיר" },
  { id: "dvdyk-smdr", name: "דודיק סמדר", title: "דודיק סמדר" },
  { id: "ravbn-shpr", name: "ראובן שפר", title: "ראובן שפר" },
  { id: "yvsy-grbr", name: "יוסי גרבר", title: "יוסי גרבר" },
  { id: "shlmh-br-shbyt", name: "שלמה בר שביט", title: "שלמה בר-שביט", isNew: true },
  { id: "chyym-tvpvl", name: "חיים טופול", title: "חיים טופול" },
  { id: "sefi-rivlin", name: "ספי ריבלין", title: "ספי ריבלין" },
  { id: "yoni-chen", name: "יוני חן", title: "יוני חן" },
  { id: "rama-messinger", name: "רמה מסינגר", title: "רמה מסינגר" },
  { id: "yhvdh-aprvny", name: "יהודה אפרוני", title: "יהודה אפרוני" },
  { id: "ady-lb", name: "עדי לב", title: "עדי לב" },
  { id: "amvs-shvb", name: "עמוס שוב", title: "עמוס שוב" },
  { id: "avry-lvy-shchkn", name: "אורי לוי", title: "אורי לוי (שחקן)" },
  { id: "aryh-mvskvnh", name: "אריה מוסקונה", title: "אריה מוסקונה" },
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
  if (!t || /האם התכוונתם/i.test(t)) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"));
  return (last > 80 ? cut.slice(0, last + 1) : cut.trim() + "…").trim();
}

async function restSummary(title: string): Promise<{
  extract?: string;
  qid?: string;
  title: string;
} | null> {
  const url = `https://he.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    type?: string;
    title?: string;
    extract?: string;
    wikibase_item?: string;
  };
  if (j.type === "disambiguation") return null;
  return {
    title: j.title || title,
    extract: j.extract,
    qid: j.wikibase_item,
  };
}

async function datesFromQid(qid: string): Promise<Dates> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return {};
  const data = (await res.json()) as {
    entities?: Record<string, { claims?: any }>;
  };
  const claims = data?.entities?.[qid]?.claims;
  if (!claims) return {};
  const births = (claims.P569 || [])
    .map((c: any) => toIso(c?.mainsnak?.datavalue?.value?.time))
    .filter(Boolean) as string[];
  births.sort((a, b) => (b.endsWith("-01-01") ? 0 : 2) - (a.endsWith("-01-01") ? 0 : 2));
  return {
    ...(births[0] ? { birthDate: births[0] } : {}),
    ...(toIso(claims.P570?.[0]?.mainsnak?.datavalue?.value?.time)
      ? { deathDate: toIso(claims.P570[0].mainsnak.datavalue.value.time) }
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
    nicknames?: string[];
  }[]
): string {
  const entries = people
    .map((p) => {
      const parts = [
        `bio: ${JSON.stringify(p.bio)}`,
        `tags: ["דיבוב"]`,
        p.nicknames?.length ? `nicknames: ${JSON.stringify(p.nicknames)}` : null,
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
  const newPeople: {
    id: string;
    name: string;
    bio: string;
    birthDate?: string;
    deathDate?: string;
    wikipediaUrl?: string;
    nicknames?: string[];
  }[] = [];

  // שרון בורגאוקר — אין ערך ויקי
  newPeople.push({
    id: "shrvn-bvrgavkr",
    name: "שרון בורגאוקר",
    bio: "שרון בורגאוקר הייתה מדבבת ישראלית (ז״ל). מופיעה ברשימת «מדבבים ישראלים שנפטרו».",
    nicknames: ["שרון בורגאוקר ז״ל"],
  });

  for (const c of CURATED) {
    const page = await restSummary(c.title);
    await sleep(300);
    if (!page?.extract) {
      console.log(`MISS|${c.name}|${c.title}`);
      if (c.isNew && c.id !== "shrvn-bvrgavkr") {
        // keep minimal stub only if completely missing later
      }
      continue;
    }
    const qid = page.qid || c.qid;
    let d: Dates = {};
    if (qid) {
      d = await datesFromQid(qid);
      await sleep(250);
    }
    const bio = trimBio(page.extract);
    const wikipediaUrl = `https://he.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
    const prev = enrich[c.id]?.bio || "";
    enrich[c.id] = {
      bio: bio.length >= prev.length ? bio : prev || bio,
      wikipediaUrl,
    };
    dates[c.id] = {
      birthDate: d.birthDate || dates[c.id]?.birthDate,
      deathDate: d.deathDate || dates[c.id]?.deathDate,
    };
    if (c.isNew) {
      newPeople.push({
        id: c.id,
        name: c.name,
        bio: enrich[c.id].bio!,
        birthDate: dates[c.id].birthDate,
        deathDate: dates[c.id].deathDate,
        wikipediaUrl,
        nicknames: c.name === "יוסי ידין" ? ["יוסף ידין"] : c.name === "גלעד ויטל" ? ["גלעד ויטל שמעון"] : undefined,
      });
    }
    console.log(
      `OK|${c.name}|${dates[c.id].birthDate || "-"}|${dates[c.id].deathDate || "-"}|${bio.length}`
    );
  }

  // de-dupe new people by id (שרון first, then wiki ones)
  const byId = new Map<string, (typeof newPeople)[0]>();
  for (const p of newPeople) byId.set(p.id, { ...byId.get(p.id), ...p });

  fs.writeFileSync(path.join(__dirname, "../src/lib/seed-dates.ts"), formatDates(dates), "utf8");
  fs.writeFileSync(path.join(__dirname, "../src/lib/seed-wiki-enrichment.ts"), formatBios(enrich), "utf8");
  fs.writeFileSync(
    path.join(__dirname, "../src/lib/seed-deceased-dubbers.ts"),
    formatNewPeople([...byId.values()]),
    "utf8"
  );
  console.log(`\nnewPeople=${byId.size}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
