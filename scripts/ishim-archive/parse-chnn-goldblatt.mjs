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

function mapRole(heading) {
  const h = heading.replace(/\s+/g, " ").trim();
  const table = [
    [/בתפקיד עצמו/, "host"],
    [/הרכב/, "musical_performer"],
    [/במאי דיבוב/, "dub_director"],
    [/מדבב/, "dubber"],
    [/שחקנ|שחקן/, "actor"],
    [/תסריט|כותב|עורך|עריכה|תחקיר|יוצר/, "writer"],
    [/מנח|מגיש/, "host"],
  ];
  for (const [re, role] of table) {
    if (re.test(h)) return role;
  }
  return "actor";
}

const html = fs.readFileSync(path.join(__dirname, "p-chnn-goldblatt.html"), "utf8");
const rolesSrc = (html.split(/id="roles"/)[1] || "").split(/id="trivia"/)[0];
const credits = [];
for (const section of rolesSrc.split(/<h3>/).slice(1)) {
  const heading = stripTags((section.match(/^([^<]+)/) || [])[1] || "");
  const role = mapRole(heading);
  const re =
    /<div>(?:<span>(\+?\d{4})<\/span>)?<a href=['"]([^'"]+)['"]>([\s\S]*?)<\/a>(?:<div>([\s\S]*?)<\/div>)?<\/div>/g;
  let m;
  while ((m = re.exec(section))) {
    credits.push({
      role,
      heading,
      year: m[1] ? Number(String(m[1]).replace("+", "")) : undefined,
      title: stripTags(m[3]),
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
const person = {
  name: "חנן גולדבלט",
  birthDate: birthMatch
    ? `${birthMatch[1]}-${birthMatch[3].padStart(2, "0")}-${birthMatch[2].padStart(2, "0")}`
    : "1941-10-10",
  credits,
  ishimNotes: notes,
};

console.log("credits", credits.length);
const counts = {};
for (const c of credits) counts[c.heading] = (counts[c.heading] || 0) + 1;
console.log(counts);

fs.writeFileSync(
  path.join(__dirname, "../../src/data/chnn-goldblatt.json"),
  JSON.stringify(person, null, 2),
  "utf8"
);
console.log("wrote src/data/chnn-goldblatt.json");
