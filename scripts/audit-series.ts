import fs from "fs";
import { SEED } from "../src/lib/seed";

const seriesKinds = new Set([
  "series",
  "miniseries",
  "tv_series",
  "series_israeli_foreign_dubbed",
  "tv_program",
]);

const creditsByProd = new Map<string, typeof SEED.credits>();
for (const c of SEED.credits) {
  const list = creditsByProd.get(c.productionId) || [];
  list.push(c);
  creditsByProd.set(c.productionId, list);
}

const list = SEED.productions
  .filter((p) => seriesKinds.has(p.kind))
  .map((p) => {
    const credits = creditsByProd.get(p.id) || [];
    return {
      id: p.id,
      title: p.title,
      year: p.year,
      kind: p.kind,
      credits: credits.length,
      named: credits.filter((c) => c.characterName).length,
    };
  })
  .sort(
    (a, b) => a.credits - b.credits || a.title.localeCompare(b.title, "he")
  );

fs.writeFileSync("scripts/series-audit.json", JSON.stringify(list, null, 2));
console.log("series count", list.length);
console.log("with 0 credits", list.filter((x) => x.credits === 0).length);
console.log("with <3 credits", list.filter((x) => x.credits < 3).length);
for (const x of list.filter((x) => x.credits < 5).slice(0, 50)) {
  console.log(`${x.credits}\t${x.id}\t${x.title}`);
}
