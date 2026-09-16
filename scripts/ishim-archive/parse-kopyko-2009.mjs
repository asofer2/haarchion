import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function decodeHtml(s) {
  return String(s || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(s) {
  return decodeHtml(String(s || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeQueryValue(raw) {
  const cleaned = decodeHtml(raw).replace(/\+/g, " ");
  try {
    return decodeURIComponent(cleaned);
  } catch {
    return cleaned;
  }
}

function slugify(input) {
  const map = {
    א: "a",
    ב: "b",
    ג: "g",
    ד: "d",
    ה: "h",
    ו: "v",
    ז: "z",
    ח: "ch",
    ט: "t",
    י: "y",
    כ: "k",
    ך: "k",
    ל: "l",
    מ: "m",
    ם: "m",
    נ: "n",
    ן: "n",
    ס: "s",
    ע: "a",
    פ: "p",
    ף: "f",
    צ: "ts",
    ץ: "ts",
    ק: "k",
    ר: "r",
    ש: "sh",
    ת: "t",
  };
  return input
    .trim()
    .toLowerCase()
    .split("")
    .map((ch) => {
      if (map[ch]) return map[ch];
      if (/[a-z0-9]/i.test(ch)) return ch.toLowerCase();
      if (ch === " " || ch === "-" || ch === "־") return "-";
      return "";
    })
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapRole(heading) {
  const h = heading.replace(/\s+/g, " ").trim();
  const table = [
    [/מדבב/, "dubber"],
    [/שחקנ/, "actor"],
    [/תסריט/, "writer"],
    [/עריכה|עורך/, "writer"],
    [/יוצר/, "writer"],
    [/מנח|מגיש/, "host"],
    [/מפיק|הפקה/, "producer"],
    [/במאי דיבוב|בימוי דיבוב/, "dub_director"],
    [/במאי|בימוי/, "director"],
    [/מוזיקה|זמר/, "singer"],
    [/צלם|צילום/, "cinematographer"],
    [/תפקידים שונים|מאחורי הקלעים/, "producer"],
  ];
  for (const [re, role] of table) {
    if (re.test(h)) return role;
  }
  return "actor";
}

const PREFERRED_IDS = {
  "עדי בנימינוב": "adi-benyaminov",
  "יוסי מרשק": "yosi-marshak",
  "עידית נוידרפר": "idit-neudorfer",
  "מעיין אלוני": "maayan-aloni",
  "הילה לוזיה": "hila-luzia",
  "רודי סעדה": "rudi-saada",
  "דניאל ליטוין": "daniel-litvin",
  "יעל ברקמן": "yael-barkman",
  "טל לוי": "tal-levi-puppeteer",
  "גלי חזן": "gali-hazan",
  "תמר בורנשטיין-לזר": "tamar-bornstein-lazar",
  "תמר בורנשטיין לזר": "tamar-bornstein-lazar",
  "חנן פלד": "chanan-peled",
  "דור צויגנבום": "dor-zweigenboom",
  "דורית פלד": "dorit-peled",
  "יפה גבאי": "yaffa-gabay",
  "ליאור דטאוקר": "lyavr-dtavkr",
  "מיכל מוכתר": "mykl-mvktr",
  "גני תמיר": "gny-tmyr",
};

const html = fs.readFileSync(
  path.join(__dirname, "tmp-kopyko-2009.html"),
  "utf8"
);

function detail(label) {
  const re = new RegExp(
    `<div class='detail'><b>${label}:</b>([\\s\\S]*?)</div>`,
    "i"
  );
  const m = html.match(re);
  return m ? stripTags(m[1]) : "";
}

function xList(label) {
  const re = new RegExp(
    `<div class='xList'><b>${label}:</b><div>([\\s\\S]*?)</div></div>`,
    "i"
  );
  const m = html.match(re);
  return m ? m[1] : "";
}

const titleRaw = stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || "");
const yearMatch = titleRaw.match(/\((\d{4})(?:\s*[-–]\s*(\d{4}))?\)/);
const year = yearMatch ? Number(yearMatch[1]) : 2009;
const endYear = yearMatch?.[2] ? Number(yearMatch[2]) : undefined;
const title = titleRaw.replace(/\s*\([^)]*\)\s*$/, "").trim();

const summary = detail("עלילה");
const runtimeMinutes = Number((detail("אורך").match(/(\d+)/) || [])[1] || 0) || undefined;
const episodeCount = Number((detail("פרקים").match(/(\d+)/) || [])[1] || 0) || undefined;
const kindText = detail("סוג");
const originalTitle = detail("במקור") || undefined;

const genres = [...xList("ז'אנר").matchAll(/g\.php\?g=([^"']+)/g)].map((m) =>
  decodeQueryValue(m[1])
);
const keys = [...xList("מפתחות").matchAll(/k\.php\?k=([^"']+)/g)].map((m) =>
  decodeQueryValue(m[1])
);
const channels = [...xList("ערוץ שידור").matchAll(/n\.php\?n=([^"']+)/g)].map(
  (m) => decodeQueryValue(m[1])
);

const castSrc = (html.split(/id="cast"/)[1] || "").split(/id="trivia"/)[0] || "";
const credits = [];
const peopleMap = new Map();

for (const section of castSrc.split(/<h3>/).slice(1)) {
  const heading = stripTags((section.match(/^([^<]+)/) || [])[1] || "");
  if (!heading) continue;
  const role = mapRole(heading);

  // Production cast layout:
  // <div><div><a href='p.php?s=...'>Name</a></div><span>Character</span> [<i>2009-2013</i>]</div>
  // or crew without character: <div><a href='p.php?s=...'>Name</a></div>
  const blockRe =
    /<div>(?:<div>)?<a href=['"]([^'"]*p\.php\?s=[^'"]+)['"]>([\s\S]*?)<\/a>(?:<\/div>)?(?:<span>([\s\S]*?)<\/span>)?(?:\s*\[\s*<i>([\s\S]*?)<\/i>\s*\])?<\/div>/g;
  let m;
  let matched = false;
  while ((m = blockRe.exec(section))) {
    matched = true;
    const personName = stripTags(m[2]);
    if (!personName) continue;
    const personId = PREFERRED_IDS[personName] || slugify(personName);
    if (!peopleMap.has(personId)) {
      peopleMap.set(personId, { id: personId, name: personName });
    }
    const years = stripTags(m[4] || "");
    const ym = years.match(/(\d{4})(?:\s*[-–]\s*(\d{4}))?/);
    credits.push({
      personId,
      role,
      heading,
      year: ym ? Number(ym[1]) : undefined,
      endYear: ym?.[2] ? Number(ym[2]) : undefined,
      character: stripTags(m[3] || "") || undefined,
    });
  }

  if (!matched) {
    const simpleRe =
      /<a href=['"]([^'"]*p\.php\?s=[^'"]+)['"]>([\s\S]*?)<\/a>/g;
    while ((m = simpleRe.exec(section))) {
      const personName = stripTags(m[2]);
      if (!personName) continue;
      const personId = PREFERRED_IDS[personName] || slugify(personName);
      if (!peopleMap.has(personId)) {
        peopleMap.set(personId, { id: personId, name: personName });
      }
      credits.push({ personId, role, heading });
    }
  }
}

const triviaSrc = (html.split(/id="trivia"/)[1] || "").split(/id="authors"/)[0] || "";
const notes = [];
for (const block of triviaSrc.split(/<h3>/).slice(1)) {
  const noteHeading = stripTags((block.match(/^([^<]+)/) || [])[1] || "");
  const items = [...block.matchAll(/<li>([\s\S]*?)<\/li>/g)]
    .map((x) => stripTags(x[1]))
    .filter(Boolean);
  if (noteHeading && items.length) notes.push({ heading: noteHeading, items });
}

const authorsSrc = html.split(/id="authors"/)[1] || html.split(/כותבי הערך/)[1] || "";
const entryAuthors = [...authorsSrc.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/g)]
  .map((x) => stripTags(x[1]))
  .filter(
    (a) =>
      a &&
      !/היסטוריית|עדכן ערך|לחץ כאן|אישים בפייסבוק|מדיניות/.test(a)
  );

let kind = "tv_series";
if (/מדובב/.test(kindText) && /סדרה/.test(kindText)) kind = "series_dubbed_foreign";
else if (/סדרת טלוויזיה/.test(kindText)) kind = "tv_series";

const out = {
  title,
  year,
  endYear,
  summary,
  runtimeMinutes,
  episodeCount,
  genres,
  channel: channels.join(" / ") || undefined,
  originalTitle,
  ishimKeys: keys,
  ishimNotes: notes.length ? notes : undefined,
  entryAuthors,
  kind,
  credits,
  people: [...peopleMap.values()],
};

console.log(
  JSON.stringify(
    {
      title,
      year,
      endYear,
      summary,
      runtimeMinutes,
      episodeCount,
      channel: out.channel,
      genres,
      keys,
      kindText,
      headings: [...new Set(credits.map((c) => c.heading))],
      credits: credits.length,
      people: out.people.length,
      sampleActors: credits.filter((c) => c.heading === "שחקנים").slice(0, 10),
      entryAuthors,
      notes,
    },
    null,
    2
  )
);

fs.writeFileSync(
  path.join(__dirname, "../../src/data/kopyko-2009.json"),
  JSON.stringify(out, null, 2),
  "utf8"
);
