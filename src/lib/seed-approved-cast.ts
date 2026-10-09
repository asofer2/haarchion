import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import { applyIshimHopCast } from "./seed-ishim-hop-cast";
import { applyIshimJungleBook } from "./seed-ishim-spr-hgvngl";
import { applyIshimMagicRoundabout } from "./seed-ishim-krvslt-hksmym";
import { applyTelepenoli } from "./seed-telepenoli";
import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";

const NOW = "2026-10-07T14:40:00.000Z";
const SHAGIT_ID = "shgyt-hmvshgyt";
const SHAGIT_TITLE = "שגית המושגית";
const SHAGIT_WIKI = "https://he.wikipedia.org/wiki/שגית_המושגית";

type PersonSpec = {
  id: string;
  name: string;
  gender: "male" | "female";
  birthDate?: string;
  deathDate?: string;
  activities: ActivityCategory[];
  tags: string[];
  bio: string;
  wikipediaUrl: string;
};

type RoleRow = {
  personId: string;
  title: string;
  year: number;
  endYear?: number;
  kind: ProductionKind;
  channel?: string;
  genres: string[];
  role: Extract<CreditRole, "actor" | "dubber">;
  heading: "שחקן" | "מדבב";
  characterName: string;
  summary: string;
};

const PEOPLE: PersonSpec[] = [
  {
    id: "byynh-gthvn",
    name: "ביינה גטהון",
    gender: "male",
    birthDate: "1973-10-22",
    activities: ["acting", "dubbing"],
    tags: ["שחקנים", "מדבבים"],
    bio: "ביינה גטהון (נולד ב-22 באוקטובר 1973) הוא שחקן ותסריטאי ישראלי. בין תפקידיו: אברהם ב„האלופה”, לורוס ב„היפה והגלדיאטור”, וטמנו בריהון ב„שנות ה-80”.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/ביינה_גטהון",
  },
  {
    id: "vldymyr-chlmsky",
    name: "ולדימיר חלמסקי",
    gender: "male",
    birthDate: "1946-03-15",
    deathDate: "2013-04-30",
    activities: ["acting"],
    tags: ["שחקנים"],
    bio: "ולדימיר חלמסקי (15 במרץ 1946 – 30 באפריל 2013) היה שחקן, קריין ועיתונאי ישראלי. בשנים 1998–2001 גילם את יאשה מוסקוביץ׳ בסדרה „טירונות”.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/ולדימיר_חלמסקי",
  },
  {
    id: "arlt-myntsr",
    name: "ארלט מינצר",
    gender: "female",
    birthDate: "1945-09-29",
    activities: ["acting"],
    tags: ["שחקנים"],
    bio: "ארלט מינצר (נולדה ב-29 בספטמבר 1945) היא פסיכולוגית קלינית, משוררת ושחקנית ישראלית. בקולנוע גילמה עיתונאית ב„הגונב מגנב פטור” (1977) ואת אסתר ב„גשר צר מאוד” (1985).",
    wikipediaUrl: "https://he.wikipedia.org/wiki/ארלט_מינצר",
  },
];

/** רק תפקידים שהערך נוקב בשם הדמות. בלי שנות המצאה ובלי תפקידי תיאטרון בלי שם. */
const ROLES: RoleRow[] = [
  {
    personId: "byynh-gthvn",
    title: "האלופה",
    year: 2006,
    kind: "tv_series",
    channel: "HOT",
    genres: ["דרמה"],
    role: "actor",
    heading: "שחקן",
    characterName: "אברהם",
    summary:
      "סדרת דרמה ישראלית של HOT. בעונה הראשונה (2006) גילם ביינה גטהון את אברהם.",
  },
  {
    personId: "byynh-gthvn",
    title: "היפה והגלדיאטור",
    year: 2013,
    kind: "film_dubbed_foreign",
    genres: ["הנפשה"],
    role: "dubber",
    heading: "מדבב",
    characterName: "לורוס",
    summary: "סרט שבו דיבב ביינה גטהון את לורוס (2013).",
  },
  {
    personId: "byynh-gthvn",
    title: "שנות ה-80",
    year: 2017,
    endYear: 2020,
    kind: "tv_series",
    genres: ["קומדיה"],
    role: "actor",
    heading: "שחקן",
    characterName: "טמנו בריהון",
    summary:
      "סדרה קומית ישראלית (2017–2020). ביינה גטהון גילם את טמנו בריהון.",
  },
  {
    personId: "byynh-gthvn",
    title: "ליידי טיטי",
    year: 2018,
    kind: "film_cinema",
    genres: [],
    role: "actor",
    heading: "שחקן",
    characterName: "יסאייס",
    summary: "סרט קולנוע (2018). ביינה גטהון גילם את יסאייס.",
  },
  {
    personId: "byynh-gthvn",
    title: "נבסו",
    year: 2021,
    kind: "tv_series",
    channel: "ערוץ 13",
    genres: ["קומדיה"],
    role: "actor",
    heading: "שחקן",
    characterName: "בני",
    summary: "סדרה קומית של ערוץ 13 (2021). ביינה גטהון גילם את בני.",
  },
  {
    personId: "byynh-gthvn",
    title: "שקופים",
    year: 2021,
    kind: "tv_series",
    channel: "HOT3",
    genres: [],
    role: "actor",
    heading: "שחקן",
    characterName: "עוואט",
    summary: "סדרה ששודרה ב-HOT3 (2021). ביינה גטהון גילם את עוואט.",
  },
  {
    personId: "byynh-gthvn",
    title: "ההילולה",
    year: 2023,
    kind: "film_cinema",
    genres: [],
    role: "actor",
    heading: "שחקן",
    characterName: "טמנו",
    summary: "סרט (2023). ביינה גטהון חזר לגלם את טמנו.",
  },
  {
    personId: "byynh-gthvn",
    title: "השגרירות",
    year: 2023,
    kind: "tv_series",
    genres: [],
    role: "actor",
    heading: "שחקן",
    characterName: "שגריר צ'אד",
    summary: "סדרת טלוויזיה (2023). ביינה גטהון גילם את שגריר צ'אד.",
  },
  {
    personId: "byynh-gthvn",
    title: "קופה ראשית",
    year: 2023,
    kind: "tv_series",
    genres: ["קומדיה"],
    role: "actor",
    heading: "שחקן",
    characterName: "ג'ימי",
    summary: "סדרה קומית. ב-2023 גילם ביינה גטהון את ג'ימי.",
  },
  {
    personId: "byynh-gthvn",
    title: "שנות ה-90",
    year: 2024,
    kind: "tv_series",
    genres: ["קומדיה"],
    role: "actor",
    heading: "שחקן",
    characterName: "טמנו",
    summary:
      "העונה השנייה של סדרת הטלוויזיה (2024). ביינה גטהון חזר לגלם את טמנו.",
  },
  {
    personId: "byynh-gthvn",
    title: "הבית של מתוקו",
    year: 2009,
    kind: "stage",
    genres: [],
    role: "actor",
    heading: "שחקן",
    characterName: "מתוקו",
    summary:
      "הצגה בבימויו של משה מלכא. ביינה גטהון גילם את מתוקו, וקיבל עליה ציון לשבח בפסטיבל עכו 2009.",
  },
  {
    personId: "vldymyr-chlmsky",
    title: "טירונות",
    year: 1998,
    endYear: 2001,
    kind: "tv_series",
    genres: [],
    role: "actor",
    heading: "שחקן",
    characterName: "יאשה מוסקוביץ׳",
    summary:
      "סדרת טלוויזיה (1998–2001). ולדימיר חלמסקי גילם את יאשה מוסקוביץ׳, אביו של בוריס.",
  },
  {
    personId: "arlt-myntsr",
    title: "הגונב מגנב פטור",
    year: 1977,
    kind: "film_cinema",
    genres: [],
    role: "actor",
    heading: "שחקן",
    characterName: "עיתונאית",
    summary:
      "סרט קולנוע בבימויו של זאב רווח (1977). ארלט מינצר גילמה עיתונאית.",
  },
  {
    personId: "arlt-myntsr",
    title: "גשר צר מאוד",
    year: 1985,
    kind: "film_cinema",
    genres: [],
    role: "actor",
    heading: "שחקן",
    characterName: "אסתר",
    summary: "סרט קולנוע בבימוי נסים דיין (1985). ארלט מינצר גילמה את אסתר.",
  },
];

function nameKey(name: string): string {
  return normalizePersonName(name);
}

function normTitle(title: string): string {
  return title
    .trim()
    .replace(/[־–—-]/g, "")
    .replace(/["״"'']/g, "")
    .replace(/\s+/g, " ");
}

function stubIdFor(title: string): string {
  return `approved-${slugify(title)}`;
}

function storedImage(url?: string): boolean {
  if (!url) return false;
  if (url.startsWith("/images/") || url.startsWith("data:")) return true;
  return (
    /^https?:\/\//i.test(url) &&
    !url.includes("/api/portrait") &&
    !url.includes("/api/wiki-image")
  );
}

function findPerson(people: Person[], spec: Pick<PersonSpec, "id" | "name">): Person | undefined {
  return (
    people.find((person) => person.id === spec.id) ||
    people.find((person) => nameKey(person.name) === nameKey(spec.name))
  );
}

function ensurePerson(people: Person[], spec: PersonSpec): Person[] {
  const existing = findPerson(people, spec);
  const next: Person = existing
    ? {
        ...existing,
        name: existing.name || spec.name,
        nicknames: existing.nicknames || [],
        gender: spec.gender,
        birthDate: existing.birthDate || spec.birthDate,
        deathDate: existing.deathDate || spec.deathDate,
        activities: [...new Set([...spec.activities, ...(existing.activities || [])])],
        tags: [...new Set([...spec.tags, ...(existing.tags || [])])],
        bio: existing.bio && existing.bio.trim().length > 120 ? existing.bio : spec.bio,
        wikipediaUrl: existing.wikipediaUrl || spec.wikipediaUrl,
        sourceNote: existing.sourceNote || "ויקיפדיה",
        sourceUrl: existing.sourceUrl || spec.wikipediaUrl,
        imageUrl:
          existing.imageUrl ||
          portrait(spec.name, undefined, { kind: "person", personId: existing.id }),
        updatedAt: NOW,
      }
    : {
        id: spec.id,
        name: spec.name,
        nicknames: [],
        gender: spec.gender,
        birthDate: spec.birthDate,
        deathDate: spec.deathDate,
        bio: spec.bio,
        tags: spec.tags,
        activities: spec.activities,
        wikipediaUrl: spec.wikipediaUrl,
        sourceNote: "ויקיפדיה",
        sourceUrl: spec.wikipediaUrl,
        imageUrl: portrait(spec.name, undefined, { kind: "person", personId: spec.id }),
        createdAt: NOW,
        updatedAt: NOW,
      };
  if (!existing) return [...people, next];
  return people.map((person) => (person.id === existing.id ? next : person));
}

function ensureDubber(people: Person[], name: string, preferredId: string): Person[] {
  const existing =
    people.find((person) => person.id === preferredId) ||
    people.find((person) => nameKey(person.name) === nameKey(name));
  if (!existing) {
    const person: Person = {
      id: preferredId,
      name,
      nicknames: [],
      bio: "",
      tags: ["מדבבים"],
      activities: ["dubbing"],
      sourceNote: "ויקיפדיה",
      sourceUrl: SHAGIT_WIKI,
      imageUrl: portrait(name, undefined, { kind: "person", personId: preferredId }),
      createdAt: NOW,
      updatedAt: NOW,
    };
    return [...people, person];
  }
  if (existing.activities?.includes("dubbing")) return people;
  const next: Person = {
    ...existing,
    activities: [...(existing.activities || []), "dubbing"],
  };
  return people.map((person) => (person.id === existing.id ? next : person));
}

function applyShagit(data: ArchiveData): ArchiveData {
  const people = ensureDubber(data.people, "דון לני גבאי", "dvn-lny-gbay");
  const dubber = findPerson(people, { id: "dvn-lny-gbay", name: "דון לני גבאי" });
  const productions = [...data.productions];
  const index = productions.findIndex(
    (production) => production.id === SHAGIT_ID || normTitle(production.title) === normTitle(SHAGIT_TITLE)
  );
  const previous = index >= 0 ? productions[index] : undefined;
  const id = previous?.id || SHAGIT_ID;
  const production: Production = {
    ...(previous || { id, createdAt: NOW }),
    id,
    title: SHAGIT_TITLE,
    year: 2013,
    endYear: 2013,
    airStatus: "ended",
    kind: "tv_series",
    channel: "הערוץ הראשון",
    runtimeMinutes: 3,
    episodeCount: 18,
    genres: ["הנפשה", "ילדים"],
    summary:
      "שגית המושגית היא סדרת הנפשה ישראלית לילדים ששודרה בערוץ הראשון ב-2013 (2 עונות, 18 פרקים, כ-3 דקות לפרק). הסדרה עוקבת אחרי ילדה צבעונית ומגניבה בשם שגית המושגית, המדובבת על ידי דון לני גבאי. את הסדרה יצר וביים קוה שפרן; יפה גבאי ביימה את הקולות.",
    sourceNote: "ויקיפדיה",
    sourceUrl: SHAGIT_WIKI,
    dubbingStudio: undefined,
    imageUrl: storedImage(previous?.imageUrl)
      ? previous?.imageUrl
      : portrait(SHAGIT_TITLE, undefined, { kind: "film", productionId: id }),
    updatedAt: NOW,
  };
  if (index >= 0) productions[index] = production;
  else productions.push(production);

  const credit: Credit = {
    personId: dubber?.id || "dvn-lny-gbay",
    productionId: id,
    role: "dubber",
    heading: "מדבב",
    characterName: "שגית המושגית",
    billingOrder: 0,
  };
  return {
    ...data,
    people,
    productions,
    credits: [...data.credits.filter((row) => row.productionId !== id), credit],
  };
}

function kindFamily(kind: ProductionKind): "series" | "film" | "stage" | "other" {
  if (
    kind === "tv_series" ||
    kind === "series" ||
    kind === "miniseries" ||
    kind === "tv_program" ||
    kind === "series_dubbed_foreign" ||
    kind === "series_israeli_foreign_dubbed"
  ) {
    return "series";
  }
  if (
    kind === "film" ||
    kind === "film_cinema" ||
    kind === "film_tv" ||
    kind === "film_dubbed_foreign" ||
    kind === "film_student" ||
    kind === "documentary"
  ) {
    return "film";
  }
  if (kind === "stage" || kind === "musical") return "stage";
  return "other";
}

function yearsTouch(production: Production, row: RoleRow): boolean {
  if (!production.year) return true;
  const rowEnd = row.endYear || row.year;
  const sameFamily = kindFamily(production.kind) === kindFamily(row.kind);
  const end = production.endYear && production.endYear > production.year
    ? production.endYear
    : undefined;
  if (!sameFamily) {
    const closed = end || production.year;
    return row.year <= closed + 1 && rowEnd >= production.year - 1;
  }
  if (end) return row.year <= end + 3 && rowEnd >= production.year - 3;
  return rowEnd >= production.year - 3 && row.year <= production.year + 15;
}

function resolveProduction(
  productions: Production[],
  row: RoleRow
): { productions: Production[]; production: Production } {
  const stubId = stubIdFor(row.title);
  const key = normTitle(row.title);
  const matches = productions.filter((production) => normTitle(production.title) === key);
  const real = matches.find(
    (production) => production.id !== stubId && yearsTouch(production, row)
  );
  if (real) {
    return {
      productions: productions.filter((production) => production.id !== stubId),
      production: real,
    };
  }
  const stub = matches.find((production) => production.id === stubId);
  if (stub) {
    const updated: Production = {
      ...stub,
      title: row.title,
      year: row.year,
      endYear: row.endYear,
      airStatus: "ended",
      kind: row.kind,
      channel: row.channel,
      genres: row.genres,
      summary: row.summary,
      updatedAt: NOW,
    };
    return {
      productions: productions.map((production) =>
        production.id === stub.id ? updated : production
      ),
      production: updated,
    };
  }

  const created: Production = {
    id: stubId,
    title: row.title,
    year: row.year,
    endYear: row.endYear,
    airStatus: "ended",
    kind: row.kind,
    channel: row.channel,
    genres: row.genres,
    summary: row.summary,
    sourceNote: "ויקיפדיה",
    sourceUrl: PEOPLE.find((person) => person.id === row.personId)?.wikipediaUrl,
    imageUrl: portrait(row.title, undefined, { kind: "film", productionId: stubId }),
    createdAt: NOW,
    updatedAt: NOW,
  };
  return { productions: [...productions, created], production: created };
}

function upsertRole(credits: Credit[], credit: Credit, droppedId?: string): Credit[] {
  const moved = droppedId
    ? credits.map((row) =>
        row.productionId === droppedId ? { ...row, productionId: credit.productionId } : row
      )
    : credits;
  const index = moved.findIndex(
    (row) =>
      row.personId === credit.personId &&
      row.productionId === credit.productionId &&
      row.role === credit.role
  );
  const next = [...moved];
  if (index < 0) next.push(credit);
  else {
    const current = moved[index];
    next[index] = {
      ...current,
      characterName: credit.characterName,
      heading: credit.heading || current.heading,
      billingOrder: current.billingOrder ?? credit.billingOrder,
    };
  }
  let named = false;
  return next.filter((row) => {
    const same =
      row.personId === credit.personId &&
      row.productionId === credit.productionId &&
      row.role === credit.role;
    if (!same) return true;
    if (row.characterName?.trim()) {
      if (named) return false;
      named = true;
      return true;
    }
    return false;
  });
}

function applyNamedRoles(data: ArchiveData): ArchiveData {
  let people = data.people;
  for (const spec of PEOPLE) people = ensurePerson(people, spec);
  const personIdBySpec = new Map(
    PEOPLE.map((spec) => [spec.id, findPerson(people, spec)?.id || spec.id])
  );

  let productions = data.productions;
  let credits = data.credits;
  for (const row of ROLES) {
    const before = productions;
    const resolved = resolveProduction(productions, row);
    productions = resolved.productions;
    const dropped = before.find(
      (production) =>
        production.id === stubIdFor(row.title) && production.id !== resolved.production.id
    );
    const personId = personIdBySpec.get(row.personId) || row.personId;
    credits = upsertRole(
      credits,
      {
        personId,
        productionId: resolved.production.id,
        role: row.role,
        heading: row.heading,
        characterName: row.characterName,
        billingOrder: 0,
      },
      dropped?.id
    );
  }

  return { ...data, people, productions, credits };
}

/** טלפנולי, שגית המושגית, והתפקידים הנקובים של האישים שאושרו באותה קבוצה. */
export function applyCatalogFixes(data: ArchiveData): ArchiveData {
  return applyIshimHopCast(
    applyIshimJungleBook(
      applyIshimMagicRoundabout(applyNamedRoles(applyShagit(applyTelepenoli(data))))
    )
  );
}
