import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";

const rows = SEED.people.map((p) => {
  const dates = PERSON_DATES[p.id] || {};
  const birth = p.birthDate || dates.birthDate;
  const death = p.deathDate || dates.deathDate;
  return {
    id: p.id,
    name: p.name,
    nameOriginal: p.nameOriginal || "",
    birth: birth || "",
    death: death || "",
    bioLen: (p.bio || "").length,
    thinBio: !p.bio || p.bio.length < 60 || /ארכיון ערוץ הופ|לפי קטגוריית מדבבים/.test(p.bio),
    isHt: p.id.startsWith("ht-"),
    missingBirth: !birth,
  };
});

const missing = rows.filter((r) => r.missingBirth);
const ht = rows.filter((r) => r.isHt);
const thin = rows.filter((r) => r.thinBio);

const report = {
  total: rows.length,
  withBirth: rows.length - missing.length,
  missingBirth: missing.length,
  htTotal: ht.length,
  htMissingBirth: ht.filter((r) => r.missingBirth).length,
  thinBio: thin.length,
  missing: missing.map((r) => `${r.id}|${r.name}|${r.nameOriginal}`),
  htMissing: ht.filter((r) => r.missingBirth).map((r) => `${r.id}|${r.name}`),
  thinSample: thin.slice(0, 40).map((r) => `${r.id}|${r.name}|bio=${r.bioLen}`),
};

fs.writeFileSync(
  path.join(__dirname, "enrich-audit.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);
console.log(JSON.stringify({
  total: report.total,
  withBirth: report.withBirth,
  missingBirth: report.missingBirth,
  htTotal: report.htTotal,
  htMissingBirth: report.htMissingBirth,
  thinBio: report.thinBio,
}, null, 2));
