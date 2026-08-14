import fs from "fs";
import { SEED } from "../src/lib/seed";

const kinds = new Set([
  "series",
  "miniseries",
  "tv_series",
  "series_israeli_foreign_dubbed",
  "tv_program",
]);

const lines: string[] = [];
for (const p of SEED.productions.filter((x) => kinds.has(x.kind) && !x.id.startsWith("ht-"))) {
  const cs = SEED.credits.filter((c) => c.productionId === p.id);
  const named = cs.filter((c) => c.characterName);
  const unnamed = cs.filter(
    (c) =>
      !c.characterName &&
      (c.role === "actor" || c.role === "dubber" || c.role === "host")
  );
  lines.push(
    `${named.length}/${cs.length}\t${p.id}\t${p.title}\tunnamedCast=${unnamed.length}`
  );
  for (const c of unnamed) {
    const person = SEED.people.find((x) => x.id === c.personId);
    lines.push(`  - ${c.role} ${person?.name || c.personId}`);
  }
}
fs.writeFileSync("scripts/_unnamed.txt", lines.join("\n"), "utf8");
console.log(lines.join("\n"));
