const fs = require("fs");
const HEBREW_MAP = {
  א:"a",ב:"b",ג:"g",ד:"d",ה:"h",ו:"v",ז:"z",ח:"ch",ט:"t",י:"y",
  כ:"k",ך:"k",ל:"l",מ:"m",ם:"m",נ:"n",ן:"n",ס:"s",ע:"a",פ:"p",ף:"f",
  צ:"ts",ץ:"ts",ק:"k",ר:"r",ש:"sh",ת:"t","׳":"","'":"","־":"-","-":"-"," ": "-"
};
function slugify(input) {
  const transliterated = input.trim().toLowerCase().split("").map((ch) => {
    if (/[a-z0-9]/.test(ch)) return ch;
    if (HEBREW_MAP[ch] !== undefined) return HEBREW_MAP[ch];
    if (/\s/.test(ch)) return "-";
    return "";
  }).join("").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return transliterated.length >= 2 ? transliterated : `item-${Date.now().toString(36)}`;
}
function normalizeName(name) {
  return name.trim().replace(/[\u05BE\u2013\u2014\-־]+/g, " ").replace(/['׳״"]/g, "").replace(/\s+/g, " ").toLowerCase();
}
const wiki = JSON.parse(fs.readFileSync("scripts/wiki-dubbers.json", "utf8"));
const seedFiles = ["src/lib/seed.ts","src/lib/seed-extra.ts","src/lib/seed-wave2.ts","src/lib/seed-hop-tamir.ts"];
const existingNorm = new Set();
const existingIds = new Set();
for (const f of seedFiles) {
  const t = fs.readFileSync(f, "utf8");
  for (const m of t.matchAll(/name:\s*"([^"]+)"/g)) existingNorm.add(normalizeName(m[1]));
  for (const m of t.matchAll(/p\("([^"]+)",\s*"([^"]+)"/g)) {
    existingIds.add(m[1].replace(/-w2$/i, ""));
    existingNorm.add(normalizeName(m[2]));
  }
  for (const m of t.matchAll(/id:\s*"([^"]+)"/g)) existingIds.add(m[1].replace(/-w2$/i, ""));
}
const missing = [];
const usedIds = new Set(existingIds);
for (const title of wiki) {
  if (title.startsWith("רשימת") || title.includes("קטגוריה")) continue;
  if (existingNorm.has(normalizeName(title))) continue;
  let id = slugify(title);
  let base = id, i = 2;
  while (usedIds.has(id)) id = `${base}-${i++}`;
  usedIds.add(id);
  missing.push({ id, name: title });
}
const rich = {
  "יוני חן": {
    id: "yoni-chen",
    activities: '["dubbing", "film", "series", "stage"]',
    bio: "יוני חן (1953–1995) היה שחקן, במאי, בובנאי ומדבב ישראלי. דיבב והפעיל את בץ ב„פרפר נחמד”, הקים את אולפן הדיבוב אולפנטו, ושיחק ב„הלהקה”, „דיזנגוף 99” ו„חמש חמש”. מקור: ויקיפדיה."
  }
};
const lines = [
  'import type { ActivityCategory, Person } from "./types";',
  'import { portrait } from "./portrait";',
  '',
  'const now = "2026-07-27T12:00:00.000Z";',
  '',
  'function wikiImage(title: string) { return portrait(title); }',
  '',
  'function p(',
  '  id: string,',
  '  name: string,',
  '  activities: ActivityCategory[] = ["dubbing", "film", "series"],',
  '  bio = "מדבב/ת ושחקן/ית ישראלי/ת — לפי קטגוריית מדבבים ישראלים בוויקיפדיה."',
  '): Person {',
  '  return {',
  '    id, name, nicknames: [], tags: ["דיבוב", "ויקיפדיה"], activities, bio,',
  '    wikipediaUrl: `https://he.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, "_"))}`,',
  '    imageUrl: wikiImage(name), createdAt: now, updatedAt: now,',
  '  };',
  '}',
  '',
  '/** מדבבים ישראלים מוויקיפדיה שלא היו במאגר (~' + missing.length + ') */',
  'export const WIKI_DUBBERS: Person[] = [',
];
for (const row of missing) {
  const r = rich[row.name];
  const id = r?.id || row.id;
  const safe = row.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (r) {
    lines.push(`  p("${id}", "${safe}", ${r.activities}, "${r.bio.replace(/"/g, '\\"')}"),`);
  } else {
    lines.push(`  p("${id}", "${safe}"),`);
  }
}
lines.push('];');
lines.push('');
fs.writeFileSync('src/lib/seed-wiki-dubbers.ts', lines.join('\n'));
console.log('wrote', missing.length, 'sample ids', missing.slice(0,5));
