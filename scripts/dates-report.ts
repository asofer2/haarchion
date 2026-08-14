import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";
import fs from "fs";

const report = {
  withDates: SEED.people.filter((p) => p.birthDate || p.deathDate).map((p) => ({
    id: p.id,
    name: p.name,
    birthDate: p.birthDate,
    deathDate: p.deathDate,
  })),
  withoutDates: SEED.people
    .filter((p) => !p.birthDate && !p.deathDate)
    .map((p) => ({ id: p.id, name: p.name, also: p.nameOriginal })),
  orphanKeys: Object.keys(PERSON_DATES).filter(
    (id) => !SEED.people.some((p) => p.id === id)
  ),
};

fs.writeFileSync(
  "scripts/dates-report.json",
  JSON.stringify(
    {
      withDates: report.withDates.length,
      withoutDates: report.withoutDates.length,
      orphanKeys: report.orphanKeys,
      missing: report.withoutDates,
      sampleWith: report.withDates.slice(0, 20),
    },
    null,
    2
  ),
  "utf8"
);
console.log(
  "with",
  report.withDates.length,
  "without",
  report.withoutDates.length,
  "orphans",
  report.orphanKeys.length
);
