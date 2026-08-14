/**
 * Sanity checks for the אישים archive seed.
 * Run: npx tsx scripts/verify-archive.ts
 */
import { SEED } from "../src/lib/seed";
import { normalizePersonName } from "../src/lib/dedupe";
import { ACTIVITY_LABELS } from "../src/lib/types";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed++;
  } else {
    console.log("OK:", msg);
  }
}

const names = new Map<string, string>();
for (const p of SEED.people) {
  const key = normalizePersonName(p.name);
  if (names.has(key)) {
    assert(false, `duplicate name "${p.name}" (${names.get(key)} vs ${p.id})`);
  } else {
    names.set(key, p.id);
  }
  const acts = p.activities || [];
  assert(
    acts.length === new Set(acts).size,
    `unique activities for ${p.name}`
  );
}

assert(SEED.people.length > 80, `people count ${SEED.people.length} > 80`);
assert(SEED.productions.length > 40, `productions count ${SEED.productions.length} > 40`);
assert(SEED.credits.length > 100, `credits count ${SEED.credits.length} > 100`);

let emptyFilmography = 0;
for (const person of SEED.people) {
  const credits = SEED.credits.filter((c) => c.personId === person.id);
  if ((person.activities || []).length > 0 && credits.length === 0) {
    emptyFilmography++;
    console.error("FAIL: no credits for", person.id, person.name, person.activities);
  }
}
assert(emptyFilmography === 0, `all people with activities have credits (empty=${emptyFilmography})`);

// Spot-check gilad
const gilad = SEED.people.find((p) => p.id === "gilad-malek" || p.name.includes("גלעד"));
assert(Boolean(gilad), "gilad exists");
if (gilad) {
  const gCredits = SEED.credits.filter((c) => c.personId === gilad.id);
  assert(gCredits.length > 0, `gilad has ${gCredits.length} credits`);
}

console.log("\n--- summary ---");
console.log("people:", SEED.people.length);
console.log("productions:", SEED.productions.length);
console.log("credits:", SEED.credits.length);
console.log(
  "activities covered:",
  Object.keys(ACTIVITY_LABELS).join(", ")
);

if (failed > 0) {
  console.error(`\n${failed} checks failed`);
  process.exit(1);
}
console.log("\nAll checks passed");
