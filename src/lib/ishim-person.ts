import {
  CREDIT_ROLE_LABELS,
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
  "יוצר",
  "שחקן",
  "בתפקיד עצמו",
  "במאי",
  "במאי דיבוב",
  "מפיק דיבוב",
  "מדבב",
  "מנחה",
  "הרכבים",
  "מחזמר",
  "מוזיקה",
  "צלם",
];

export function ishimRoleHeading(role: CreditRole): string {
  return ISHIM_ROLE_HEADING[role] || CREDIT_ROLE_LABELS[role];
}
