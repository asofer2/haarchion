/**
 * Fetch discography for SEED people from Wikidata (performer of albums)
 * and Hebrew Wikipedia "דיסקוגרפיה" sections.
 *
 * Run: npx tsx scripts/fetch-discography.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import type { DiscographyItem } from "../src/lib/types";

type Entry = {
  wikipediaUrl?: string;
  items: DiscographyItem[];
};

async function sparql(query: string): Promise<Record<string, string>[]> {
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "IshimArchive/1.0 (educational; discography)",
    },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) return [];
  const j = (await res.json()) as {
    results: { bindings: Record<string, { value: string }>[] };
  };
  return j.results.bindings.map((b) => {
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(b)) row[k] = v.value;
    return row;
  });
}

async function albumsForLabel(
  label: string,
  lang: "he" | "en"
): Promise<DiscographyItem[]> {
  const safe = label.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const q = `SELECT DISTINCT ?albumLabel ?year ?typeLabel WHERE {
    ?person rdfs:label "${safe}"@${lang}.
    ?person wdt:P31 wd:Q5.
    ?album wdt:P175 ?person.
    ?album wdt:P31 ?type.
    ?type wdt:P279* wd:Q2188189.
    OPTIONAL { ?album wdt:P577 ?date. BIND(YEAR(?date) AS ?year) }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "he,en". }
  }
  ORDER BY DESC(?year)
  LIMIT 40`;
  const rows = await sparql(q);
  const items: DiscographyItem[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const title = row.albumLabel;
    if (!title || /^Q\d+$/.test(title)) continue;
    const year = row.year ? Number(row.year) : undefined;
    const key = `${title}|${year || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const typeLabel = row.typeLabel || "";
    let kind = "אלבום";
    if (/single|סינגל/i.test(typeLabel)) kind = "סינגל";
    else if (/compilation|אוסף/i.test(typeLabel)) kind = "אוסף";
    else if (/cassette|קלטת/i.test(typeLabel)) kind = "קלטת";
    else if (/EP/i.test(typeLabel)) kind = "EP";
    items.push({
      title,
      ...(year && year > 1900 && year < 2100 ? { year } : {}),
      kind,
    });
  }
  return items;
}

async function wikipediaDiscography(
  title: string
): Promise<{ url?: string; items: DiscographyItem[] }> {
  const pageUrl = `https://he.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  // Get sections
  const secUrl = `https://he.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
    title
  )}&prop=sections&format=json&origin=*`;
  try {
    const secRes = await fetch(secUrl, {
      headers: { "User-Agent": "IshimArchive/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!secRes.ok) return { items: [] };
    const secJson = (await secRes.json()) as {
      error?: unknown;
      parse?: { sections?: { index: string; line: string; number: string }[] };
    };
    if (secJson.error || !secJson.parse?.sections) return { items: [] };

    const disco = secJson.parse.sections.find((s) =>
      /דיסקוגרפ|אלבומ|קלטות|Discograph/i.test(s.line)
    );
    if (!disco) return { url: pageUrl, items: [] };

    const textUrl = `https://he.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
      title
    )}&prop=wikitext&section=${disco.index}&format=json&origin=*`;
    const textRes = await fetch(textUrl, {
      headers: { "User-Agent": "IshimArchive/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!textRes.ok) return { url: pageUrl, items: [] };
    const textJson = (await textRes.json()) as {
      parse?: { wikitext?: { "*": string } };
    };
    const wikitext = textJson.parse?.wikitext?.["*"] || "";
    const items = parseWikiDiscography(wikitext);
    return { url: pageUrl, items };
  } catch {
    return { items: [] };
  }
}

function parseWikiDiscography(wikitext: string): DiscographyItem[] {
  const items: DiscographyItem[] = [];
  const seen = new Set<string>();
  const lines = wikitext.split(/\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("<!--")) continue;
    // * ''Album'' (1999) or * [[Album]] (1999) or * 1999 - Album
    let title = "";
    let year: number | undefined;
    let kind = "אלבום";

    const yearFirst = line.match(
      /^[\*\•\-]\s*'?\[?\[?([^\]\|\n]{2,80}?)(?:\|[^\]]*)?\]?\]?'?\s*[\(\[]?\s*(19\d{2}|20\d{2})/
    );
    const yearParens = line.match(
      /^[\*\•\-]\s*(?:'''?)?(?:\[\[)?([^\]\|\(\n]{2,80}?)(?:\|[^\]]*)?(?:\]\])?(?:''')?\s*\((19\d{2}|20\d{2})/
    );
    const dashYear = line.match(
      /^[\*\•\-]\s*(19\d{2}|20\d{2})\s*[–\-:]\s*(?:'''?)?(?:\[\[)?([^\]\|\n]{2,80}?)(?:\|[^\]]*)?(?:\]\])?/
    );

    if (yearParens) {
      title = yearParens[1]!.trim();
      year = Number(yearParens[2]);
    } else if (yearFirst) {
      title = yearFirst[1]!.trim();
      year = Number(yearFirst[2]);
    } else if (dashYear) {
      year = Number(dashYear[1]);
      title = dashYear[2]!.trim();
    } else {
      continue;
    }

    title = title
      .replace(/'{2,}/g, "")
      .replace(/\[\[|\]\]/g, "")
      .replace(/^\d+\.\s*/, "")
      .trim();
    if (title.length < 2 || title.length > 120) continue;
    if (/^(שנת|אלבומי|סינגלים|קלטות|דיסקוגרפיה)/.test(title)) continue;

    if (/קלטת|cassette/i.test(line)) kind = "קלטת";
    else if (/סינגל|single/i.test(line)) kind = "סינגל";
    else if (/אוסף|compilation/i.test(line)) kind = "אוסף";

    const key = `${title}|${year || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ title, ...(year ? { year } : {}), kind });
  }
  return items.slice(0, 40);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeItems(a: DiscographyItem[], b: DiscographyItem[]): DiscographyItem[] {
  const map = new Map<string, DiscographyItem>();
  for (const item of [...a, ...b]) {
    const k = `${item.title.trim().toLowerCase()}|${item.year || ""}`;
    if (!map.has(k)) map.set(k, item);
  }
  return [...map.values()].sort((x, y) => (y.year || 0) - (x.year || 0));
}

async function main() {
  const out: Record<string, Entry> = {};
  let i = 0;
  let withItems = 0;

  for (const person of SEED.people) {
    i++;
    const labels = [
      person.name,
      person.nameOriginal,
      ...(person.nicknames || []),
    ].filter(Boolean) as string[];

    let items: DiscographyItem[] = [];
    let wikipediaUrl: string | undefined;

    // Wikidata albums
    for (const label of labels.slice(0, 3)) {
      const lang: "he" | "en" = /[a-zA-Z]/.test(label) ? "en" : "he";
      try {
        const found = await albumsForLabel(label, lang);
        items = mergeItems(items, found);
      } catch {
        /* continue */
      }
      await sleep(400);
      if (items.length >= 8) break;
    }

    // Hebrew Wikipedia discography section
    try {
      const wiki = await wikipediaDiscography(person.name);
      await sleep(250);
      if (wiki.url) wikipediaUrl = wiki.url;
      items = mergeItems(items, wiki.items);
    } catch {
      /* continue */
    }

    // Always store Wikipedia link attempt for Hebrew page
    if (!wikipediaUrl) {
      wikipediaUrl = `https://he.wikipedia.org/wiki/${encodeURIComponent(person.name)}`;
    }

    if (items.length > 0) {
      out[person.id] = { wikipediaUrl, items };
      withItems++;
      console.log(
        `[${i}/${SEED.people.length}] ✓ ${person.name}: ${items.length} items`
      );
    } else {
      // Keep wiki URL even without discography rows
      out[person.id] = { wikipediaUrl, items: [] };
      console.log(`[${i}/${SEED.people.length}] · ${person.name}: wiki only`);
    }
  }

  // Only persist entries that have items OR we want all wiki urls — keep those with items + wiki
  const cleaned: Record<string, Entry> = {};
  for (const [id, entry] of Object.entries(out)) {
    if (entry.items.length > 0 || entry.wikipediaUrl) {
      cleaned[id] = entry;
    }
  }

  fs.writeFileSync(
    path.join(__dirname, "discography.json"),
    JSON.stringify(cleaned, null, 2),
    "utf8"
  );

  const lines = Object.entries(cleaned)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, entry]) => {
      const items = entry.items
        .map((d) => {
          const parts = [`title: ${JSON.stringify(d.title)}`];
          if (d.year) parts.push(`year: ${d.year}`);
          if (d.kind) parts.push(`kind: ${JSON.stringify(d.kind)}`);
          return `{ ${parts.join(", ")} }`;
        })
        .join(", ");
      return `  ${JSON.stringify(id)}: {\n    wikipediaUrl: ${JSON.stringify(entry.wikipediaUrl)},\n    items: [${items}],\n  },`;
    })
    .join("\n");

  fs.writeFileSync(
    path.join(__dirname, "../src/lib/seed-discography.ts"),
    `import type { PersonDiscographyEntry } from "./person-dates";\n\n/** Auto-generated discography from Wikidata + Hebrew Wikipedia */\nexport const PERSON_DISCOGRAPHY: Record<string, PersonDiscographyEntry> = {\n${lines}\n};\n`,
    "utf8"
  );

  // Fix circular import — export type from types instead
  fs.writeFileSync(
    path.join(__dirname, "../src/lib/seed-discography.ts"),
    `import type { DiscographyItem } from "./types";\n\nexport type PersonDiscographyEntry = {\n  wikipediaUrl?: string;\n  items: DiscographyItem[];\n};\n\n/** Auto-generated discography from Wikidata + Hebrew Wikipedia */\nexport const PERSON_DISCOGRAPHY: Record<string, PersonDiscographyEntry> = {\n${lines}\n};\n`,
    "utf8"
  );

  console.log(
    `Done. people with discography items: ${withItems}/${SEED.people.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
