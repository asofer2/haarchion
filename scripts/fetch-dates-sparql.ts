/**
 * Fetch birth/death for all SEED people via Wikidata SPARQL (by Hebrew/English label).
 * Run: npx tsx scripts/fetch-dates-sparql.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";

type Dates = { birthDate?: string; deathDate?: string };

async function sparqlByLabel(
  label: string,
  lang: "he" | "en"
): Promise<Dates | null> {
  const q = `SELECT ?birth ?death WHERE {
    ?item rdfs:label "${label.replace(/"/g, '\\"')}"@${lang}.
    ?item wdt:P31 wd:Q5.
    OPTIONAL { ?item wdt:P569 ?birth. }
    OPTIONAL { ?item wdt:P570 ?death. }
  } LIMIT 5`;
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(q);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "IshimArchive/1.0 (educational; dates)",
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      results: {
        bindings: {
          birth?: { value: string };
          death?: { value: string };
        }[];
      };
    };
    // Prefer binding that has a birth date
    const best =
      j.results.bindings.find((b) => b.birth?.value) || j.results.bindings[0];
    if (!best) return null;
    const birthDate = best.birth?.value?.slice(0, 10);
    const deathDate = best.death?.value?.slice(0, 10);
    if (!birthDate && !deathDate) return null;
    return {
      ...(birthDate ? { birthDate } : {}),
      ...(deathDate ? { deathDate } : {}),
    };
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const out: Record<string, Dates> = {};
  let i = 0;
  for (const person of SEED.people) {
    i++;
    const labels = [
      person.name,
      person.nameOriginal,
      ...(person.nicknames || []),
    ].filter(Boolean) as string[];

    let dates: Dates | null = null;
    for (const label of labels) {
      const lang: "he" | "en" = /[a-zA-Z]/.test(label) ? "en" : "he";
      dates = await sparqlByLabel(label, lang);
      await sleep(350);
      if (dates) break;
    }

    if (dates) {
      out[person.id] = dates;
      // mirror -w2 / without -w2
      if (person.id.endsWith("-w2")) {
        out[person.id.replace(/-w2$/i, "")] = dates;
      } else {
        out[`${person.id}-w2`] = dates;
      }
      console.log(
        `[${i}/${SEED.people.length}] ✓ ${person.name}: ${dates.birthDate || "—"} / ${dates.deathDate || "—"}`
      );
    } else {
      console.log(`[${i}/${SEED.people.length}] ✗ ${person.name}`);
    }
  }

  // Keep only real ids that exist in SEED (plus duplicates ok)
  const cleaned: Record<string, Dates> = {};
  for (const p of SEED.people) {
    if (out[p.id]) cleaned[p.id] = out[p.id]!;
  }

  fs.writeFileSync(
    path.join(__dirname, "wikidata-dates.json"),
    JSON.stringify(cleaned, null, 2),
    "utf8"
  );

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
    `/** Auto-generated from Wikidata SPARQL — scripts/fetch-dates-sparql.ts */
export const PERSON_DATES: Record<
  string,
  { birthDate?: string; deathDate?: string }
> = {
${lines}
};
`,
    "utf8"
  );

  console.log(
    `Done. with dates: ${Object.keys(cleaned).length}/${SEED.people.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
