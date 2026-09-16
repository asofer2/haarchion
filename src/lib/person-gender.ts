import type { Credit, CreditRole, Person } from "./types";
import { creditHeading, ishimRoleHeading } from "./ishim-person";

export type PersonGender = "male" | "female";

/** שמות פרטיים נפוצים — נקבה */
const FEMALE_FIRST_NAMES = new Set(
  [
    "אביגיל",
    "אביטל",
    "אגם",
    "אדווה",
    "אדל",
    "אהובה",
    "אודיה",
    "אולגה",
    "אופירה",
    "אור",
    "אורה",
    "אורית",
    "אורלי",
    "אורנה",
    "אורנית",
    "אורטל",
    "איילה",
    "אילנה",
    "אילנית",
    "איריס",
    "אירנה",
    "אלה",
    "אלנה",
    "אמה",
    "אמילי",
    "אסתר",
    "אפרת",
    "אפי",
    "ארנה",
    "בארי",
    "בתיה",
    "גאולה",
    "גולדה",
    "ג'וי",
    "ג'יל",
    "גילה",
    "גלית",
    "דבי",
    "דבורה",
    "דורית",
    "דינה",
    "דנה",
    "דניאלה",
    "דפנה",
    "הגר",
    "הדס",
    "הדסה",
    "הודיה",
    "הילה",
    "הלן",
    "הלנה",
    "הניה",
    "זיוה",
    "חביבה",
    "חוה",
    "חיה",
    "חן",
    "חנה",
    "חני",
    "חסיה",
    "טובה",
    "טלי",
    "טליה",
    "תמר",
    "תמרה",
    "תמי",
    "יאנה",
    "יעל",
    "יפה",
    "יפעת",
    "ירדן",
    "כרמל",
    "לאה",
    "לבנה",
    "ליאור",
    "ליאת",
    "ליהי",
    "לילי",
    "ליליאן",
    "לימור",
    "לינוי",
    "לנה",
    "מאיה",
    "מיכל",
    "מיכל",
    "מירי",
    "מלכה",
    "מורן",
    "מוריה",
    "מיה",
    "נועה",
    "נוגה",
    "נורית",
    "נחמה",
    "נילי",
    "נטע",
    "נעמי",
    "סביון",
    "סיוון",
    "סיגל",
    "ספיר",
    "עדה",
    "עדי",
    "עדינה",
    "עטרה",
    "עידית",
    "עינת",
    "עליזה",
    "ענת",
    "עפרה",
    "פנינה",
    "פזית",
    "צילה",
    "ציונה",
    "רבקה",
    "רויטל",
  "רוני",
  "רות",
  "רותי",
  "רחל",
  "רמה",
  "רקפת",
  "שושנה",
  "שולמית",
  "שירה",
  "שירלי",
  "שלומית",
  "שרה",
  "שקד",
].map((n) => n.replace(/־/g, "-"))
);

/** שמות פרטיים נפוצים — זכר (כולל חריגים שמסתיימים ב־ה) */
const MALE_FIRST_NAMES = new Set(
  [
    "אבי",
    "אביב",
    "אברהם",
    "אהוד",
    "אהרן",
    "אוהד",
    "אורי",
    "אורן",
    "אייל",
    "אילן",
    "אלי",
    "אליהו",
    "אלון",
    "אמיר",
    "אסף",
    "אריה",
    "אריאל",
    "ארז",
    "אשר",
    "בועז",
    "בני",
    "בנימין",
    "גד",
    "גדי",
    "גל",
    "דוד",
    "דורון",
    "דב",
    "דן",
    "דני",
    "דניאל",
    "דרור",
    "הלל",
    "זאב",
    "חיים",
    "חנן",
    "יהודה",
    "יהונתן",
    "יהושע",
    "יואב",
    "יוסי",
    "יוסף",
    "יורם",
    "יוריק",
    "יעקב",
    "יצחק",
    "ירון",
    "ישעיהו",
    "מוטי",
    "משה",
    "מיכאל",
    "מנחם",
    "מרדכי",
    "נחום",
    "נחמן",
    "ניר",
    "נתן",
    "עמי",
    "עמוס",
    "ערן",
    "עזרא",
    "פיני",
    "צבי",
    "ראובן",
    "רון",
    "רמי",
    "שאול",
    "שלום",
    "שלמה",
    "שמעון",
    "שמואל",
    "תמיר",
  ].map((n) => n.replace(/־/g, "-"))
);

/** מתעלמים מצורות מדבב/ת שחקן/ית בביוס גנריים */
const FEMALE_BIO =
  /(?:^|[^\u0590-\u05FF])(?:היא|הייתה|היתה|נולדה|מדבבת|שחקנית|במאית|מפיקה|תסריטאית|זמרת|בדרנית|קומיקאית|ישראלית)(?:[^\u0590-\u05FF]|$)/;
const MALE_BIO =
  /(?:^|[^\u0590-\u05FF])(?:הוא|היה|נולד(?!ה)|מדבב(?!ת|\/)|שחקן(?!ית|\/)|במאי(?!ת|\/)|מפיק(?!ה|\/)|תסריטאי(?!ת|\/)|זמר(?!ת|\/)|בדרן|קומיקאי|ישראלי(?!ת|\/))(?:[^\u0590-\u05FF]|$)/;

const GENDERED_HEADINGS: Record<
  string,
  { male: string; female: string }
> = {
  מדבב: { male: "מדבב", female: "מדבבת" },
  מדבבת: { male: "מדבב", female: "מדבבת" },
  מדבבים: { male: "מדבב", female: "מדבבת" },
  שחקן: { male: "שחקן", female: "שחקנית" },
  שחקנית: { male: "שחקן", female: "שחקנית" },
  שחקנים: { male: "שחקן", female: "שחקנית" },
  תסריטאי: { male: "תסריטאי", female: "תסריטאית" },
  תסריטאית: { male: "תסריטאי", female: "תסריטאית" },
  תסריט: { male: "תסריטאי", female: "תסריטאית" },
  יוצר: { male: "יוצר", female: "יוצרת" },
  יוצרת: { male: "יוצר", female: "יוצרת" },
  במאי: { male: "במאי", female: "במאית" },
  במאית: { male: "במאי", female: "במאית" },
  בימוי: { male: "במאי", female: "במאית" },
  "במאי דיבוב": { male: "במאי דיבוב", female: "במאית דיבוב" },
  "במאית דיבוב": { male: "במאי דיבוב", female: "במאית דיבוב" },
  "בימוי דיבוב": { male: "במאי דיבוב", female: "במאית דיבוב" },
  מפיק: { male: "מפיק", female: "מפיקה" },
  מפיקה: { male: "מפיק", female: "מפיקה" },
  "מפיק דיבוב": { male: "מפיק דיבוב", female: "מפיקת דיבוב" },
  "מפיקת דיבוב": { male: "מפיק דיבוב", female: "מפיקת דיבוב" },
  "הפקת דיבוב": { male: "מפיק דיבוב", female: "מפיקת דיבוב" },
  מנחה: { male: "מנחה", female: "מנחה" },
  צלם: { male: "צלם", female: "צלמת" },
  צלמת: { male: "צלם", female: "צלמת" },
  צילום: { male: "צלם", female: "צלמת" },
  זמר: { male: "זמר", female: "זמרת" },
  זמרת: { male: "זמר", female: "זמרת" },
  מלחין: { male: "מלחין", female: "מלחינה" },
  מלחינה: { male: "מלחין", female: "מלחינה" },
};

const ROLE_GENDER_FALLBACK: Partial<
  Record<CreditRole, { male: string; female: string }>
> = {
  dubber: { male: "מדבב", female: "מדבבת" },
  actor: { male: "שחקן", female: "שחקנית" },
  writer: { male: "תסריטאי", female: "תסריטאית" },
  director: { male: "במאי", female: "במאית" },
  dub_director: { male: "במאי דיבוב", female: "במאית דיבוב" },
  producer: { male: "מפיק דיבוב", female: "מפיקת דיבוב" },
  cinematographer: { male: "צלם", female: "צלמת" },
  singer: { male: "זמר", female: "זמרת" },
  composer: { male: "מלחין", female: "מלחינה" },
};

function firstHebrewName(fullName: string): string {
  const cleaned = fullName
    .replace(/\(.*?\)/g, " ")
    .replace(/־/g, "-")
    .trim();
  const token = cleaned.split(/\s+/)[0] || "";
  return token.replace(/^["'«]|["'»]$/g, "");
}

/** מגדר מפורש, אחרת הסקה משם / ביוגרפיה */
export function inferPersonGender(
  person: Pick<Person, "name" | "bio" | "gender" | "tags" | "nicknames">
): PersonGender | undefined {
  if (person.gender === "male" || person.gender === "female") {
    return person.gender;
  }

  const bio = person.bio || "";
  const femaleBio = FEMALE_BIO.test(bio);
  const maleBio = MALE_BIO.test(bio);
  if (femaleBio && !maleBio) return "female";
  if (maleBio && !femaleBio) return "male";

  const tags = (person.tags || []).join(" ");
  if (/מדבבת|שחקנית|במאית|מפיקה/.test(tags) && !/מדבב(?!ת)|שחקן(?!ית)/.test(tags)) {
    return "female";
  }

  const first = firstHebrewName(person.name);
  if (FEMALE_FIRST_NAMES.has(first)) return "female";
  if (MALE_FIRST_NAMES.has(first)) return "male";

  for (const nick of person.nicknames || []) {
    const n = firstHebrewName(nick);
    if (FEMALE_FIRST_NAMES.has(n)) return "female";
    if (MALE_FIRST_NAMES.has(n)) return "male";
  }

  // סיומות עבריות טיפוסיות לנקבה (עם חריגי זכר ידועים)
  if (
    /(?:ה|ת|ית)$/.test(first) &&
    !MALE_FIRST_NAMES.has(first) &&
    !/^(משה|יהודה|יהושע|אריה|מנשה|שלמה)$/.test(first)
  ) {
    return "female";
  }

  return undefined;
}

/** כותרת קרדיט בדף אישיות — צורות זכר/נקבה */
export function personCreditHeading(
  credit: Pick<Credit, "role" | "heading">,
  gender?: PersonGender
): string {
  const raw = creditHeading(credit);
  if (!gender) return raw;

  const mapped = GENDERED_HEADINGS[raw];
  if (mapped) return gender === "female" ? mapped.female : mapped.male;

  if (!credit.heading?.trim()) {
    const byRole = ROLE_GENDER_FALLBACK[credit.role];
    if (byRole) return gender === "female" ? byRole.female : byRole.male;
  }
  return raw;
}

export function genderedRoleHeading(
  role: CreditRole,
  gender?: PersonGender
): string {
  const byRole = ROLE_GENDER_FALLBACK[role];
  if (byRole && gender) {
    return gender === "female" ? byRole.female : byRole.male;
  }
  return ishimRoleHeading(role);
}

/** תווית פעילות מגדּרית במפתחות בדף אישיות */
export function genderedActivityLabel(
  activity: "acting" | "dubbing",
  gender?: PersonGender
): string {
  if (activity === "acting") return gender === "female" ? "שחקנית" : "שחקן";
  return gender === "female" ? "מדבבת" : "מדבב";
}

/** תוויות עובדות בדף אישיות */
export function genderedBornLabel(gender?: PersonGender): string {
  return gender === "female" ? "נולדה ב:" : "נולד ב:";
}

export function genderedBornAsLabel(gender?: PersonGender): string {
  return gender === "female" ? "נולדה בשם:" : "נולד בשם:";
}

export function genderedDiedLabel(gender?: PersonGender): string {
  return gender === "female" ? "נפטרה ב:" : "נפטר ב:";
}

export function genderedBornInline(gender?: PersonGender): string {
  return gender === "female" ? "נולדה ב-" : "נולד ב-";
}

export function genderedDiedInline(gender?: PersonGender): string {
  return gender === "female" ? "נפטרה ב-" : "נפטר ב-";
}
