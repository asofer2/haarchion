import { SEED } from "../src/lib/seed";
import { PERSON_DATES } from "../src/lib/seed-dates";

const names = [
  "שלמה בר שביט",
  "אברהם מור",
  "נורית כהן",
  "אריאל פורמן",
  "רחל אטאס",
  "דבי בסרגליק",
  "רמה מסינגר",
  "יוני חן",
  "יהודה אפרוני",
  "יובל זמיר",
  "ספי ריבלין",
  "דודיק סמדר",
  "חיים טופול",
  "עדי לב",
  "עמוס שוב",
  "גאולה נוני",
  "ראובן שפר",
  "יוסי ידין",
  "שרון בורגאוקר",
  "גדעון שמר",
  "אמנון מסקין",
  "יוסי גרבר",
  "רוזינה קמבוס",
  "דידי גת",
  "דן תורן",
  "עזרא הס",
  "נחמה הנדל",
  "גלעד ויטל",
  "רות פרחי",
  "אורי לוי",
  "אריה מוסקונה",
];

function norm(s: string) {
  return s
    .replace(/['׳״"]/g, "")
    .replace(/־/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

for (const n of names) {
  const nn = norm(n);
  const hits = SEED.people.filter((p) => {
    const pn = norm(p.name);
    if (pn === nn || pn.includes(nn) || nn.includes(pn)) return true;
    return (p.nicknames || []).some((k) => {
      const kn = norm(k);
      return kn === nn || kn.includes(nn) || nn.includes(kn);
    });
  });
  if (!hits.length) {
    console.log(`MISSING|${n}`);
    continue;
  }
  for (const p of hits) {
    const d = PERSON_DATES[p.id] || {};
    console.log(
      [
        "FOUND",
        n,
        p.id,
        p.birthDate || d.birthDate || "-",
        p.deathDate || d.deathDate || "-",
        (p.bio || "").slice(0, 50).replace(/\|/g, "/"),
      ].join("|")
    );
  }
}
console.log("total", SEED.people.length);
