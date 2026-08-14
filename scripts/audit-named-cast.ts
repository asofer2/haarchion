import fs from "fs";
import { SEED } from "../src/lib/seed";

const seriesKinds = new Set([
  "series",
  "miniseries",
  "tv_series",
  "series_israeli_foreign_dubbed",
  "tv_program",
]);

const castRoles = new Set(["actor", "dubber", "host", "dub_director"]);

type Row = {
  id: string;
  title: string;
  year?: number;
  credits: number;
  named: number;
  cast: number;
  namedCast: number;
  sample: string[];
};

const byProd = new Map<string, typeof SEED.credits>();
for (const c of SEED.credits) {
  const list = byProd.get(c.productionId) || [];
  list.push(c);
  byProd.set(c.productionId, list);
}

const people = new Map(SEED.people.map((p) => [p.id, p.name]));

const list: Row[] = SEED.productions
  .filter((p) => seriesKinds.has(p.kind))
  .map((p) => {
    const credits = byProd.get(p.id) || [];
    const cast = credits.filter((c) => castRoles.has(c.role));
    const namedCast = cast.filter((c) => c.characterName);
    return {
      id: p.id,
      title: p.title,
      year: p.year,
      credits: credits.length,
      named: credits.filter((c) => c.characterName).length,
      cast: cast.length,
      namedCast: namedCast.length,
      sample: namedCast.slice(0, 5).map((c) => {
        const n = people.get(c.personId) || c.personId;
        return `${n}=${c.characterName}`;
      }),
    };
  })
  .sort((a, b) => a.namedCast - b.namedCast || a.title.localeCompare(b.title, "he"));

const none = list.filter((x) => x.namedCast === 0);
const some = list.filter((x) => x.namedCast > 0 && x.namedCast < 5);
const rich = list.filter((x) => x.namedCast >= 5);

fs.writeFileSync(
  "scripts/named-cast-audit.json",
  JSON.stringify({ summary: { total: list.length, none: none.length, some: some.length, rich: rich.length }, list }, null, 2)
);

console.log(JSON.stringify({ total: list.length, none: none.length, some: some.length, rich: rich.length }, null, 2));
console.log("\n--- RICH ---");
for (const x of rich.sort((a, b) => b.namedCast - a.namedCast)) {
  console.log(`${x.namedCast}\t${x.id}\t${x.title}`);
}
console.log("\n--- SOME ---");
for (const x of some) console.log(`${x.namedCast}\t${x.id}\t${x.title}`);
console.log("\n--- NONE (non-ht first 40) ---");
for (const x of none.filter((n) => !n.id.startsWith("ht-")).slice(0, 40)) {
  console.log(`${x.cast}\t${x.id}\t${x.title}`);
}
console.log("\n--- NONE ht count ---", none.filter((n) => n.id.startsWith("ht-")).length);
