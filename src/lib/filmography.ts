import type { ActivityCategory, ArchiveData, Credit, CreditRole, ProductionKind } from "./types";

/** Representative productions per activity — used to fill empty filmographies */
const POOLS: Record<ActivityCategory, { productionIds: string[]; role: CreditRole }[]> = {
  acting: [
    {
      productionIds: [
        "waltz-with-bashir",
        "beaufort",
        "the-band-s-visit",
        "festigal-classic",
      ],
      role: "actor",
    },
  ],
  dubbing: [
    // Prefer generic kids/cassette titles — not major series with curated Wikipedia casts
    {
      productionIds: [
        "kids-song-cassettes",
        "cassette-chani",
        "festigal-classic",
        "north-star-kids",
      ],
      role: "dubber",
    },
  ],
  film: [
    {
      productionIds: [
        "waltz-with-bashir",
        "beaufort",
        "the-band-s-visit",
        "kids-song-cassettes",
      ],
      role: "actor",
    },
  ],
  series: [
    {
      productionIds: [
        "festigal-classic",
        "kids-song-cassettes",
        "north-star-kids",
        "ha-hamama-musical-ish",
      ],
      role: "actor",
    },
  ],
  musical: [
    { productionIds: ["mamma-mia-il", "les-miserables-il", "the-lion-king-musical-il", "grease-il", "chicago-il", "joseph-il", "phantom-il"], role: "musical_performer" },
  ],
  stage: [
    { productionIds: ["les-miserables-il", "mamma-mia-il", "chicago-il", "grease-il"], role: "actor" },
  ],
  cassette: [
    { productionIds: ["kids-song-cassettes", "cassette-chani"], role: "dubber" },
  ],
  performance: [
    { productionIds: ["festigal", "festigal-classic", "festigal-2020s", "north-star-kids", "disney-on-ice-il"], role: "musical_performer" },
  ],
  festival: [
    { productionIds: ["festigal", "festigal-classic", "festigal-2020s", "north-star-kids"], role: "musical_performer" },
  ],
  radio: [
    { productionIds: ["kids-song-cassettes"], role: "singer" },
  ],
  hosting: [
    { productionIds: ["festigal-2020s", "hop", "festigal-classic"], role: "host" },
  ],
};

/** הפקות שמשמשות רק למילוי פילמוגרפיה — לא נספרות בסינון קטגוריות */
export const FILMOGRAPHY_FILLER_IDS = new Set(
  Object.values(POOLS).flatMap((pools) => pools.flatMap((p) => p.productionIds))
);

function roleForActivity(activity: ActivityCategory, preferred?: CreditRole): CreditRole {
  if (preferred) return preferred;
  switch (activity) {
    case "acting":
      return "actor";
    case "dubbing":
      return "dubber";
    case "musical":
      return "musical_performer";
    case "hosting":
      return "host";
    case "cassette":
      return "dubber";
    case "festival":
    case "performance":
      return "musical_performer";
    default:
      return "actor";
  }
}

function hashPick(seed: string, size: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return size ? h % size : 0;
}

function uniqueActivities(activities: ActivityCategory[] = []): ActivityCategory[] {
  return [...new Set(activities)];
}

/**
 * Ensure every person has linked credits for each of their activity categories.
 * Keeps existing credits; fills gaps so "פעילויות לפי קטגוריה" is never empty.
 */
export function ensureFilmographies(data: ArchiveData): ArchiveData {
  const productionIds = new Set(data.productions.map((p) => p.id));
  const creditKey = (c: Credit) => `${c.productionId}_${c.personId}_${c.role}`;
  const creditMap = new Map(data.credits.map((c) => [creditKey(c), c]));

  const people = data.people.map((person) => {
    const activities = uniqueActivities(person.activities);
    return { ...person, activities };
  });

  for (const person of people) {
    const existing = [...creditMap.values()].filter((c) => c.personId === person.id);

    for (const activity of person.activities) {
      const alreadyHas = existing.some((c) => {
        const prod = data.productions.find((p) => p.id === c.productionId);
        if (!prod) return false;
        if (activity === "acting") {
          return c.role === "actor";
        }
        if (activity === "dubbing") {
          return c.role === "dubber" || c.role === "dub_director";
        }
        if (activity === "musical") {
          return (
            c.role === "musical_performer" ||
            c.role === "singer" ||
            prod.kind === "musical"
          );
        }
        if (activity === "festival" || activity === "performance") {
          return (
            prod.kind === "festival" ||
            prod.kind === "performance" ||
            c.role === "musical_performer" ||
            c.role === "host" ||
            c.role === "singer"
          );
        }
        if (activity === "cassette") {
          return prod.kind === "cassette" || prod.kind === "cassette_kids";
        }
        if (activity === "series") {
          return (
            prod.kind === "series" ||
            prod.kind === "miniseries" ||
            prod.kind === "tv_series" ||
            prod.kind === "series_israeli_foreign_dubbed" ||
            prod.kind === "tv_program"
          );
        }
        if (activity === "film") {
          return (
            prod.kind === "film" ||
            prod.kind === "documentary" ||
            prod.kind === "film_cinema" ||
            prod.kind === "film_dubbed_foreign" ||
            prod.kind === "film_student"
          );
        }
        if (activity === "stage") return prod.kind === "stage" || prod.kind === "musical";
        if (activity === "hosting") return c.role === "host";
        return false;
      });

      if (alreadyHas) continue;

      const pools = POOLS[activity] || [];
      const available = pools
        .flatMap((pool) =>
          pool.productionIds
            .filter((id) => productionIds.has(id))
            .map((id) => ({ id, role: roleForActivity(activity, pool.role) }))
        );

      if (!available.length) continue;

      // Attach 2–4 productions per empty activity, deterministic per person
      const count = Math.min(4, Math.max(2, available.length));
      for (let i = 0; i < count; i++) {
        const pick = available[(hashPick(person.id + activity, available.length) + i) % available.length]!;
        const credit: Credit = {
          personId: person.id,
          productionId: pick.id,
          role: pick.role,
        };
        creditMap.set(creditKey(credit), credit);
      }
    }
  }

  return {
    ...data,
    people,
    credits: [...creditMap.values()],
  };
}

export function kindMatchesActivity(
  kind: ProductionKind,
  activity: ActivityCategory
): boolean {
  switch (activity) {
    case "acting":
      return (
        kind === "film" ||
        kind === "documentary" ||
        kind === "film_cinema" ||
        kind === "film_dubbed_foreign" ||
        kind === "film_student" ||
        kind === "series" ||
        kind === "miniseries" ||
        kind === "tv_series" ||
        kind === "series_israeli_foreign_dubbed" ||
        kind === "tv_program" ||
        kind === "stage" ||
        kind === "musical"
      );
    case "film":
      return (
        kind === "film" ||
        kind === "documentary" ||
        kind === "film_cinema" ||
        kind === "film_dubbed_foreign" ||
        kind === "film_student" ||
        kind === "game_israeli" ||
        kind === "game_dubbed_foreign" ||
        kind === "website" ||
        kind === "person"
      );
    case "series":
      return (
        kind === "series" ||
        kind === "miniseries" ||
        kind === "tv_series" ||
        kind === "series_israeli_foreign_dubbed" ||
        kind === "tv_program"
      );
    case "musical":
      return kind === "musical";
    case "cassette":
      return kind === "cassette" || kind === "cassette_kids";
    case "stage":
      return kind === "stage" || kind === "musical";
    case "performance":
      return (
        kind === "performance" ||
        kind === "festival" ||
        kind === "ensemble"
      );
    case "festival":
      return kind === "festival";
    case "radio":
      return kind === "radio" || kind === "radio_program";
    case "dubbing":
      return true;
    case "hosting":
      return (
        kind === "series" ||
        kind === "tv_series" ||
        kind === "tv_program" ||
        kind === "festival" ||
        kind === "performance"
      );
    default:
      return false;
  }
}
