import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] || path.join(__dirname, "../../agent-tools/0dffc01a-6041-49cf-95f6-dd79fa1a0bad.txt");

const text = fs.readFileSync(SRC, "utf8");
const lines = text.split(/\r?\n/).map((l) => l.trim());

function mapRole(heading) {
  if (heading === "מדבבת") return "dubber";
  if (heading === "מפיקה" || heading === "מפיקת דיבוב") return "producer";
  if (heading === "תפקידים שונים") return "producer";
  return "producer";
}

const YEAR_TITLE = /^\+?(\d{4})\s*(.*)$/;

function parseYearTitle(line) {
  const m = line.match(YEAR_TITLE);
  if (!m) return null;
  const year = Number(m[1]);
  const title = (m[2] || "").trim();
  if (!title) return null;
  return { year, title };
}

function isMetaLine(line) {
  if (!line) return true;
  if (line.startsWith("###")) return true;
  if (line.startsWith("#")) return true;
  if (line.startsWith("גיל:")) return true;
  if (line.startsWith("נולדה")) return true;
  if (line.startsWith("כותבי")) return true;
  if (line.startsWith("תמיר") || line.startsWith("ברק")) return true;
  if (line.startsWith("-")) return true;
  if (line.includes("אישים בפייסבוק")) return true;
  if (line === "חפש") return true;
  return false;
}

const credits = [];
let currentHeading = "";
let pending = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith("### ")) {
    if (pending) {
      credits.push(pending);
      pending = null;
    }
    currentHeading = line.slice(4).trim();
    continue;
  }
  if (!currentHeading || isMetaLine(line)) continue;

  const parsed = parseYearTitle(line);
  if (parsed) {
    if (pending) credits.push(pending);
    pending = {
      role: mapRole(currentHeading),
      heading: currentHeading,
      year: parsed.year,
      title: parsed.title,
    };
    continue;
  }

  if (pending && line && !line.startsWith("---")) {
    pending.character = pending.character ? `${pending.character} / ${line}` : line;
  }
}

if (pending) credits.push(pending);

const notes = [];
const familyIdx = lines.findIndex((l) => l === "### קשר משפחתי");
const generalIdx = lines.findIndex((l) => l === "### כללי");
if (familyIdx >= 0) {
  const items = [];
  for (let i = familyIdx + 1; i < lines.length && !lines[i].startsWith("###"); i++) {
    const l = lines[i].replace(/^-\s*/, "").trim();
    if (l) items.push(l);
  }
  if (items.length) notes.push({ heading: "קשר משפחתי", items });
}
if (generalIdx >= 0) {
  const items = [];
  for (let i = generalIdx + 1; i < lines.length && !lines[i].startsWith("###"); i++) {
    const l = lines[i].replace(/^-\s*/, "").trim();
    if (l && !l.startsWith("כותבי")) items.push(l);
  }
  if (items.length) notes.push({ heading: "כללי", items });
}

const person = {
  name: "ענבר שטגר עזרא",
  nameOriginal: "Inbar Steger Ezra",
  birthName: "ענבר שטגר",
  birthDate: "1971-03-27",
  tags: ["מפיקי דיבוב", "מדבבים"],
  bio: 'ענבר שטגר עזרא (נולדה ב-27 במרץ 1971) היא מפיקת דיבוב ומייסדת אולפני «דאבי דאב». עבדה בעבר באולפני נ.ל.ס, והקימה את «דאבי דאב» ב-2002. מפיקת דיבוב לעשרות סדרות וסרטי אנימציה בערוצי ילדים, ובין היתר אחראית על דיבוב «בובספוג מכנסמרובע», «הרעשנים», «גרטל והאוגר» ועוד.',
  entryAuthors: ["תמיר סופר", "ברק חננאל"],
  ishimNotes: notes,
  credits,
};

console.log("credits", credits.length);
const out = path.join(__dirname, "../../src/data/anvr-shtgr-azra.json");
fs.writeFileSync(out, JSON.stringify(person, null, 2), "utf8");
console.log("wrote", out);
