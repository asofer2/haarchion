/**
 * Build-time catalog extracts — keeps cold starts off the 35MB ishim JSON path.
 *   node scripts/generate-catalog-indexes.mjs
 *
 * Skips gracefully (exit 0) when src/data/ishim-archive.json is missing,
 * so CI/build without the big file still succeeds.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ARCH_PATH = path.join(ROOT, "src/data/ishim-archive.json");

const KIND_TO_DIR = [
  { label: "סדרת טלוויזיה", listHref: "/productions?kind=tv_series", kinds: ["tv_series", "series", "miniseries"] },
  { label: "תוכנית טלוויזיה", listHref: "/productions?kind=tv_program", kinds: ["tv_program"] },
  { label: "סרט טלוויזיה", listHref: "/productions?kind=film_tv", kinds: ["film_tv"] },
  { label: "סרט קולנוע", listHref: "/productions?kind=film_cinema", kinds: ["film_cinema", "film"] },
  { label: "תוכנית רדיו", listHref: "/productions?kind=radio_program", kinds: ["radio_program", "radio"] },
  { label: "סרט סטודנטים", listHref: "/productions?kind=film_student", kinds: ["film_student"] },
  { label: "קלטת ילדים", listHref: "/productions?kind=cassette_kids", kinds: ["cassette_kids", "cassette"] },
  { label: "משחק מחשב", listHref: "/productions?kind=game_israeli", kinds: ["game_israeli", "game_dubbed_foreign"] },
  { label: "הרכב", listHref: "/productions?kind=ensemble", kinds: ["ensemble"] },
  { label: "אדם", listHref: "/people", people: true },
  { label: "סדרה זרה מדובבת", listHref: "/productions?kind=series_dubbed_foreign", kinds: ["series_dubbed_foreign"] },
  { label: "סרט זר מדובב", listHref: "/productions?kind=film_dubbed_foreign", kinds: ["film_dubbed_foreign"] },
  {
    label: "סדרה ישראלית עם קטעים זרים מדובבים",
    listHref: "/productions?kind=series_israeli_foreign_dubbed",
    kinds: ["series_israeli_foreign_dubbed"],
  },
];

function slugify(input) {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\u0590-\u05FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

function personId(name, s) {
  let id = slugify(name);
  if (!id || id === "item") id = `ishim-${slugify(String(s || name).split("#")[0]) || "person"}`;
  if (!id.startsWith("ishim-") && id.length < 3) id = `ishim-${id}`;
  return id.startsWith("ishim-") ? id : id;
}

function productionId(title, s, year) {
  const base = slugify(title) || "prod";
  let id = `ishim-${base}`;
  if (s && String(s).includes("#")) {
    const frag = slugify(String(s).split("#")[1] || "");
    if (frag) id = `${id}-${frag}`;
  }
  return id;
}

/** Mirrors `resolveAirStatus` / `inferAirStatus` in src/lib/types.ts */
function resolveAirStatus(p, nowYear = new Date().getFullYear()) {
  const explicit = p.airStatus;
  if (explicit === "ended" || explicit === "airing" || explicit === "upcoming") {
    return explicit;
  }
  const year = Number(p.year) || 0;
  const endYear = p.endYear != null ? Number(p.endYear) : null;
  if (year > nowYear) return "upcoming";
  if (endYear != null && Number.isFinite(endYear)) {
    if (endYear < nowYear) return "ended";
    return "airing";
  }
  if (year < nowYear) return "ended";
  return "airing";
}

function pickUpcoming(productions, idByKey, limit = 8) {
  return productions
    .filter((p) => resolveAirStatus(p) === "upcoming")
    .sort(
      (a, b) =>
        (Number(a.year) || 0) - (Number(b.year) || 0) ||
        String(a.title || "").localeCompare(String(b.title || ""), "he")
    )
    .slice(0, limit)
    .map((p) => {
      const key = `${p.title}\0${p.s || ""}\0${p.year || 0}`;
      return {
        id: idByKey.get(key) || productionId(p.title, p.s, p.year),
        title: p.title,
        year: Number(p.year) || 0,
      };
    });
}

if (!fs.existsSync(ARCH_PATH)) {
  console.warn(
    "[generate-catalog-indexes] Skipping — missing",
    ARCH_PATH,
    "(CI/build without ishim-archive.json is OK)"
  );
  // Keep a minimal stub so `import home-summary.json` still resolves in CI.
  const stubHome = path.join(ROOT, "src/data/home-summary.json");
  if (!fs.existsSync(stubHome)) {
    fs.writeFileSync(
      stubHome,
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        kindCounts: [],
        todayPeople: [],
        latest: [],
        upcoming: [],
      })
    );
    console.warn("[generate-catalog-indexes] Wrote empty home-summary.json stub");
  }
  process.exit(0);
}

console.log("Reading", ARCH_PATH);
const arch = JSON.parse(fs.readFileSync(ARCH_PATH, "utf8"));
const people = arch.people || [];
const prods = arch.productions || [];

const peopleIndex = [];
const usedIds = new Set();
for (const p of people) {
  let id = personId(p.name, p.s);
  if (usedIds.has(id)) id = `${id}-${slugify(p.s || p.name).slice(0, 12)}`;
  usedIds.add(id);
  peopleIndex.push({
    id,
    name: p.name,
    birthDate: p.birthDate || undefined,
    deathDate: p.deathDate || undefined,
    activities: [],
  });
}

const prodIndex = [];
const usedProd = new Set();
const prodIdByKey = new Map();
for (const p of prods) {
  let id = productionId(p.title, p.s, p.year);
  if (usedProd.has(id)) id = `${id}-${p.year || "x"}`;
  usedProd.add(id);
  prodIdByKey.set(`${p.title}\0${p.s || ""}\0${p.year || 0}`, id);
  prodIndex.push({
    id,
    title: p.title,
    year: p.year || 0,
    kind: p.kind || "tv_series",
  });
}

const now = new Date();
const m = now.getMonth() + 1;
const d = now.getDate();
const todayPeople = peopleIndex
  .filter((p) => {
    if (!p.birthDate) return false;
    const parts = String(p.birthDate).split("-").map(Number);
    return parts[1] === m && parts[2] === d;
  })
  .slice(0, 12);

const kindCounts = KIND_TO_DIR.map((item) => ({
  label: item.label,
  listHref: item.listHref,
  count: item.people
    ? peopleIndex.length
    : prodIndex.filter((p) => item.kinds.includes(p.kind)).length,
}));

const homeSummary = {
  generatedAt: now.toISOString(),
  kindCounts,
  todayPeople,
  latest: [],
  upcoming: pickUpcoming(prods, prodIdByKey, 8),
};

const outData = path.join(ROOT, "src/data");
const outPublic = path.join(ROOT, "public/catalog");
fs.mkdirSync(outPublic, { recursive: true });

fs.writeFileSync(
  path.join(outData, "home-summary.json"),
  JSON.stringify(homeSummary)
);
fs.writeFileSync(
  path.join(outPublic, "people-index.json"),
  JSON.stringify(peopleIndex)
);
fs.writeFileSync(
  path.join(outPublic, "productions-index.json"),
  JSON.stringify(prodIndex)
);

console.log(
  "Wrote home-summary.json, people-index.json (%s), productions-index.json (%s)",
  peopleIndex.length,
  prodIndex.length
);
console.log(
  "Sizes MB",
  (fs.statSync(path.join(outData, "home-summary.json")).size / 1e6).toFixed(3),
  (fs.statSync(path.join(outPublic, "people-index.json")).size / 1e6).toFixed(2),
  (fs.statSync(path.join(outPublic, "productions-index.json")).size / 1e6).toFixed(2)
);
