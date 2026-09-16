import {
  CREDIT_ROLE_LABELS,
  type Credit,
  type CreditRole,
} from "@/lib/types";

/** כותרות תפקיד כמו באתר אישים הקלאסי */
export const ISHIM_ROLE_HEADING: Record<CreditRole, string> = {
  writer: "תסריטאי",
  actor: "שחקן",
  director: "במאי",
  dub_director: "במאי דיבוב",
  producer: "מפיק דיבוב",
  dubber: "מדבב",
  host: "מנחה",
  musical_performer: "מחזמר",
  singer: "מוזיקה",
  composer: "מוזיקה",
  cinematographer: "צלם",
};

export const ISHIM_CREDIT_SECTIONS: {
  heading: string;
  roles: CreditRole[];
}[] = [
  { heading: "תסריטאי", roles: ["writer"] },
  { heading: "שחקן", roles: ["actor"] },
  { heading: "במאי", roles: ["director"] },
  { heading: "במאי דיבוב", roles: ["dub_director"] },
  { heading: "מפיק דיבוב", roles: ["producer"] },
  { heading: "מדבב", roles: ["dubber"] },
  { heading: "מנחה", roles: ["host"] },
  { heading: "מחזמר", roles: ["musical_performer"] },
  { heading: "מוזיקה", roles: ["singer", "composer"] },
  { heading: "צלם", roles: ["cinematographer"] },
];

export const ISHIM_HEADING_ORDER = [
  "תסריטאי",
  "תסריטאית",
  "תסריט",
  "יוצר",
  "יוצרת",
  "עריכה",
  "בימוי",
  "במאי",
  "במאית",
  "שחקנים",
  "שחקן",
  "שחקנית",
  "שחקנים אורחים",
  "בתפקיד עצמו",
  "בימוי דיבוב",
  "במאי דיבוב",
  "במאית דיבוב",
  "מפיק דיבוב",
  "מפיקה",
  "מפיקת דיבוב",
  "הפקת דיבוב",
  "הפקה",
  "מפיק",
  "תפקידים שונים",
  "מדבבים",
  "מדבב",
  "מדבבת",
  "מנחה",
  "הרכבים",
  "מחזמר",
  "מוזיקה",
  "זמר",
  "זמרת",
  "מלחין",
  "מלחינה",
  "צלם",
  "צלמת",
  "צילום",
];

export function ishimRoleHeading(role: CreditRole): string {
  return ISHIM_ROLE_HEADING[role] || CREDIT_ROLE_LABELS[role];
}

export function creditHeading(credit: Pick<Credit, "role" | "heading">): string {
  return credit.heading?.trim() || ishimRoleHeading(credit.role);
}

export function headingSortIndex(heading: string): number {
  const idx = ISHIM_HEADING_ORDER.indexOf(heading);
  return idx >= 0 ? idx : ISHIM_HEADING_ORDER.length;
}

/** מפרק שמות דמויות מופרדים ב־/ */
export function splitIshimCharacterLines(characterName?: string): string[] {
  if (!characterName?.trim()) return [];
  return characterName
    .split(/\s*\/\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** מציג דמויות בשורה אחת — «דמות א / דמות ב» */
export function formatIshimCharacters(characterName?: string): string {
  return splitIshimCharacterLines(characterName).join(" / ");
}
