import { SEED } from "../src/lib/seed";
import { applyPeopleEnrichment } from "../src/lib/person-dates";

const people = applyPeopleEnrichment(SEED.people);
const hop = /ארכיון ערוץ הופ/;
const wikiCat = /לפי קטגוריית מדבבים/;
const stub = /מדבב\/ת ועורך/;

const samples = people.slice(0, 6).map((p) => ({
  id: p.id,
  len: (p.bio || "").length,
  bio: (p.bio || "").slice(0, 90),
  birth: p.birthDate,
  wiki: !!p.wikipediaUrl,
}));
console.log(JSON.stringify(samples, null, 2));

const lens = people.map((p) => (p.bio || "").length).sort((a, b) => a - b);
console.log(
  "bio len p50",
  lens[Math.floor(lens.length / 2)],
  "p90",
  lens[Math.floor(lens.length * 0.9)]
);

const goodBio = people.filter(
  (p) => p.bio && p.bio.length >= 80 && !hop.test(p.bio) && !wikiCat.test(p.bio) && !stub.test(p.bio)
).length;
const thinHop = people.filter((p) => hop.test(p.bio || "") || stub.test(p.bio || "")).length;
const thinWiki = people.filter((p) => wikiCat.test(p.bio || "")).length;
const shortBio = people.filter((p) => !p.bio || p.bio.length < 60).length;

console.log({
  total: people.length,
  withBirth: people.filter((p) => p.birthDate).length,
  withWiki: people.filter((p) => p.wikipediaUrl).length,
  goodBio,
  thinHop,
  thinWiki,
  shortBio,
  htPeople: people.filter((p) => p.id.startsWith("ht-")).length,
  htMissBirth: people.filter((p) => p.id.startsWith("ht-") && !p.birthDate).map((p) => p.id),
});
