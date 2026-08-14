/**
 * SPARQL pass for remaining missing people using cleaned labels (strip parentheses).
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";

type Dates = { birthDate?: string; deathDate?: string };

const CURATED: Record<string, Dates> = {
  "yuval-hamevulbal": { birthDate: "1972-07-23" },
  "shira-haas": { birthDate: "1995-05-11" },
  "avi-grinik": { birthDate: "1971-11-22" },
  "gvry-alpy": { birthDate: "1976-09-18" },
  "dnh-smv": { birthDate: "1977-09-25" },
};

function cleanLabel(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function toIso(v?: string): string | undefined {
  if (!v) return undefined;
  const m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const y = Number(m[1]);
  if (y < 1000 || y > 2100) return undefined;
  let mm = m[2] === "00" ? "01" : m[2]!;
  let dd = m[3] === "00" ? "01" : m[3]!;
  return `${m[1]}-${mm}-${dd}`;
}

async function sparqlBatch(labels: string[]): Promise<Map<string, Dates>> {
  const out = new Map<string, Dates>();
  if (!labels.length) return out;
  const values = labels
    .map((l) => `"${l.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"@he`)
    .join(" ");
  const query = `SELECT ?label ?birth ?death WHERE {
    VALUES ?label { ${values} }
    ?item rdfs:label ?label .
    ?item wdt:P31 wd:Q5 .
    OPTIONAL { ?item wdt:P569 ?birth . }
    OPTIONAL { ?item wdt:P570 ?death . }
  }`;
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "IshimArchive/1.0 (educational)",
    },
  });
  if (!res.ok) {
    console.log("SPARQL status", res.status);
    return out;
  }
  const j = await res.json();
  for (const b of j.results?.bindings || []) {
    const label = b.label?.value as string;
    const birthDate = toIso(b.birth?.value);
    const deathDate = toIso(b.death?.value);
    if (!label || (!birthDate && !deathDate)) continue;
    const prev = out.get(label);
    // Prefer more specific dates over Jan 1
    if (
      !prev?.birthDate ||
      (prev.birthDate.endsWith("-01-01") && birthDate && !birthDate.endsWith("-01-01"))
    ) {
      out.set(label, {
        ...(birthDate ? { birthDate } : {}),
        ...(deathDate ? { deathDate } : prev?.deathDate ? { deathDate: prev.deathDate } : {}),
      });
    }
  }
  return out;
}

function formatSeedDates(map: Record<string, Dates>): string {
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

async function main() {
  const merged: Record<string, Dates> = { ...PERSON_DATES, ...CURATED };

  const missing = SEED.people.filter((p) => !(p.birthDate || merged[p.id]?.birthDate));
  console.log("Missing before:", missing.length);

  const labelToIds = new Map<string, string[]>();
  for (const p of missing) {
    for (const label of [...new Set([cleanLabel(p.name), p.name])]) {
      if (!label) continue;
      const list = labelToIds.get(label) || [];
      list.push(p.id);
      labelToIds.set(label, list);
    }
  }

  const allLabels = [...labelToIds.keys()];
  for (let i = 0; i < allLabels.length; i += 30) {
    const chunk = allLabels.slice(i, i + 30);
    console.log(`SPARQL chunk ${i / 30 + 1}…`);
    const hits = await sparqlBatch(chunk);
    for (const [label, dates] of hits) {
      for (const id of labelToIds.get(label) || []) {
        if (!merged[id]?.birthDate && dates.birthDate) {
          merged[id] = { ...merged[id], ...dates };
          console.log(`✓ ${id} (${label}): ${dates.birthDate}`);
        }
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  fs.writeFileSync(
    path.join(__dirname, "../src/lib/seed-dates.ts"),
    formatSeedDates(merged),
    "utf8"
  );

  const still = SEED.people.filter((p) => !(p.birthDate || merged[p.id]?.birthDate));
  console.log("Still missing:", still.length);
  console.log(still.map((p) => p.name).join(", "));
  console.log("PERSON_DATES:", Object.keys(merged).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
