/** Quick coverage audit after enrichment */
import { SEED } from "../src/lib/seed";
import { applyPeopleEnrichment } from "../src/lib/person-dates";

const people = applyPeopleEnrichment(SEED.people);
const htIds = [
  "ht-chnh-drvry-kshy",
  "ht-chsyh-vrthyym",
  "ht-rvty-hvltzmn",
  "ht-avrnh-lbya-plynt",
  "ht-chny-nchmyas",
  "ht-knrt-trypvn-rshp",
  "ht-pzyt-nvny",
  "ht-tmy-ashl",
  "ht-nvryt-bnay-kvrn",
  "ht-lylyan-brtv",
  "ht-apy-bn-yshral",
  "ht-shmavn-khn",
  "ht-aly-gvrnshtyyn",
  "ht-avdd-mnshh",
  "ht-shchr-tzrpty",
  "ht-shmvlyk-yprch",
  "ht-yvrm-gl",
  "ht-rvny-vyys",
  "ht-lah-navr",
];

const thin = (b?: string) =>
  !b ||
  b.length < 60 ||
  /ארכיון ערוץ הופ|לפי קטגוריית מדבבים|מדבב\/ת ועורך/.test(b);

console.log("total", people.length);
console.log("withBirth", people.filter((p) => p.birthDate).length);
console.log("withDeath", people.filter((p) => p.deathDate).length);
console.log("withWikiUrl", people.filter((p) => p.wikipediaUrl).length);
console.log("thinBio", people.filter((p) => thin(p.bio)).length);
console.log("missBirth", people.filter((p) => !p.birthDate).length);
console.log("--- HT ---");
for (const id of htIds) {
  const p = people.find((x) => x.id === id);
  if (!p) {
    console.log("MISSING", id);
    continue;
  }
  console.log(
    `${id} birth=${p.birthDate || "—"} thin=${thin(p.bio)} bio=${(p.bio || "").slice(0, 50)}`
  );
}
