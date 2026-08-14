/**
 * Generate seed-hop-tamir.ts from extracted Hop Tamir sidebar titles.
 * Run: node scripts/generate-hop-tamir-seed.js
 */
const fs = require("fs");
const path = require("path");

const prodsRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, "hoptamir-prods.json"), "utf8")
);
const peopleRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, "hoptamir-people.json"), "utf8")
);

function slugify(he) {
  const map = {
    א: "a", ב: "b", ג: "g", ד: "d", ה: "h", ו: "v", ז: "z", ח: "ch", ט: "t",
    י: "y", כ: "k", ך: "k", ל: "l", מ: "m", ם: "m", נ: "n", ן: "n", ס: "s",
    ע: "a", פ: "p", ף: "p", צ: "tz", ץ: "tz", ק: "k", ר: "r", ש: "sh", ת: "t",
  };
  return he
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .split("")
    .map((c) => map[c] || c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "item";
}

function parseTitle(raw) {
  let t = String(raw)
    .replace(/\s*אישים\s*$/g, "")
    .replace(/\(2026 אישים/g, "(2026)")
    .replace(/\(\s*-(\d{4})/g, "($1")
    .replace(/\s+/g, " ")
    .trim();
  // fix missing closing paren
  if (/\(\d{4}$/.test(t)) t += ")";
  const m = t.match(/^(.*?)\s*\((\d{4})(?:-(\d{4}))?\)\s*$/);
  if (!m) return null;
  const title = m[1].replace(/^["']|["']$/g, "").trim();
  if (!title || title.length < 2) return null;
  const year = Number(m[2]);
  const endYear = m[3] ? Number(m[3]) : undefined;
  // skip obvious junk / person-only pages misparsed
  if (/^(עפרון|תמיר סופר)$/.test(title)) return null;
  return { title, year, endYear };
}

const seen = new Set();
const productions = [];
for (const raw of prodsRaw) {
  const parsed = parseTitle(raw);
  if (!parsed) continue;
  const key = parsed.title;
  if (seen.has(key)) continue;
  seen.add(key);
  productions.push(parsed);
}

// Cap to keep seed manageable but comprehensive (~180 unique shows)
const MAX = 180;
const selected = productions.slice(0, MAX);

const peopleSkip = new Set(["פיטר פן", "עפרון אטקין"]);
const people = peopleRaw.filter((n) => !peopleSkip.has(n) && n.length >= 3);

// Known English aliases for better portraits
const alsoMap = {
  "חנה דרורי קשי": "Hanna Drori Kashi",
  "אורנה לביא פלינט": "Orna Lavi Flint",
  "חני נחמיאס": "Hani Nahmias",
  "נורית בנאי קורן": "Nurit Banai Koren",
  "אפי בן ישראל": "Efi Ben Israel",
  "שמעון כהן": "Shimon Cohen",
  "אלי גורנשטיין": "Eli Gorenstein",
  "עודד מנשה": "Oded Menashe",
  "שמוליק יפרח": "Shmulik Yifrah",
  "לאה נאור": "Leah Naor",
  "חסיה ורטהיים": "Hasia Wertheim",
  "רותי הולצמן": "Ruti Holtzman",
  "ליליאן ברטו": "Lilian Barreto",
  "כנרת טריפון רשף": "Kinneret Trifon Reshef",
};

const now = "2026-07-24T12:00:00.000Z";

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

let out = `import type { Credit, Person, Production } from "./types";
import { portrait } from "./portrait";

/** Seed batch from https://sites.google.com/view/hoptamir (ערוץ הופ תמיר) */
const now = "${now}";

function p(
  id: string,
  name: string,
  bio: string,
  also?: string,
  nicknames: string[] = []
): Person {
  return {
    id,
    name,
    nicknames,
    tags: ["דיבוב", "הופ תמיר"],
    activities: ["dubbing", "series", "film"],
    bio,
    nameOriginal: also,
    imageUrl: portrait(name, also),
    createdAt: now,
    updatedAt: now,
  };
}

function prod(
  id: string,
  title: string,
  year: number,
  summary: string,
  extra: Partial<Production> = {}
): Production {
  return {
    id,
    title,
    year,
    kind: extra.kind || "series",
    summary,
    genres: extra.genres || ["אנימציה", "ילדים", "דיבוב"],
    originalTitle: extra.originalTitle,
    endYear: extra.endYear,
    channel: extra.channel || "הופ תמיר",
    studio: extra.studio,
    imageUrl: extra.imageUrl || portrait(title),
    createdAt: now,
    updatedAt: now,
  };
}

export const HOP_TAMIR_PEOPLE: Person[] = [
`;

for (const name of people) {
  const id = "ht-" + slugify(name);
  const also = alsoMap[name];
  const bio = `מדבב/ת ועורך/ת מדיה — ערך מתוך ארכיון ערוץ הופ תמיר.`;
  out += `  p("${id}", "${esc(name)}", "${esc(bio)}"${also ? `, "${esc(also)}"` : ""}),\n`;
}

// Add a few extras mentioned on the Peter Pan page with roles
const extras = [
  ["ht-pazit-noni", "פזית נוני", "מדבבת ישראלית — ארכיון הופ תמיר.", "Pazit Noni"],
  ["ht-tami-eshel", "תמי אשל", "מדבבת ישראלית — ארכיון הופ תמיר.", "Tami Eshel"],
  ["ht-shachar-tzarfati", "שחר צרפתי", "מדבב ישראלי — ארכיון הופ תמיר.", "Shachar Tzarfati"],
  ["ht-yoram-gal", "יורם גל", "מדבב ושחקן — ארכיון הופ תמיר.", "Yoram Gal"],
  ["ht-roni-weiss", "רוני וייס", "מוזיקאי / ניהול מוזיקלי — ארכיון הופ תמיר.", "Roni Weiss"],
];
for (const [id, name, bio, also] of extras) {
  if (people.includes(name)) continue;
  out += `  p("${id}", "${esc(name)}", "${esc(bio)}", "${esc(also)}"),\n`;
}

out += `];

export const HOP_TAMIR_PRODUCTIONS: Production[] = [
  // Featured with rich metadata from the site homepage
  prod(
    "ht-peter-pan-adventures",
    "פיטר פן",
    1990,
    "פיטר פן, הילד הנצחי, לוקח את ילדי משפחת דארלינג להרפתקה קסומה בארץ לעולם־לא. סדרת אנימציה יפנית מדובבת (39 פרקים, כ־24 דקות). ערך מתוך ערוץ הופ תמיר.",
    {
      originalTitle: "The Adventures of Peter Pan / ピーターパンの冒険",
      endYear: 1991,
      channel: "חינוכית / הופ תמיר",
      genres: ["אנימציה", "ילדים", "דיבוב", "מדובב - זר"],
      imageUrl: portrait("פיטר פן", "The Adventures of Peter Pan"),
    }
  ),
`;

for (const p of selected) {
  if (p.title === "פיטר פן") continue;
  const id = "ht-" + slugify(p.title);
  const end = p.endYear ? `, endYear: ${p.endYear}` : "";
  const summary = `הפקה מארכיון ערוץ הופ תמיר (${p.year}${p.endYear ? "–" + p.endYear : ""}).`;
  // guess film vs series
  const kind =
    /סרט|הסרט|: /.test(p.title) || (!p.endYear && p.year >= 2015 && /2|3|4|5/.test(p.title))
      ? "film"
      : "series";
  out += `  prod("${id}", "${esc(p.title)}", ${p.year}, "${esc(summary)}", { kind: "${kind}"${end} }),\n`;
}

out += `];

/** Detailed credits for פיטר פן from hop tamir page */
export const HOP_TAMIR_CREDITS: Credit[] = [
  { personId: "ht-chana-drori-kashi", productionId: "ht-peter-pan-adventures", role: "dub_director", characterName: "בימוי דיבוב" },
  { personId: "ht-orna-lavi-flint", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "טינקרבל" },
  { personId: "ht-kinneret-trifon-reshef", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "ג'ון דרלינג" },
  { personId: "ht-nurit-banai-koren", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "דמויות שונות" },
  { personId: "ht-lilian-brto", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "ליליאן ברטובולי / לונה / פנדורה" },
  { personId: "efi-ben-israel", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "לילי נמר / אליזבת דרלינג / בתולת ים" },
  { personId: "ht-efi-ben-israel", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "לילי נמר (ארכיון הופ תמיר)" },
  { personId: "ht-shimon-cohen", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "קפטן הוק" },
  { personId: "ht-eli-gorenshtein", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "סמי / דון בלבוש" },
  { personId: "ht-oded-menashe", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "ביל / משרת של פנדורה" },
  { personId: "ht-shachar-tzarfati", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "אלף / משרת של פנדורה" },
  { personId: "ht-shmulik-yifrach", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "שארקי / רובר / ג'ורג' דארלינג" },
  { personId: "ht-yoram-gal", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "שארקי / רובר / צ'יקו" },
  { personId: "ht-chana-drori-kashi", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "מלכת הפיות [אורחת]" },
  { personId: "ht-roni-weiss", productionId: "ht-peter-pan-adventures", role: "composer", characterName: "ניהול מוזיקלי — שיר פתיחה וסיום" },
  { personId: "ht-lea-naor", productionId: "ht-peter-pan-adventures", role: "writer", characterName: "תרגום שיר פתיחה/סיום" },
  { personId: "ht-chasia-wertheim", productionId: "ht-peter-pan-adventures", role: "producer", characterName: "הפקת דיבוב" },
  { personId: "ht-ruti-holtzman", productionId: "ht-peter-pan-adventures", role: "producer", characterName: "הפקת דיבוב" },
  { personId: "ht-hani-nachmias", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "וונדי דרלינג / ג'יין דרלינג" },
  { personId: "ht-pazit-noni", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "מייקל דרלינג" },
  { personId: "ht-tami-eshel", productionId: "ht-peter-pan-adventures", role: "dubber", characterName: "קפיצי / טובי" },
];
`;

// Fix person ids to match slugify of Hebrew names
// Recompute map for credits - the generator used guessed ids. Better regenerate credits with actual slugify.

const idOf = (name) => "ht-" + slugify(name);

// Rebuild credits section properly
const creditLines = [
  [people.includes("חנה דרורי קשי") ? idOf("חנה דרורי קשי") : "ht-chana-drori-kashi", "dub_director", "בימוי דיבוב"],
  [idOf("אורנה לביא פלינט"), "dubber", "טינקרבל"],
  [idOf("חני נחמיאס"), "dubber", "וונדי דרלינג / ג'יין דרלינג"],
  [idOf("כנרת טריפון רשף"), "dubber", "ג'ון דרלינג"],
  [idOf("פזית נוני"), "dubber", "מייקל דרלינג"],
  [idOf("תמי אשל"), "dubber", "קפיצי / טובי"],
  [idOf("נורית בנאי קורן"), "dubber", "דמויות שונות"],
  [idOf("ליליאן ברטו"), "dubber", "ליליאן ברטובולי / לונה / פנדורה"],
  ["efi-ben-israel", "dubber", "לילי נמר / אליזבת דרלינג / בתולת ים"],
  [idOf("שמעון כהן"), "dubber", "קפטן הוק"],
  [idOf("אלי גורנשטיין"), "dubber", "סמי / דון בלבוש"],
  [idOf("עודד מנשה"), "dubber", "ביל / משרת של פנדורה"],
  [idOf("שחר צרפתי"), "dubber", "אלף / משרת של פנדורה"],
  [idOf("שמוליק יפרח"), "dubber", "שארקי / רובר / ג'ורג' דארלינג"],
  [idOf("יורם גל"), "dubber", "שארקי / רובר / צ'יקו"],
  [idOf("חנה דרורי קשי"), "dubber", "מלכת הפיות [אורחת]"],
  [idOf("רוני וייס"), "composer", "ניהול מוזיקלי"],
  [idOf("לאה נאור"), "writer", "תרגום שירים"],
  [idOf("חסיה ורטהיים"), "producer", "הפקת דיבוב"],
  [idOf("רותי הולצמן"), "producer", "הפקת דיבוב"],
];

out = out.replace(
  /\/\*\* Detailed credits[\s\S]*$/m,
  `/** Detailed credits for פיטר פן from hop tamir page */
export const HOP_TAMIR_CREDITS: Credit[] = [
${creditLines
  .map(
    ([pid, role, ch]) =>
      `  { personId: "${pid}", productionId: "ht-peter-pan-adventures", role: "${role}", characterName: "${esc(ch)}" },`
  )
  .join("\n")}
];
`
);

const dest = path.join(__dirname, "../src/lib/seed-hop-tamir.ts");
fs.writeFileSync(dest, out, "utf8");
console.log("Wrote", dest);
console.log("people", people.length + extras.length);
console.log("productions", selected.length + 1);
console.log("credits", creditLines.length);
