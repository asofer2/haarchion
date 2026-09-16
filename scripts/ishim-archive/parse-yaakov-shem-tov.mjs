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

function mapRole(heading) {
  const h = heading.replace(/\s+/g, " ").trim();
  const table = [
    [/בתפקיד עצמו/, "host"],
    [/הרכב/, "musical_performer"],
    [/מדבב/, "dubber"],
    [/שחקנ|שחקן/, "actor"],
    [/תסריט|כותב|עורך|עריכה|תחקיר|יוצר/, "writer"],
    [/מנח|מגיש/, "host"],
    [/מפיק|הפקת/, "producer"],
    [/במאי דיבוב|בימוי דיבוב/, "dub_director"],
    [/במאי/, "director"],
    [/מוזיקה|זמר/, "singer"],
    [/צלם/, "cinematographer"],
  ];
  for (const [re, role] of table) {
    if (re.test(h)) return role;
  }
  return "actor";
}

function parseHrefS(href) {
  const m = href.match(/[mp]\.php\?s=([^"']+)/i);
  if (!m) return { s: "", title: "" };
  const s = decodeQueryValue(m[1]);
  return { s, title: s.split("#")[0] };
}

const html = fs.readFileSync(
  path.join(__dirname, "tmp-yaakov-shem-tov.html"),
  "utf8"
);

const rolesSrc = (html.split(/id="roles"/)[1] || "").split(/id="trivia"/)[0];
const credits = [];
for (const section of rolesSrc.split(/<h3>/).slice(1)) {
  const heading = stripTags((section.match(/^([^<]+)/) || [])[1] || "");
  const role = mapRole(heading);
  const re =
    /<div>(?:<span>(\+?\d{4})<\/span>)?<a href=['"]([^'"]+)['"]>([\s\S]*?)<\/a>(?:<div>([\s\S]*?)<\/div>)?<\/div>/g;
  let m;
  while ((m = re.exec(section))) {
    const parsed = parseHrefS(decodeHtml(m[2]));
    credits.push({
      role,
      heading,
      year: m[1] ? Number(String(m[1]).replace("+", "")) : undefined,
      title: stripTags(m[3]) || parsed.title,
      character: stripTags(m[4] || "") || undefined,
    });
  }
}

const triviaSrc = (html.split(/id="trivia"/)[1] || "").split(/id="authors"/)[0];
const notes = [];
for (const block of triviaSrc.split(/<h3>/).slice(1)) {
  const noteHeading = stripTags((block.match(/^([^<]+)/) || [])[1] || "");
  const items = [...block.matchAll(/<li>([\s\S]*?)<\/li>/g)]
    .map((x) => stripTags(x[1]))
    .filter(Boolean);
  if (noteHeading && items.length) notes.push({ heading: noteHeading, items });
}

const birthMatch = html.match(/y\.php\?y=(\d{4}).*?dm\.php\?d=(\d+).*?m=(\d+)/s);
const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
const keys = [...html.matchAll(/k\.php\?k=([^"']+)/g)].map((m) =>
  decodeQueryValue(m[1])
);
const birthName =
  stripTags((html.match(/נולד בשם[\s\S]*?<[^>]+>([\s\S]*?)<\/[^>]+>/) || [])[1] || "") ||
  undefined;
const authorsSrc = html.split(/id="authors"/)[1] || "";
const entryAuthors = [...authorsSrc.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/g)]
  .map((x) => stripTags(x[1]))
  .filter(Boolean);

const ageText = stripTags(
  (html.match(/גיל:([\s\S]*?)(?=<h3|id="roles"|id="trivia")/) || [])[1] || ""
);

const person = {
  name: stripTags(nameMatch ? nameMatch[1] : "יעקב שם טוב"),
  birthName,
  birthDate: birthMatch
    ? `${birthMatch[1]}-${birthMatch[3].padStart(2, "0")}-${birthMatch[2].padStart(2, "0")}`
    : undefined,
  tags: keys,
  bio: "",
  entryAuthors,
  ishimNotes: notes,
  credits,
  _meta: { ageText, creditCount: credits.length },
};

console.log(
  JSON.stringify(
    {
      name: person.name,
      birthDate: person.birthDate,
      birthName,
      tags: keys,
      credits: credits.length,
      headings: [...new Set(credits.map((c) => c.heading))],
      notes,
      entryAuthors,
      ageText,
      sample: credits.slice(0, 8),
    },
    null,
    2
  )
);

fs.writeFileSync(
  path.join(__dirname, "../../src/data/yaakov-shem-tov.json"),
  JSON.stringify(
    {
      name: person.name,
      birthName: person.birthName,
      birthDate: person.birthDate,
      tags: person.tags,
      bio: person.bio,
      entryAuthors: person.entryAuthors,
      ishimNotes: person.ishimNotes,
      credits: person.credits,
    },
    null,
    2
  ),
  "utf8"
);
