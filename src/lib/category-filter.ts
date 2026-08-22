import { kindMatchesActivity } from "./filmography";
import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  Person,
  Production,
} from "./types";

/**
 * הפקות «דלי» למילוי פילמוגרפיה — קרדיטים עליהן בלי שם דמות
 * לא נספרים בסינון קטגוריות.
 */
const GENERIC_FILLER_IDS = new Set([
  "kids-song-cassettes",
  "cassette-chani",
  "festigal-classic",
  "festigal",
  "festigal-2020s",
  "north-star-kids",
  "disney-on-ice-il",
  "waltz-with-bashir",
  "beaufort",
  "the-band-s-visit",
  "ha-hamama-musical-ish",
  "hop",
]);

/** הפקה מדובבת / עם דיבוב עברי */
export function isDubbedProduction(p: Production): boolean {
  if (p.dubbingStudio) return true;
  if (
    p.kind === "film_dubbed_foreign" ||
    p.kind === "game_dubbed_foreign" ||
    p.kind === "series_israeli_foreign_dubbed"
  ) {
    return true;
  }
  return (p.genres || []).some((g) =>
    /מדובב|דיבוב|אנימציה|אנימה|דיסני/.test(g)
  );
}

/** האם הפקה שייכת לקטגוריית עיון */
export function productionMatchesCategory(
  p: Production,
  cat: ActivityCategory
): boolean {
  if (cat === "dubbing") return isDubbedProduction(p);
  if (cat === "acting") {
    return (
      kindMatchesActivity(p.kind, "film") ||
      kindMatchesActivity(p.kind, "series") ||
      kindMatchesActivity(p.kind, "stage") ||
      kindMatchesActivity(p.kind, "musical") ||
      kindMatchesActivity(p.kind, "game")
    );
  }
  if (cat === "hosting") {
    return (
      p.kind === "tv_program" ||
      p.kind === "festival" ||
      p.kind === "performance" ||
      p.id === "hop"
    );
  }
  return kindMatchesActivity(p.kind, cat);
}

function isMeaningfulCredit(
  credit: Credit,
  cat: ActivityCategory,
  productionById: Map<string, Production>
): boolean {
  const prod = productionById.get(credit.productionId);
  if (!prod) return false;

  if (cat === "dubbing") {
    if (credit.role !== "dubber" && credit.role !== "dub_director") return false;
    if (GENERIC_FILLER_IDS.has(prod.id) && !credit.characterName) return false;
    return true;
  }

  if (cat === "acting") {
    if (credit.role !== "actor") return false;
    if (GENERIC_FILLER_IDS.has(prod.id) && !credit.characterName) return false;
    return true;
  }

  if (cat === "hosting") {
    return credit.role === "host";
  }

  // קלטות / פסטיגל — ההפקות עצמן הן גם «דלי»; סופרים לפי סוג+תפקיד
  if (cat === "cassette") {
    return (
      (prod.kind === "cassette" || prod.kind === "cassette_kids") &&
      (credit.role === "dubber" ||
        credit.role === "singer" ||
        credit.role === "actor")
    );
  }
  if (cat === "festival") {
    return (
      prod.kind === "festival" &&
      (credit.role === "musical_performer" ||
        credit.role === "singer" ||
        credit.role === "host" ||
        credit.role === "actor" ||
        Boolean(credit.characterName))
    );
  }

  if (cat === "musical") {
    if (credit.role === "musical_performer" || credit.role === "singer") {
      if (GENERIC_FILLER_IDS.has(prod.id) && !credit.characterName) return false;
      return (
        productionMatchesCategory(prod, "musical") ||
        prod.kind === "musical" ||
        prod.kind === "festival"
      );
    }
  }

  if (cat === "game") {
    if (credit.role !== "dubber" && credit.role !== "actor") return false;
    return productionMatchesCategory(prod, "game");
  }

  if (!productionMatchesCategory(prod, cat)) return false;
  if (credit.characterName) return true;
  if (GENERIC_FILLER_IDS.has(prod.id)) return false;

  return (
    credit.role === "actor" ||
    credit.role === "director" ||
    credit.role === "writer" ||
    credit.role === "musical_performer" ||
    credit.role === "singer" ||
    credit.role === "host" ||
    credit.role === "dubber" ||
    credit.role === "dub_director"
  );
}

/**
 * אישיות בקטגוריה:
 * - שחקן / מדבב: מספיק סימון פעילות (נגזר מקרדיטים)
 * - שאר הקטגוריות: פעילות + קרדיט משמעותי
 */
export function personMatchesCategory(
  person: Person,
  cat: ActivityCategory,
  credits: Credit[],
  productionById: Map<string, Production>
): boolean {
  if (!(person.activities || []).includes(cat)) return false;

  // מקצועות: כל מי שמסומן שחקן/מדבב מופיע בקטגוריה ובחיפוש
  if (cat === "acting" || cat === "dubbing") return true;

  if (cat === "game") {
    for (const c of credits) {
      if (c.personId !== person.id) continue;
      const prod = productionById.get(c.productionId);
      if (prod && kindMatchesActivity(prod.kind, "game")) return true;
    }
    return false;
  }

  for (const c of credits) {
    if (c.personId !== person.id) continue;
    if (isMeaningfulCredit(c, cat, productionById)) return true;
  }
  return false;
}

export function filterArchiveByCategory(
  data: ArchiveData,
  cat: ActivityCategory
): { people: Person[]; productions: Production[] } {
  const productionById = new Map(data.productions.map((p) => [p.id, p]));

  let productions: Production[];
  if (cat === "hosting") {
    const hostProdIds = new Set(
      data.credits.filter((c) => c.role === "host").map((c) => c.productionId)
    );
    productions = data.productions
      .filter((p) => hostProdIds.has(p.id))
      .sort((a, b) => b.year - a.year);
  } else {
    productions = data.productions
      .filter((p) => productionMatchesCategory(p, cat))
      .sort((a, b) => b.year - a.year);
  }

  const people = data.people
    .filter((p) => personMatchesCategory(p, cat, data.credits, productionById))
    .sort((a, b) => a.name.localeCompare(b.name, "he"));

  return { people, productions };
}

export function categoryCounts(data: ArchiveData): Record<
  ActivityCategory,
  { people: number; productions: number }
> {
  const cats: ActivityCategory[] = [
    "acting",
    "dubbing",
    "film",
    "series",
    "musical",
    "stage",
    "cassette",
    "performance",
    "festival",
    "radio",
    "hosting",
    "game",
  ];

  const result = {} as Record<
    ActivityCategory,
    { people: number; productions: number }
  >;

  for (const cat of cats) {
    const { people, productions } = filterArchiveByCategory(data, cat);
    result[cat] = { people: people.length, productions: productions.length };
  }
  return result;
}
