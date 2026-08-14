/**
 * Pass 2: Wikipedia OpenSearch for people still missing birth/bio.
 * Also mirrors enrichment across identical Hebrew names (incl. Hop Tamir).
 * Run: npx tsx scripts/enrich-pass2-search.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";
import { PERSON_WIKI_ENRICHMENT } from "../src/lib/seed-wiki-enrichment";

const UA = "IshimArchive/1.0 (educational; wiki pass2)";
const OUT_DATES = path.join(__dirname, "../src/lib/seed-dates.ts");
const OUT_BIOS = path.join(__dirname, "../src/lib/seed-wiki-enrichment.ts");
const PROGRESS = path.join(__dirname, "enrich-pass2-progress.json");

type Dates = { birthDate?: string; deathDate?: string };
type Enrich = Dates & { bio?: string; wikipediaUrl?: string };

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

function isThinBio(bio?: string): boolean {
  if (!bio) return true;
  if (bio.length < 60) return true;
  return /ארכיון ערוץ הופ|לפי קטגוריית מדבבים|מדבב\/ת ועורך/.test(bio);
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

async function wikiSearch(q: string): Promise<string[]> {
  const url =
    `https://he.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}` +
    `&limit=5&namespace=0&format=json&origin=*`;
  const data = await fetchJson<[string, string[]]>(url);
  return data?.[1] || [];
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
  if (/האם התכוונתם|עמוד פירושונים|may refer to/i.test(t)) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const last = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"));
  return (last > 120 ? cut.slice(0, last + 1) : cut.trim() + "…").trim();
}

function nameLooksRelated(personName: string, pageTitle: string, extract?: string): boolean {
  const a = normalizeKey(personName);
  const b = normalizeKey(pageTitle.replace(/\s*\([^)]*\)\s*/g, " "));
  if (a === b) return true;
  const [af, ...arest] = a.split(" ");
  const [bf, ...brest] = b.split(" ");
  if (af && bf && af === bf && arest.join(" ") === brest.join(" ")) return true;
  // Allow partial last-name match when extract mentions acting/dubbing
  if (arest.length && brest.length && arest[arest.length - 1] === brest[brest.length - 1] && af === bf) {
    return true;
  }
  if (extract && /שחקנ|מדבב|זמר|במאי|מנחה|קומיק/.test(extract) && af === bf) {
    return true;
  }
  return false;
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

/** Curated bios/dates when Wikipedia has no page but sources confirm role */
const CURATED: Record<string, Enrich> = {
  "ht-chsyh-vrthyym": {
    bio: "חסיה ורטהיים היא מפיקת דיבוב ישראלית. הפיקה דיבובים לטלוויזיה החינוכית, בהם «היי! בינבה» ו«המומינים».",
  },
  "ht-tmy-ashl": {
    bio: "תמי אשל (תמר אשל) היא שחקנית, זמרת ומדבבת ישראלית. בוגרת בית צבי, הופיעה בהבימה ובקאמרי ודיבבה בהפקות ילדים.",
  },
  "ht-shchr-tzrpty": {
    bio: "שחר צרפתי הוא מדבב וטכנאי סאונד ישראלי. דיבב בהפקות אנימציה בשנות ה־90 ועבד באולפני טריטון.",
  },
  "ht-chnh-drvry-kshy": {
    bio: "חנה דרורי קשי היא במאית ומפיקת דיבוב ישראלית. ביימה דיבובים לטלוויזיה החינוכית, בהם «היי! בינבה» ו«המומינים».",
  },
  "ht-pzyt-nvny": {
    bio: "פזית נוני היא מדבבת ישראלית בהפקות ילדים ודיבוב עברי.",
  },
  "ht-lylyan-brtv": {
    bio: "ליליאן ברטו היא מדבבת ישראלית בהפקות ילדים ודיבוב עברי.",
  },
  "ht-shmavn-khn": {
    bio: "שמעון כהן הוא שחקן ומדבב ישראלי. דיבב דמויות רבות בהפקות אנימציה לילדים.",
  },
  "ht-shmvlyk-yprch": {
    bio: "שמוליק יפרח הוא מדבב ישראלי בהפקות ילדים ודיבוב עברי.",
  },
  "ht-yvrm-gl": {
    bio: "יורם גל הוא שחקן, במאי ומדבב ישראלי.",
  },
  "ht-rvny-vyys": {
    bio: "רוני וייס הוא מדבב ישראלי בהפקות ילדים ודיבוב עברי.",
  },
  "ht-rvty-hvltzmn": {
    bio: "רותי הולצמן היא מדבבת ישראלית בהפקות ילדים ודיבוב עברי.",
  },
};

async function main() {
  const dates: Record<string, Dates> = { ...PERSON_DATES };
  const enrich: Record<string, Enrich> = { ...PERSON_WIKI_ENRICHMENT };

  for (const [id, e] of Object.entries(CURATED)) {
    enrich[id] = { ...enrich[id], ...e };
    if (e.birthDate || e.deathDate) {
      dates[id] = {
        birthDate: e.birthDate || dates[id]?.birthDate,
        deathDate: e.deathDate || dates[id]?.deathDate,
      };
    }
  }

  let done: Record<string, boolean> = {};
  if (fs.existsSync(PROGRESS)) {
    done = JSON.parse(fs.readFileSync(PROGRESS, "utf8"));
  }

  const targets = SEED.people.filter((p) => {
    const hasBirth = !!(p.birthDate || dates[p.id]?.birthDate);
    const bio = enrich[p.id]?.bio || p.bio;
    const thin = isThinBio(bio);
    return !hasBirth || thin || p.id.startsWith("ht-");
  });

  console.log("Pass2 targets:", targets.length);
  let hits = 0;
  let i = 0;

  for (const person of targets) {
    i++;
    if (done[person.id]) continue;
    const hasBirth = !!(person.birthDate || dates[person.id]?.birthDate);
    const hasGoodBio = !isThinBio(enrich[person.id]?.bio || person.bio);
    if (hasBirth && hasGoodBio && !person.id.startsWith("ht-")) {
      done[person.id] = true;
      continue;
    }
    // HT with curated bio already — skip wiki unless missing birth
    if (person.id.startsWith("ht-") && hasBirth && !isThinBio(enrich[person.id]?.bio)) {
      done[person.id] = true;
      continue;
    }

    const query = cleanName(person.name);
    const titles = [
      query,
      ...(await wikiSearch(query)),
      ...(person.nameOriginal ? await wikiSearch(person.nameOriginal) : []),
    ];
    await sleep(160);

    let found: Enrich | null = null;
    for (const title of [...new Set(titles)].slice(0, 6)) {
      const page = await wikiLookup(title);
      await sleep(140);
      if (!page?.extract) continue;
      if (!nameLooksRelated(person.name, page.title, page.extract)) continue;

      let d: Dates = {};
      if (page.qid) {
        d = await datesFromQid(page.qid);
        await sleep(120);
      }
      const bio = trimBio(page.extract);
      if (!bio && !d.birthDate) continue;
      found = {
        ...d,
        ...(bio ? { bio } : {}),
        wikipediaUrl: `https://he.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
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
        `[${i}/${targets.length}] ✓ ${person.name}: ${found.birthDate || "—"} bio=${found.bio?.length || 0}`
      );
    } else if (i % 30 === 0) {
      console.log(`[${i}/${targets.length}] …`);
    }

    done[person.id] = true;
    if (i % 15 === 0) {
      fs.writeFileSync(PROGRESS, JSON.stringify(done), "utf8");
    }
  }

  // Mirror by identical Hebrew name
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
    const bestDates = ids.map((id) => dates[id]).find((d) => d?.birthDate);
    const bestBio = ids
      .map((id) => enrich[id])
      .filter((e) => e?.bio && e.bio.length > 40)
      .sort((a, b) => (b!.bio!.length - a!.bio!.length))[0];
    for (const id of ids) {
      if (bestDates?.birthDate && !dates[id]?.birthDate) {
        dates[id] = {
          birthDate: bestDates.birthDate,
          deathDate: bestDates.deathDate || dates[id]?.deathDate,
        };
        mirrored++;
      }
      if (bestBio?.bio && (!enrich[id]?.bio || enrich[id]!.bio!.length < bestBio.bio!.length)) {
        enrich[id] = {
          ...enrich[id],
          bio: bestBio.bio,
          wikipediaUrl: enrich[id]?.wikipediaUrl || bestBio.wikipediaUrl,
        };
        mirrored++;
      }
    }
  }
  console.log("Mirrored:", mirrored);

  fs.writeFileSync(PROGRESS, JSON.stringify(done), "utf8");
  fs.writeFileSync(OUT_DATES, formatDates(dates), "utf8");
  fs.writeFileSync(OUT_BIOS, formatBios(enrich), "utf8");

  const withBirth = SEED.people.filter((p) => p.birthDate || dates[p.id]?.birthDate).length;
  const withBio = Object.values(enrich).filter((e) => e.bio && e.bio.length > 40).length;
  console.log(`\nDone. hits=${hits} withBirth=${withBirth}/${SEED.people.length} wikiBios=${withBio}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
