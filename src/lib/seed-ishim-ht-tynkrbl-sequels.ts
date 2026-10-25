import { canonicalPersonName } from "./aliases";
import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-10-25T00:00:00.000Z";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type CreditRow = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

type FilmSpec = {
  id: string;
  title: string;
  year: number;
  originalTitle: string;
  summary: string;
  genres: string[];
  runtimeMinutes: number;
  sourceUrl: string;
  seeAlso: string;
  credits: CreditRow[];
};

const FILMS: FilmSpec[] = [
  {
    id: "ht-tynkrbl-vhavtsr-hbvd",
    title: "טינקרבל והאוצר האבוד",
    year: 2009,
    originalTitle: "Tinker Bell and the Lost Treasure",
    summary:
      "טינקרבל יוצאת צפונה מארץ לעולם לא עם חברה טרנס, כדי למצוא דרך להחיות את עץ אבקת הפיות כפיצוי לתאונה שהיא עשתה",
    genres: [
      "אנימציה",
      "ילדים",
      "מדובב - זר",
      "מדע בדיוני",
      "מוזיקלי",
      "נוער",
      "פנטזיה",
      "קומדיה",
    ],
    runtimeMinutes: 81,
    sourceUrl:
      "https://sites.google.com/view/hoptamir/%D7%98%D7%99%D7%A0%D7%A7%D7%A8%D7%91%D7%9C-%D7%95%D7%94%D7%90%D7%95%D7%A6%D7%A8-%D7%94%D7%90%D7%91%D7%95%D7%93-2009-%D7%90%D7%99%D7%A9%D7%99%D7%9D",
    seeAlso: "ראה גם טינקרבל",
    credits: [
      { personName: "אפרת ענבל", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "שירי רוזנברג", role: "producer", heading: "הפקת דיבוב" },
      { personName: "מירב פלדמן", role: "dubber", heading: "מדבבים", character: "טינקרבל" },
      { personName: "לירון לב", role: "dubber", heading: "מדבבים", character: "טרנס" },
      { personName: "יעל עמית", role: "dubber", heading: "מדבבים", character: "המלכה קלריון" },
      { personName: "שרית וינו אלעד", role: "dubber", heading: "מדבבים", character: "הפיה מרי" },
      { personName: "לורן סביר", role: "dubber", heading: "מדבבים", character: "סילברמיסט" },
      { personName: "עדי קוזלובסקי", role: "dubber", heading: "מדבבים", character: "אירידסה" },
      { personName: "סיון שביט", role: "dubber", heading: "מדבבים", character: "רוזטה" },
      { personName: "מיכל רשף", role: "dubber", heading: "מדבבים", character: "פוון" },
      { personName: "מולי שולמן", role: "dubber", heading: "מדבבים", character: "בובל" },
      {
        personName: "שמחה ברבירו",
        role: "dubber",
        heading: "מדבבים",
        character: "קלאנק / שר הסתיו",
      },
      { personName: "הדר שחף-מעיין", role: "dubber", heading: "מדבבים", character: "ויולה" },
      { personName: "דקלה הדר", role: "dubber", heading: "מדבבים", character: "ליריה / פיה" },
      { personName: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "טרול קטן / סטון" },
      { personName: "נבו קמחי", role: "dubber", heading: "מדבבים", character: "טרול גדול" },
      { personName: "אמנון וולף", role: "dubber", heading: "מדבבים", character: "הפיה גארי" },
      { personName: "יורם יוספסברג", role: "dubber", heading: "מדבבים", character: "ינשוף / פיה" },
      { personName: "דן קיזלר", role: "dubber", heading: "מדבבים", character: "פיה" },
      { personName: "גילן שחף", role: "dubber", heading: "מדבבים", character: "פיה" },
      { personName: "יעל פרימר", role: "dubber", heading: "מדבבים", character: "קריינית" },
      { personName: "שרון עזריה", role: "singer", heading: "מוזיקה", character: "שירה" },
      { personName: "הדר שחף-מעיין", role: "singer", heading: "מוזיקה", character: "מקהלה" },
      { personName: "מיכל רשף", role: "singer", heading: "מוזיקה", character: "מקהלה" },
      { personName: "עדי רז", role: "singer", heading: "מוזיקה", character: "מקהלה" },
      { personName: "מיכאל עינב", role: "singer", heading: "מוזיקה", character: "מקהלה" },
      { personName: "בבת מרום", role: "singer", heading: "מוזיקה", character: "מקהלה" },
      { personName: "אפרת כרמוש", role: "singer", heading: "מוזיקה", character: "מקהלה" },
      { personName: "שרון כהן", role: "singer", heading: "מוזיקה", character: "ניהול מוזיקלי" },
      { personName: "עדי כהן", role: "singer", heading: "מוזיקה", character: "ניהול מוזיקלי" },
    ],
  },
  {
    id: "ht-tynkrbl-vhsvd-hksvm",
    title: "טינקרבל והסוד הקסום",
    year: 2010,
    originalTitle: "Tinker Bell and the Great Fairy Rescue",
    summary:
      "טינקרבל משתפת פעולה עם יריבתה וידיה, על מנת לשמור בסוד את קיומן של הפיות מפני בני האדם",
    genres: [
      "אנימציה",
      "הרפתקאות",
      "ילדים",
      "מדובב - זר",
      "מדע בדיוני",
      "מוזיקלי",
      "פנטזיה",
    ],
    runtimeMinutes: 75,
    sourceUrl:
      "https://sites.google.com/view/hoptamir/%D7%98%D7%99%D7%A0%D7%A7%D7%A8%D7%91%D7%9C-%D7%95%D7%94%D7%A1%D7%95%D7%93-%D7%94%D7%A7%D7%A1%D7%95%D7%9D-2010-%D7%90%D7%99%D7%A9%D7%99%D7%9D",
    seeAlso: "ראה גם טינקרבל והאוצר האבוד",
    credits: [
      { personName: "אפרת ענבל", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "שירי רוזנברג", role: "producer", heading: "הפקת דיבוב" },
      { personName: "מירב פלדמן", role: "dubber", heading: "מדבבים", character: "טינקרבל" },
      { personName: "שמרית לוסטיג", role: "dubber", heading: "מדבבים", character: "וידיה" },
      { personName: "לורן סביר", role: "dubber", heading: "מדבבים", character: "סילברמיסט" },
      { personName: "עדי קוזלובסקי", role: "dubber", heading: "מדבבים", character: "אירידסה" },
      { personName: "סיון שביט", role: "dubber", heading: "מדבבים", character: "רוזטה" },
      { personName: "מיכל רשף", role: "dubber", heading: "מדבבים", character: "פוון" },
      { personName: "מולי שולמן", role: "dubber", heading: "מדבבים", character: "בובל" },
      { personName: "שמחה ברבירו", role: "dubber", heading: "מדבבים", character: "קלאנק / נהג" },
      { personName: "לירון לב", role: "dubber", heading: "מדבבים", character: "טרנס" },
      { personName: "נועה פלדמן", role: "dubber", heading: "מדבבים", character: "ליזי גריפיטס" },
      { personName: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "ד\"ר גריפיטס" },
      {
        personName: "הדר שחף-מעיין",
        role: "dubber",
        heading: "מדבבים",
        character: "גברת פרקינס / קולות רקע",
      },
      { personName: "יעל פרימר", role: "dubber", heading: "מדבבים", character: "קריינית" },
      { personName: "יהונתן מגון", role: "dubber", heading: "מדבבים", character: "פיה" },
      { personName: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
      { personName: "לני כהן", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
      { personName: "רונה בקרמן", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
      { personName: "תדהר יששכר", role: "singer", heading: "מוזיקה", character: "שירה" },
      { personName: "הילה זיתון", role: "singer", heading: "מוזיקה", character: "שירה" },
      { personName: "שרון כהן", role: "singer", heading: "מוזיקה", character: "ניהול מוזיקלי" },
    ],
  },
];

function normTitle(title: string): string {
  return title.replace(/\s*\(\s*\d{4}\s*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "film" ? ["film"] : [activity, "film"];
}

function stubPerson(name: string, role: CreditRole, film: FilmSpec): Person {
  const canonical = canonicalPersonName(name);
  return {
    id: `ht-${slugify(canonical) || "person"}`,
    name: canonical,
    nicknames: [],
    bio: `מדבב/ת ועורך/ת מדיה — ערך מתוך ארכיון ערוץ הופ תמיר («${film.title}», ${film.year}).`,
    tags: ["דיבוב", "הופ תמיר"],
    activities: activitiesFor(role),
    sourceNote: SOURCE_NOTE,
    sourceUrl: film.sourceUrl,
    imageUrl: portrait(canonical),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function resolvePersonId(
  name: string,
  role: CreditRole,
  film: FilmSpec,
  people: Person[],
  byName: Map<string, Person>,
  byId: Map<string, Person>
): string {
  const existing = byName.get(normalizePersonName(name));
  if (existing) return existing.id;

  let person = stubPerson(name, role, film);
  if (byId.has(person.id) && byId.get(person.id)!.name !== person.name) {
    person = { ...person, id: `${person.id}-${slugify(person.name).slice(0, 8)}` };
  }
  if (!byId.has(person.id)) {
    people.push(person);
    byId.set(person.id, person);
    byName.set(normalizePersonName(person.name), person);
  }
  return person.id;
}

function isThisFilm(production: Production, film: FilmSpec): boolean {
  if (production.id === film.id) return true;
  if (production.year !== film.year) return false;
  return normTitle(production.title) === film.title;
}

function applyFilm(data: ArchiveData, film: FilmSpec): ArchiveData {
  const productions = [...data.productions];
  let imageUrl: string | undefined;
  let createdAt: string | undefined;
  for (const production of productions) {
    if (!isThisFilm(production, film)) continue;
    if (production.imageUrl) imageUrl = imageUrl || production.imageUrl;
    if (production.createdAt) createdAt = createdAt || production.createdAt;
  }

  const keptProductions = productions.filter((production) => !isThisFilm(production, film));
  const production: Production = {
    id: film.id,
    title: film.title,
    originalTitle: film.originalTitle,
    year: film.year,
    kind: "film_dubbed_foreign",
    summary: film.summary,
    genres: film.genres,
    runtimeMinutes: film.runtimeMinutes,
    ishimNotes: [{ heading: "קישורים", items: [film.seeAlso] }],
    ishimClassic: true,
    imageUrl: imageUrl || portrait(film.title, film.originalTitle, { kind: "film" }),
    sourceNote: SOURCE_NOTE,
    sourceUrl: film.sourceUrl,
    createdAt: createdAt || NOW,
    updatedAt: NOW,
  };
  keptProductions.push(production);

  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map(
    people.map((person) => [normalizePersonName(person.name), person] as const)
  );
  for (const person of people) {
    for (const nick of person.nicknames || []) {
      const key = normalizePersonName(nick);
      if (!key || byName.has(key)) continue;
      byName.set(key, person);
    }
  }

  const credits: Credit[] = assignBillingOrders(
    film.credits.map((row) => ({
      personId: resolvePersonId(row.personName, row.role, film, people, byName, byId),
      productionId: film.id,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: film.year,
    }))
  );

  const replacedIds = new Set(
    productions.filter((item) => isThisFilm(item, film)).map((item) => item.id)
  );

  return {
    ...data,
    people,
    productions: keptProductions,
    credits: [
      ...data.credits.filter((credit) => !replacedIds.has(credit.productionId)),
      ...credits,
    ],
  };
}

/** טינקרבל והאוצר האבוד (2009) וטינקרבל והסוד הקסום (2010) — הופ תמיר. */
export function applyIshimTinkerBellSequels(data: ArchiveData): ArchiveData {
  return FILMS.reduce((archive, film) => applyFilm(archive, film), data);
}
