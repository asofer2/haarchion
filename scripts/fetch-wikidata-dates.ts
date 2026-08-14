/**
 * Fetch birth/death via Hebrew/English Wikipedia → Wikidata QID → P569/P570
 * Run: npx tsx scripts/fetch-wikidata-dates.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";

const UA = "IshimArchive/1.0 (educational; dates enrichment)";

type Dates = { birthDate?: string; deathDate?: string; qid?: string };

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function toIsoDate(time?: string): string | undefined {
  if (!time) return undefined;
  const m = time.match(/([+-]?\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = m[1]!.replace(/^\+/, "");
  const year = Number(y);
  if (year < 1000 || year > 2100) return undefined;
  return `${y.padStart(4, "0")}-${m[2]}-${m[3]}`;
}

async function qidFromWikipedia(
  lang: "he" | "en",
  title: string
): Promise<string | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title
  )}&prop=pageprops&ppprop=wikibase_item&format=json&origin=*`;
  const data = await fetchJson<{
    query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string }; missing?: string }> };
  }>(url);
  const pages = data?.query?.pages || {};
  for (const page of Object.values(pages)) {
    if (page.missing !== undefined) continue;
    if (page.pageprops?.wikibase_item) return page.pageprops.wikibase_item;
  }
  return null;
}

async function qidFromSearch(query: string, lang: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    query
  )}&language=${lang}&uselang=${lang}&type=item&limit=8&format=json&origin=*`;
  const data = await fetchJson<{
    search?: { id: string; label?: string; description?: string }[];
  }>(url);
  const hits = data?.search || [];
  if (!hits.length) return null;

  // Prefer humans; skip disambiguation / films
  for (const h of hits) {
    const desc = `${h.label || ""} ${h.description || ""}`;
    if (/disambiguation|ויקיפדיה:|film|movie|series|album/i.test(desc)) continue;
    if (
      /actor|actress|singer|Israeli|ישרא|מדבב|שחקן|שחקנית|זמר|voice|comedian|presenter|host|musician|director/i.test(
        desc
      )
    ) {
      return h.id;
    }
  }
  // Fallback: first non-disambiguation
  for (const h of hits) {
    const desc = `${h.label || ""} ${h.description || ""}`;
    if (/disambiguation|ויקיפדיה:/i.test(desc)) continue;
    return h.id;
  }
  return hits[0]?.id || null;
}

async function isHuman(qid: string): Promise<boolean> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`;
  const data = await fetchJson<{
    entities?: Record<
      string,
      { claims?: { P31?: { mainsnak?: { datavalue?: { value?: { id?: string } } } }[] } }
    >;
  }>(url);
  const instances =
    data?.entities?.[qid]?.claims?.P31?.map(
      (c) => c.mainsnak?.datavalue?.value?.id
    ) || [];
  return instances.includes("Q5"); // human
}

async function getDates(qid: string): Promise<Dates> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`;
  const data = await fetchJson<{
    entities?: Record<
      string,
      {
        claims?: {
          P569?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[];
          P570?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[];
        };
      }
    >;
  }>(url);
  const claims = data?.entities?.[qid]?.claims;
  return {
    birthDate: toIsoDate(claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time),
    deathDate: toIsoDate(claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time),
    qid,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Curated precise dates for well-known names when APIs miss */
const CURATED: Record<string, Dates> = {
  "gila-almagor": { birthDate: "1939-07-21" },
  "assi-dayan": { birthDate: "1945-11-23", deathDate: "2014-05-01" },
  "lior-ashkenazi": { birthDate: "1969-12-28" },
  "yael-abecassis": { birthDate: "1967-07-19" },
  "uri-zohar": { birthDate: "1935-11-04", deathDate: "2022-06-02" },
  "chana-maron": { birthDate: "1923-11-22", deathDate: "2014-05-30" },
  "rama-messinger": { deathDate: "2015-07-18" },
  "rama-messinger-w2": { deathDate: "2015-07-18" },
  "svika-pick": { birthDate: "1949-10-03", deathDate: "2022-08-14" },
  "svika-pick-w2": { birthDate: "1949-10-03", deathDate: "2022-08-14" },
  "noa-kirel": { birthDate: "2001-04-10" },
  "noa-kirel-w2": { birthDate: "2001-04-10" },
  "anna-zak": { birthDate: "2001-03-12" },
  "anna-zak-w2": { birthDate: "2001-03-12" },
  "ninet-tayeb": { birthDate: "1981-10-21" },
  "ninet-tayeb-w2": { birthDate: "1981-10-21" },
  "harel-skaat": { birthDate: "1981-08-08" },
  "harel-skaat-w2": { birthDate: "1981-08-08" },
  "shiri-mimon": { birthDate: "1981-05-17" },
  "shiri-mimon-w2": { birthDate: "1981-05-17" },
  "rita": { birthDate: "1962-03-24" },
  "rita-w2": { birthDate: "1962-03-24" },
  "yon-tumarkin": { birthDate: "1989-07-17" },
  "yon-tumarkin-w2": { birthDate: "1989-07-17" },
  "daniel-magon": { birthDate: "1988-03-15" },
  "tal-mosseri": { birthDate: "1975-08-30" },
  "tal-mosseri-w2": { birthDate: "1975-08-30" },
  "yuval-hamevulbal": { birthDate: "1972-07-23" },
  "yuval-hamvulbal-w2": { birthDate: "1972-07-23" },
  "oded-menashe": { birthDate: "1969-09-29" },
  "ht-avdd-mnshh": { birthDate: "1969-09-29" },
};

async function resolvePerson(person: {
  id: string;
  name: string;
  nameOriginal?: string;
  nicknames?: string[];
}): Promise<Dates | null> {
  const titlesHe = [person.name, ...(person.nicknames || []).filter((n) => /[\u0590-\u05FF]/.test(n))];
  const titlesEn = [
    person.nameOriginal,
    ...(person.nicknames || []).filter((n) => /[a-zA-Z]/.test(n)),
  ].filter(Boolean) as string[];

  const qids: string[] = [];
  for (const t of titlesHe) {
    const q = await qidFromWikipedia("he", t);
    await sleep(80);
    if (q) qids.push(q);
  }
  for (const t of titlesEn) {
    const q = await qidFromWikipedia("en", t);
    await sleep(80);
    if (q) qids.push(q);
  }
  for (const t of [...titlesEn, ...titlesHe]) {
    const lang = /[a-zA-Z]/.test(t) ? "en" : "he";
    const q = await qidFromSearch(t, lang);
    await sleep(80);
    if (q) qids.push(q);
  }

  const unique = [...new Set(qids)];
  for (const qid of unique) {
    const human = await isHuman(qid);
    await sleep(60);
    if (!human) continue;
    const dates = await getDates(qid);
    await sleep(60);
    if (dates.birthDate || dates.deathDate) return dates;
  }
  return null;
}

async function main() {
  const out: Record<string, Dates> = { ...CURATED };
  let foundApi = 0;
  let i = 0;

  for (const person of SEED.people) {
    i++;
    try {
      const dates = await resolvePerson(person);
      if (dates && (dates.birthDate || dates.deathDate)) {
        const prev = out[person.id] || {};
        out[person.id] = {
          birthDate: dates.birthDate || prev.birthDate,
          deathDate: dates.deathDate || prev.deathDate,
          qid: dates.qid,
        };
        // drop undefined
        if (!out[person.id]!.birthDate) delete out[person.id]!.birthDate;
        if (!out[person.id]!.deathDate) delete out[person.id]!.deathDate;
        foundApi++;
        console.log(
          `[${i}/${SEED.people.length}] ✓ ${person.name}: ${out[person.id]!.birthDate || "—"} / ${out[person.id]!.deathDate || "—"}`
        );
      } else if (out[person.id]) {
        console.log(
          `[${i}/${SEED.people.length}] ~ ${person.name}: curated ${out[person.id]!.birthDate || "—"} / ${out[person.id]!.deathDate || "—"}`
        );
      } else {
        console.log(`[${i}/${SEED.people.length}] ✗ ${person.name}`);
      }
    } catch (e) {
      console.log(`[${i}/${SEED.people.length}] ! ${person.name} error`, e);
    }
  }

  // Also map -w2 ids to same dates when base id exists
  for (const person of SEED.people) {
    if (person.id.endsWith("-w2")) {
      const base = person.id.replace(/-w2$/i, "");
      if (out[base] && !out[person.id]) out[person.id] = { ...out[base] };
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "wikidata-dates.json"),
    JSON.stringify(out, null, 2),
    "utf8"
  );

  const lines = Object.entries(out)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, d]) => {
      const parts = [
        d.birthDate ? `birthDate: "${d.birthDate}"` : null,
        d.deathDate ? `deathDate: "${d.deathDate}"` : null,
      ].filter(Boolean);
      return `  "${id}": { ${parts.join(", ")} },`;
    })
    .join("\n");

  const ts = `/** Auto-generated + curated birth/death dates (Wikidata / Wikipedia) */
export const PERSON_DATES: Record<
  string,
  { birthDate?: string; deathDate?: string }
> = {
${lines}
};
`;
  fs.writeFileSync(path.join(__dirname, "../src/lib/seed-dates.ts"), ts, "utf8");
  const withBirth = Object.values(out).filter((d) => d.birthDate).length;
  const withDeath = Object.values(out).filter((d) => d.deathDate).length;
  console.log(
    `Done. API hits≈${foundApi}, entries=${Object.keys(out).length}, birth=${withBirth}, death=${withDeath}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
