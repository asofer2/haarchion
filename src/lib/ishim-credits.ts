import type { Production } from "./types";
import type { CreditRole } from "./types";

export type IshimCreditRow = {
  production: Production;
  role: CreditRole;
  year?: number;
  endYear?: number;
  characters: string[];
};

/** מקבץ קרדיטים לפי הפקה+שנה — דמויות מרובות תחת אותה שורה כמו באתר אישים */
export function groupIshimCredits<
  T extends {
    production: Production;
    role: CreditRole;
    characterName?: string;
    year?: number;
    endYear?: number;
  },
>(items: T[]): IshimCreditRow[] {
  const groups: IshimCreditRow[] = [];
  for (const item of items) {
    const year = item.year || item.production.year;
    const endYear = item.endYear;
    const key = `${item.production.id}|${year}|${endYear || ""}|${item.role}`;
    const existing = groups.find(
      (g) =>
        `${g.production.id}|${g.year || g.production.year}|${g.endYear || ""}|${g.role}` === key
    );
    const character = item.characterName?.trim();
    if (existing) {
      if (character && !existing.characters.includes(character)) {
        existing.characters.push(character);
      }
    } else {
      groups.push({
        production: item.production,
        role: item.role,
        year,
        endYear,
        characters: character ? [character] : [],
      });
    }
  }
  return groups;
}
