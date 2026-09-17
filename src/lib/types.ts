export type CreditRole =
  | "actor"
  | "director"
  | "writer"
  | "dubber"
  | "dub_director"
  | "singer"
  | "musical_performer"
  | "host"
  | "producer"
  | "composer"
  | "cinematographer";

export const CREDIT_ROLE_LABELS: Record<CreditRole, string> = {
  actor: "שחקן/ית",
  director: "במאי/ת",
  writer: "תסריטאי/ת",
  dubber: "מדבב/ת",
  dub_director: "במאי/ת דיבוב",
  singer: "זמר/ת",
  musical_performer: "מחזמר / במה",
  host: "מנחה",
  producer: "מפיק/ה",
  composer: "מלחין/ה",
  cinematographer: "צלם/ת",
};

/** קטגוריות פעילות של אישיות */
export type ActivityCategory =
  | "acting"
  | "dubbing"
  | "film"
  | "series"
  | "musical"
  | "stage"
  | "cassette"
  | "performance"
  | "festival"
  | "radio"
  | "hosting"
  | "game";

export const ACTIVITY_LABELS: Record<ActivityCategory, string> = {
  acting: "שחקן",
  dubbing: "מדבב",
  film: "סרטים",
  series: "סדרות",
  musical: "מחזמר",
  stage: "תיאטרון / במה",
  cassette: "קלטות",
  performance: "הופעות",
  festival: "פסטיגל / מופעי ילדים",
  radio: "רדיו",
  hosting: "הנחיה",
  game: "משחק מחשב",
};

/** מילות חיפוש נוספות לכל קטגוריה (למשל דיבוב ↔ מדבב) */
export const ACTIVITY_SEARCH_ALIASES: Record<ActivityCategory, string[]> = {
  acting: ["שחקן", "שחקנית", "שחקנים", "משחק"],
  dubbing: ["מדבב", "מדבבת", "מדבבים", "דיבוב", "דיבוב עברי"],
  film: ["סרטים", "סרט", "קולנוע"],
  series: ["סדרות", "סדרה"],
  musical: ["מחזמר", "מחזמרים"],
  stage: ["תיאטרון", "במה", "הצגות"],
  cassette: ["קלטות", "קלטת"],
  performance: ["הופעות", "הופעה"],
  festival: ["פסטיגל", "מופעי ילדים"],
  radio: ["רדיו"],
  hosting: ["הנחיה", "מנחה", "מנחים"],
  game: ["משחק מחשב", "משחקי מחשב", "משחקים"],
};

export const ACTIVITY_LIST = Object.keys(ACTIVITY_LABELS) as ActivityCategory[];

export type ProductionKind =
  | "website"
  | "person"
  | "ensemble"
  | "game_israeli"
  | "game_dubbed_foreign"
  | "series_israeli_foreign_dubbed"
  | "tv_series"
  | "film_dubbed_foreign"
  | "film_student"
  | "film_cinema"
  | "film_tv"
  | "series_dubbed_foreign"
  | "cassette_kids"
  | "tv_program"
  | "radio_program"
  /** סוגים ישנים — נשמרים לתאימות עם נתוני seed */
  | "film"
  | "series"
  | "miniseries"
  | "documentary"
  | "musical"
  | "cassette"
  | "stage"
  | "performance"
  | "festival"
  | "radio";

export const PRODUCTION_KIND_LABELS: Record<ProductionKind, string> = {
  website: "אתר אינטרנט",
  person: "אישיות",
  ensemble: "הרכב",
  game_israeli: "משחק מחשב ישראלי",
  game_dubbed_foreign: "משחק מחשב מדובב זר",
  series_israeli_foreign_dubbed: "סדרה ישראלית עם קטעים זרים מדובבים",
  tv_series: "סדרת טלוויזיה",
  film_dubbed_foreign: "סרט זר מדובב",
  film_student: "סרט סטודנטים",
  film_cinema: "סרט קולנוע",
  film_tv: "סרט טלוויזיה",
  series_dubbed_foreign: "סדרה זרה מדובבת",
  cassette_kids: "קלטת ילדים",
  tv_program: "תוכנית טלוויזיה",
  radio_program: "תוכנית רדיו",
  film: "סרט",
  series: "סדרה",
  miniseries: "מיני־סדרה",
  documentary: "דוקומנטרי",
  musical: "מחזמר",
  cassette: "קלטת",
  stage: "הצגת תיאטרון",
  performance: "הופעה",
  festival: "פסטיגל / מופע ילדים",
  radio: "רדיו",
};

/** אפשרויות בשדה «סוג» בטופס הוספה/עריכה */
export const PRODUCTION_KIND_FORM_OPTIONS: {
  value: ProductionKind;
  label: string;
}[] = [
  { value: "tv_series", label: "סדרת טלוויזיה" },
  { value: "tv_program", label: "תוכנית טלוויזיה" },
  { value: "film_tv", label: "סרט טלוויזיה" },
  { value: "film_cinema", label: "סרט קולנוע" },
  { value: "radio_program", label: "תוכנית רדיו" },
  { value: "film_student", label: "סרט סטודנטים" },
  { value: "cassette_kids", label: "קלטת ילדים" },
  { value: "ensemble", label: "הרכב" },
  { value: "series_dubbed_foreign", label: "סדרה זרה מדובבת" },
  { value: "film_dubbed_foreign", label: "סרט זר מדובב" },
  {
    value: "series_israeli_foreign_dubbed",
    label: "סדרה ישראלית עם קטעים זרים מדובבים",
  },
  { value: "website", label: "אתר אינטרנט" },
  { value: "person", label: "אישיות" },
  { value: "game_israeli", label: "משחק מחשב ישראלי" },
  { value: "game_dubbed_foreign", label: "משחק מחשב מדובב זר" },
];

export function productionKindLabel(kind: ProductionKind | string): string {
  return (
    PRODUCTION_KIND_LABELS[kind as ProductionKind] || String(kind)
  );
}

/** סטטוס שידור / הפקה: הסתיים | משודר כעת | עתידי */
export type AirStatus = "ended" | "airing" | "upcoming";

export const AIR_STATUS_LABELS: Record<AirStatus, string> = {
  ended: "הסתיים",
  airing: "משודר כעת",
  upcoming: "עתידי",
};

export const AIR_STATUS_OPTIONS: { value: AirStatus; label: string }[] = [
  { value: "ended", label: AIR_STATUS_LABELS.ended },
  { value: "airing", label: AIR_STATUS_LABELS.airing },
  { value: "upcoming", label: AIR_STATUS_LABELS.upcoming },
];

/**
 * היוריסטיקה כשאין airStatus מפורש:
 * - year > השנה הנוכחית → upcoming
 * - endYear מוגדר ו־endYear < השנה הנוכחית → ended
 * - endYear מוגדר ו־endYear ≥ השנה הנוכחית → airing
 * - בלי endYear ו־year < השנה הנוכחית → ended
 * - בלי endYear ו־year === השנה הנוכחית → airing
 * ערך מפורש ב־airStatus תמיד גובר.
 */
export function inferAirStatus(
  production: { year: number; endYear?: number },
  nowYear = new Date().getFullYear()
): AirStatus {
  const { year, endYear } = production;
  if (year > nowYear) return "upcoming";
  if (endYear != null) {
    if (endYear < nowYear) return "ended";
    return "airing";
  }
  if (year < nowYear) return "ended";
  return "airing";
}

export function resolveAirStatus(
  production: {
    year: number;
    endYear?: number;
    airStatus?: AirStatus;
  },
  nowYear = new Date().getFullYear()
): AirStatus {
  const explicit = production.airStatus;
  if (
    explicit === "ended" ||
    explicit === "airing" ||
    explicit === "upcoming"
  ) {
    return explicit;
  }
  return inferAirStatus(production, nowYear);
}

export function airStatusLabel(status: AirStatus | string): string {
  return AIR_STATUS_LABELS[status as AirStatus] || String(status);
}

/** הפקות עתידיות (airStatus / היוריסטיקת שנים), ממוינות לפי שנה. */
export function upcomingProductions<T extends { year: number; endYear?: number; airStatus?: AirStatus; title: string }>(
  productions: T[],
  limit = 12
): T[] {
  return productions
    .filter((p) => resolveAirStatus(p) === "upcoming")
    .sort(
      (a, b) =>
        a.year - b.year || a.title.localeCompare(b.title, "he")
    )
    .slice(0, limit);
}

export interface Credit {
  personId: string;
  productionId: string;
  role: CreditRole;
  characterName?: string;
  billingOrder?: number;
  /** שנת הקרדיט בדף אישים (אם שונה משנת ההפקה) */
  year?: number;
  /** סוף טווח שנים לקרדיט (למשל 1989–1990 בדף הפקה קלאסי) */
  endYear?: number;
  /** כותרת מקורית מדף אישים (יוצר / בתפקיד עצמו / הרכבים…) */
  heading?: string;
}

export interface DiscographyItem {
  title: string;
  year?: number;
  /** אלבום | קלטת | סינגל | אוסף | אחר */
  kind?: string;
  note?: string;
}

export interface Person {
  id: string;
  name: string;
  nameOriginal?: string;
  nicknames: string[];
  birthDate?: string;
  deathDate?: string;
  bio: string;
  imageUrl?: string;
  tags: string[];
  /** תחומי פעילות — מוצגים כקטגוריות בדף האישיות */
  activities: ActivityCategory[];
  /** מגדר להצגת כותרות (מדבב/מדבבת, שחקן/שחקנית). אם חסר — מוסק משם/ביו */
  gender?: "male" | "female";
  /** דיסקוגרפיה מוויקיפדיה / ויקידאטה */
  discography?: DiscographyItem[];
  /** קישור לעמוד ויקיפדיה בעברית */
  wikipediaUrl?: string;
  /** כותבי הערך (ממאגר ישן / ייבוא) */
  entryAuthors?: string[];
  /** הערות מדף אישים: קשר משפחתי, צבא, פרסים… */
  ishimNotes?: { heading: string; items: string[] }[];
  /** נתונים מיובאים מאתר אישים הקלאסי */
  ishimClassic?: boolean;
  /** מקור המידע — למשל «ויקיפדיה», «ערוץ הופ תמיר» */
  sourceNote?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Production {
  id: string;
  title: string;
  originalTitle?: string;
  year: number;
  endYear?: number;
  /**
   * סטטוס שידור מפורש. אם חסר — נקבע לפי year/endYear (ראו resolveAirStatus).
   */
  airStatus?: AirStatus;
  kind: ProductionKind;
  summary: string;
  genres: string[];
  channel?: string;
  /** חברת הפקה / אולפן מקורי */
  studio?: string;
  /** אולפן הדיבוב העברי (לסרטים/סדרות מדובבים) */
  dubbingStudio?: string;
  /** אורך פרק בדקות (מאתר אישים) */
  runtimeMinutes?: number;
  /** מספר פרקים (מאתר אישים) */
  episodeCount?: number;
  /** מפתחות מאתר אישים (נפרד מז'אנרים) */
  ishimKeys?: string[];
  /** טריוויה / קישורים / כללי — מאתר אישים */
  ishimNotes?: { heading: string; items: string[] }[];
  /** ערך מיובא מאתר אישים הקלאסי */
  ishimClassic?: boolean;
  imageUrl?: string;
  /** כותבי הערך (ממאגר ישן / ייבוא) */
  entryAuthors?: string[];
  /** מקור המידע — למשל «ויקיפדיה», «ערוץ הופ תמיר» */
  sourceNote?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Contribution {
  id: string;
  userId: string;
  userName?: string;
  entityType: "person" | "production";
  entityId: string;
  entityTitle: string;
  action: "create" | "update";
  at: string;
  /** סימוכין — מקור העדכון (URL, ספר, Wayback וכו׳) */
  citation?: string;
  /** @deprecated השתמשו ב־citation; נשמר לתאימות לרשומות ישנות */
  sourceNote?: string;
}

export interface ArchiveData {
  people: Person[];
  productions: Production[];
  credits: Credit[];
  contributions: Contribution[];
}

/** מיפוי תפקיד קרדיט → קטגוריית פעילות להצגה */
export function roleToActivity(role: CreditRole): ActivityCategory {
  switch (role) {
    case "dubber":
    case "dub_director":
      return "dubbing";
    case "musical_performer":
    case "singer":
      return "musical";
    case "host":
      return "hosting";
    case "actor":
      return "acting";
    default:
      return "film";
  }
}

export function kindToActivity(kind: ProductionKind): ActivityCategory {
  switch (kind) {
    case "tv_series":
    case "series_israeli_foreign_dubbed":
    case "series_dubbed_foreign":
    case "tv_program":
    case "series":
    case "miniseries":
      return "series";
    case "film_cinema":
    case "film_tv":
    case "film_dubbed_foreign":
    case "film_student":
    case "game_israeli":
    case "game_dubbed_foreign":
      return "game";
    case "website":
    case "person":
    case "film":
    case "documentary":
      return "film";
    case "ensemble":
    case "performance":
      return "performance";
    case "musical":
      return "musical";
    case "cassette_kids":
    case "cassette":
      return "cassette";
    case "stage":
      return "stage";
    case "festival":
      return "festival";
    case "radio_program":
    case "radio":
      return "radio";
    default:
      return "film";
  }
}

/** תפקיד ברירת מחדל כשמוסיפים הפקה תחת קטגוריה בטופס אישיות */
export function defaultCreditRole(activity: ActivityCategory): CreditRole {
  switch (activity) {
    case "dubbing":
      return "dubber";
    case "musical":
      return "musical_performer";
    case "hosting":
      return "host";
    case "cassette":
      return "dubber";
    case "game":
      return "dubber";
    case "festival":
    case "performance":
      return "musical_performer";
    case "radio":
      return "singer";
    default:
      return "actor";
  }
}

/** סוג הפקה ברירת מחדל לפי קטגוריית האישיות */
export function defaultProductionKind(activity: ActivityCategory): ProductionKind {
  switch (activity) {
    case "film":
      return "film_cinema";
    case "series":
    case "acting":
    case "dubbing":
      return "tv_series";
    case "musical":
      return "musical";
    case "stage":
      return "stage";
    case "cassette":
      return "cassette_kids";
    case "performance":
      return "performance";
    case "festival":
      return "festival";
    case "radio":
      return "radio_program";
    case "hosting":
      return "tv_program";
    case "game":
      return "game_israeli";
    default:
      return "tv_series";
  }
}

/** קטגוריה ראשית לשיוך קרדיט קיים לטופס עריכה */
export function primaryActivityForCredit(
  role: CreditRole,
  kind: ProductionKind,
  preferred: ActivityCategory[] = []
): ActivityCategory {
  const roleAct = roleToActivity(role);
  if (!preferred.length || preferred.includes(roleAct)) return roleAct;
  const kindAct = kindToActivity(kind);
  if (preferred.includes(kindAct)) return kindAct;
  return roleAct;
}
