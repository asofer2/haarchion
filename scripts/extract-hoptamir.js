const fs = require("fs");
const snap = fs.readFileSync(
  "C:/Users/asofe/.cursor/browser-logs/snapshot-2026-07-24T14-06-42-369Z-h08x2r.log",
  "utf8"
);
const lines = snap.split(/\n/);
const titles = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("role: link")) {
    const m = lines[i + 1] && lines[i + 1].match(/name: (.+)/);
    if (m) titles.push(m[1].trim().replace(/^"|"$/g, ""));
  }
}
const uniq = [...new Set(titles)];
const prods = [];
const people = [];
const skip = new Set([
  "אנימציה",
  "ילדים",
  "מדובב - זר",
  "חינוכית",
  "ערוץ הופ תמיר",
]);
for (const t of uniq) {
  if (skip.has(t) || t.length < 2) continue;
  if (/\(\s*-?\s*\d{4}/.test(t) || /אישים/.test(t)) {
    let clean = t
      .replace(/\s*אישים\s*$/g, "")
      .replace(/\(2026 אישים/g, "(2026)")
      .replace(/\(\s*-(\d{4})/g, "($1")
      .trim();
    if (clean.length > 2) prods.push(clean);
  } else if (
    !/Skip|Show|Open|Site|Google|Report|ערוץ/.test(t) &&
    /[\u0590-\u05FF]/.test(t) &&
    t.length < 45
  ) {
    people.push(t);
  }
}
const up = [...new Set(prods)];
const upe = [...new Set(people)];
fs.writeFileSync(
  "C:/Users/asofe/haarchion/scripts/hoptamir-prods.json",
  JSON.stringify(up, null, 2),
  "utf8"
);
fs.writeFileSync(
  "C:/Users/asofe/haarchion/scripts/hoptamir-people.json",
  JSON.stringify(upe, null, 2),
  "utf8"
);
console.log("productions", up.length);
console.log("people", upe.length);
console.log(up.slice(0, 30).join("\n"));
console.log("---");
console.log(upe.slice(0, 40).join("\n"));
