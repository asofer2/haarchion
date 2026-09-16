import { ishimRoleHeading } from "./ishim-person";
import type { CreditRole } from "./types";

export const ISHIM_CLASSIC_SOURCE = "אישים";

/** Wayback snapshot of ishim.co.il used as the classic archive reference */
export const ISHIM_WAYBACK_SNAPSHOT = "20221118120839";

const ISHIM_WAYBACK_BASE = `https://web.archive.org/web/${ISHIM_WAYBACK_SNAPSHOT}/https://www.ishim.co.il`;

export type IshimNote = { heading: string; items: string[] };

type HeadingCredit = {
  role: CreditRole;
  heading?: string;
  character?: string;
  title?: string;
  year?: number;
};

/** כותרת מקטע כמו באתר אישים (תסריטאי / יוצר / בתפקיד עצמו…) */
export function ishimCreditHeading(
  credit: HeadingCredit,
  personName?: string
): string {
  if (credit.heading?.trim()) return credit.heading.trim();

  switch (credit.role) {
    case "host":
      return "בתפקיד עצמו";
    case "dubber":
      return "מדבב";
    case "musical_performer":
      return "הרכבים";
    case "actor":
      return "שחקן";
    case "writer": {
      if (!credit.character?.trim()) {
        const family = personName?.trim().split(/\s+/).pop();
        if (family && credit.title?.includes(family)) return "יוצר";
      }
      return "תסריטאי";
    }
    default:
      return ishimRoleHeading(credit.role);
  }
}

function normalizeTriviaLine(line: string): string {
  return line.trim().replace(/\s+/g, " ").replace(/ ו /g, " ו");
}

/** ממיר general + trivia לקטעי הערות כמו באתר הישן */
export function parseIshimNotes(
  trivia: string[] = [],
  general: string[] = []
): IshimNote[] {
  const family: string[] = [];
  const army: string[] = [];
  const awards: string[] = [];
  const behind: string[] = [];

  for (const raw of trivia) {
    const t = normalizeTriviaLine(raw);
    if (!t) continue;
    if (
      /^פרס/.test(t) ||
      (/\bפרס\b/.test(t) &&
        (t.includes("מסך") ||
          t.includes("אקדמיה") ||
          t.includes("אופיר") ||
          t.includes("כינור")))
    ) {
      awards.push(t);
    } else if (
      /^(אבא|אמא|בן |בת |אח |אחות|בעל|אשת)/.test(t) ||
      /אב(א|) של|אמ(א|) של|בן של|בת של/.test(t)
    ) {
      family.push(t);
    } else if (
      t.includes("חלוצי לוחם") ||
      t.includes("נוער") ||
      (t.length < 40 && !t.includes("הצגה") && !t.includes("למרות"))
    ) {
      army.push(t);
    } else {
      behind.push(t);
    }
  }

  const notes: IshimNote[] = [];
  if (family.length) notes.push({ heading: "קשר משפחתי", items: family });
  if (army.length) notes.push({ heading: "צבא", items: army });
  if (behind.length) notes.push({ heading: "מאחורי הקלעים", items: behind });
  if (awards.length) notes.push({ heading: "תחרויות ופרסים", items: awards });

  const generalItems = general.map(normalizeTriviaLine).filter(Boolean);
  if (generalItems.length) notes.push({ heading: "כללי", items: generalItems });

  return notes;
}

export function ishimWaybackPersonUrl(name: string): string {
  return `${ISHIM_WAYBACK_BASE}/p.php?s=${encodeURIComponent(name)}`;
}

export function ishimWaybackProductionUrl(title: string): string {
  return `${ISHIM_WAYBACK_BASE}/m.php?s=${encodeURIComponent(title)}`;
}
