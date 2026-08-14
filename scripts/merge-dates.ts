import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";

type Dates = { birthDate?: string; deathDate?: string };

const sparql: Record<string, Dates> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "wikidata-dates.json"), "utf8")
);

// Extra curated / previous Wikidata hits for people SPARQL missed
const EXTRA: Record<string, Dates> = {
  "hadar-shahaf-maayan": { birthDate: "1976-08-31" },
  "gilad-kelter": { birthDate: "1976-04-02" },
  "gilad-kelter-w2": { birthDate: "1976-04-02" },
  "liron-lev": { birthDate: "1982-12-05" },
  "michal-haiktanit": { birthDate: "1982-11-09" },
  "michal-haqtana": { birthDate: "1982-11-09" },
  "ht-nvryt-bnay-kvrn": { birthDate: "1964-06-08" },
  "ht-lylyan-brtv": { birthDate: "1966-11-06" },
  "yael-abecassis": { birthDate: "1967-07-19" },
  "lior-ashkenazi": { birthDate: "1969-12-28" },
  "zipi-shavit": { birthDate: "1947-04-01" },
  "tuvia-tsafir": { birthDate: "1945-12-31" },
  // English-label alternates often missing for dubbers — leave empty if unknown
};

const merged: Record<string, Dates> = { ...EXTRA, ...sparql };

// Prefer more complete sparql, but fill gaps from EXTRA
for (const [id, d] of Object.entries(EXTRA)) {
  const cur = merged[id] || {};
  merged[id] = {
    birthDate: cur.birthDate || d.birthDate,
    deathDate: cur.deathDate || d.deathDate,
  };
}

const cleaned: Record<string, Dates> = {};
for (const p of SEED.people) {
  const d = merged[p.id];
  if (!d) continue;
  const out: Dates = {};
  if (d.birthDate) out.birthDate = d.birthDate;
  if (d.deathDate) out.deathDate = d.deathDate;
  if (out.birthDate || out.deathDate) cleaned[p.id] = out;
}

const lines = Object.entries(cleaned)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, d]) => {
    const parts = [
      d.birthDate ? `birthDate: "${d.birthDate}"` : null,
      d.deathDate ? `deathDate: "${d.deathDate}"` : null,
    ].filter(Boolean);
    return `  "${id}": { ${parts.join(", ")} },`;
  })
  .join("\n");

fs.writeFileSync(
  path.join(__dirname, "../src/lib/seed-dates.ts"),
  `/** Birth/death dates from Wikidata SPARQL (+ curated fills) */
export const PERSON_DATES: Record<
  string,
  { birthDate?: string; deathDate?: string }
> = {
${lines}
};
`,
  "utf8"
);

fs.writeFileSync(
  path.join(__dirname, "wikidata-dates.json"),
  JSON.stringify(cleaned, null, 2),
  "utf8"
);

console.log("final", Object.keys(cleaned).length);
