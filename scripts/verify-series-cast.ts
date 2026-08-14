import { SEED } from "../src/lib/seed";

const MAIN = [
  "shtisel",
  "fauda",
  "ha-hamama",
  "parpar-nechmad",
  "sesame-israel",
  "itcha",
  "hopa-hey",
  "rega-im-dudley",
  "sefi-tv",
  "the-smurfs-he",
  "care-bears-he",
  "paw-patrol-he",
  "spongebob-he",
  "pokemon-he",
  "bluey-he",
];

const people = new Set(SEED.people.map((p) => p.id));
const missingPeople = SEED.credits
  .filter((c) => !people.has(c.personId))
  .map((c) => `${c.personId}@${c.productionId}`);

console.log("Missing person ids:", [...new Set(missingPeople)].slice(0, 30));
console.log("Missing count:", new Set(missingPeople).size);

for (const id of MAIN) {
  const credits = SEED.credits.filter((c) => c.productionId === id);
  const named = credits.filter((c) => c.characterName);
  const actors = [...new Set(credits.map((c) => c.personId))];
  console.log(
    `${id}: credits=${credits.length} named=${named.length} people=${actors.length}`
  );
}

// Detect wrong legacy links
for (const bad of [
  { p: "lior-ashkenazi", prod: "fauda" },
  { p: "yael-abeccassis", prod: "shtisel" },
  { p: "hana-maron", prod: "shtisel" },
  { p: "maya-dagan", prod: "ha-hamama" },
]) {
  const hit = SEED.credits.find((c) => c.personId === bad.p && c.productionId === bad.prod);
  console.log(`legacy ${bad.p}@${bad.prod}:`, hit ? "STILL PRESENT" : "removed");
}
