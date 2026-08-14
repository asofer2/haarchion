import { SEED } from "../src/lib/seed";
import fs from "fs";

const rows = SEED.people.map((p) => ({
  id: p.id,
  name: p.name,
  also: p.nameOriginal || "",
  birthDate: p.birthDate || "",
  deathDate: p.deathDate || "",
}));

fs.writeFileSync(
  "scripts/people-dates-status.json",
  JSON.stringify(
    {
      total: rows.length,
      withBirth: rows.filter((r) => r.birthDate).length,
      withDeath: rows.filter((r) => r.deathDate).length,
      people: rows,
    },
    null,
    2
  ),
  "utf8"
);
console.log(
  "total",
  rows.length,
  "birth",
  rows.filter((r) => r.birthDate).length,
  "death",
  rows.filter((r) => r.deathDate).length
);
