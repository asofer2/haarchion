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

const html = fs.readFileSync(path.join(__dirname, "p-avi-kushnir.html"), "utf8");
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

console.log("credits", credits.length);
const counts = {};
for (const c of credits) counts[c.heading] = (counts[c.heading] || 0) + 1;
console.log(counts);
fs.writeFileSync(
  path.join(__dirname, "parsed-avi-kushnir.json"),
  JSON.stringify({ credits }, null, 2)
);
