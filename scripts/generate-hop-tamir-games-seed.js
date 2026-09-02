/**
 * Generate seed-hop-tamir-games.ts from hoptamir-prods.json entries tagged משחק מחשב.
 * Run: node scripts/generate-hop-tamir-games-seed.js
 */
const fs = require("fs");
const path = require("path");

const prodsRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, "hoptamir-prods.json"), "utf8")
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
    .slice(0, 55) || "game";
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function parseGame(raw) {
  if (!raw.includes("משחק מחשב")) return null;
  let t = String(raw)
    .replace(/\s*=\s*משחק מחשב\s*$/, "")
    .replace(/\s*אישים\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const m = t.match(/^(.*?)\s*\((\d{4})\)\s*$/);
  if (!m) return null;
  const title = m[1].replace(/^["']|["']$/g, "").trim();
  if (!title) return null;
  return { title, year: Number(m[2]) };
}

const games = [];
const seen = new Set();
for (const raw of prodsRaw) {
  const parsed = parseGame(raw);
  if (!parsed) continue;
  const key = `${parsed.title}|${parsed.year}`;
  if (seen.has(key)) continue;
  seen.add(key);
  games.push(parsed);
}
games.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, "he"));

const enriched = {
  "משחק העונות": {
    summary:
      "הצטרפו למשחק העונות של מולי הילדה ולמדו על עונות השנה ומה יש בהן. משחק מחשב חינוכי ישראלי מארכיון הופ תמיר.",
    genres: ["משחק מחשב", "ילדים", "חינוכי"],
  },
};

let out = `import type { Credit, Production } from "./types";
import { portrait } from "./portrait";

/** משחקי מחשב מארכיון ערוץ הופ תמיר — https://sites.google.com/view/hoptamir */
const now = "2026-08-21T12:00:00.000Z";

function game(
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
    kind: extra.kind || "game_israeli",
    summary,
    genres: extra.genres || ["משחק מחשב", "ילדים", "חינוכי"],
    originalTitle: extra.originalTitle,
    endYear: extra.endYear,
    channel: extra.channel || "הופ תמיר",
    studio: extra.studio,
    imageUrl: extra.imageUrl || portrait(title),
    createdAt: now,
    updatedAt: now,
  };
}

export const HOP_TAMIR_GAMES: Production[] = [
`;

for (const g of games) {
  const id = `ht-game-${slugify(g.title)}`;
  const meta = enriched[g.title];
  const summary =
    meta?.summary ||
    `משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (${g.year}).`;
  if (meta?.genres) {
    out += `  game("${id}", "${esc(g.title)}", ${g.year}, "${esc(summary)}", { genres: ${JSON.stringify(meta.genres)} }),\n`;
  } else {
    out += `  game("${id}", "${esc(g.title)}", ${g.year}, "${esc(summary)}"),\n`;
  }
}

out += `];

/** קרדיטים מדפי הופ תמיר (כשיש במקור) */
export const HOP_TAMIR_GAME_CREDITS: Credit[] = [
  { personId: "ayryt-anby", productionId: "ht-game-mshchk-havnvt", role: "dubber", characterName: "מולי (קול)" },
  { personId: "avhd-shchr", productionId: "ht-game-mshchk-havnvt", role: "dubber", characterName: "קריין" },
  { personId: "chnn-gvldblt", productionId: "ht-game-mshchk-havnvt", role: "dubber", characterName: "קריין" },
];
`;

const dest = path.join(__dirname, "../src/lib/seed-hop-tamir-games.ts");
fs.writeFileSync(dest, out, "utf8");
console.log("Wrote", dest, "games:", games.length);
