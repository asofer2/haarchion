import { isSelfNamedIshimCharacter } from "./ishim-import";
import { creditHeading, headingSortIndex } from "./ishim-person";
import type { Credit } from "./types";

/** מפתח לזיהוי קרדיט ייחודי (שומר דמויות/שנים נפרדות) */
export function creditDedupeKey(c: Credit): string {
  return `${c.productionId}|${c.personId}|${c.role}|${c.characterName || ""}|${c.year || ""}|${c.endYear || ""}|${creditHeading(c)}`;
}

/** Short key used by filmography fillers / client merges — collapses role duplicates. */
export function creditPersonProdRoleKey(c: Credit): string {
  return `${c.productionId}_${c.personId}_${c.role}`;
}

/**
 * When two credits collide on person+production+role, keep real תפקיד text.
 * Prefer a non-self-named character; otherwise keep any non-empty role
 * (person pages often list the actor's own name when they play themselves).
 */
export function preferCreditCharacter(
  existing: Credit,
  incoming: Credit,
  personName?: string
): Credit {
  const pick = (value?: string) => {
    const c = value?.trim();
    return c || undefined;
  };
  const existingChar = pick(existing.characterName);
  const incomingChar = pick(incoming.characterName);
  const existingSelf = isSelfNamedIshimCharacter(existingChar, personName);
  const incomingSelf = isSelfNamedIshimCharacter(incomingChar, personName);

  let characterName: string | undefined;
  if (existingChar && !existingSelf) characterName = existingChar;
  else if (incomingChar && !incomingSelf) characterName = incomingChar;
  else characterName = existingChar || incomingChar;

  return {
    ...existing,
    ...incoming,
    characterName,
    heading: existing.heading || incoming.heading,
    year: existing.year ?? incoming.year,
    endYear: existing.endYear ?? incoming.endYear,
    billingOrder: existing.billingOrder ?? incoming.billingOrder,
  };
}

export function creditMatchKey(c: Credit): string {
  return creditDedupeKey(c);
}

/** קבוצת סדר תצוגה בדף הפקה — לפי כותרת אישים (מדבבים, בימוי דיבוב…) */
export function castBillingGroupKey(c: Credit): string {
  return `${c.productionId}|${creditHeading(c)}`;
}

export function compareBillingOrder(
  a: { billingOrder?: number },
  b: { billingOrder?: number }
): number {
  const ba = a.billingOrder ?? Number.MAX_SAFE_INTEGER;
  const bb = b.billingOrder ?? Number.MAX_SAFE_INTEGER;
  return ba - bb;
}

/** סדר תצוגה לפי כותרת תפקיד ואז billingOrder */
export function compareCreditsForDisplay(a: Credit, b: Credit): number {
  const ha = headingSortIndex(creditHeading(a));
  const hb = headingSortIndex(creditHeading(b));
  if (ha !== hb) return ha - hb;
  const ba = a.billingOrder ?? Number.MAX_SAFE_INTEGER;
  const bb = b.billingOrder ?? Number.MAX_SAFE_INTEGER;
  if (ba !== bb) return ba - bb;
  return 0;
}

/**
 * מקצה billingOrder לפי סדר מקור קנוני (למשל SEED / דף הפקה באישים).
 * קרדיטים שלא בקנון מקבלים סדר יחסי לפי מיקומם במערך המקורי.
 */
export function stampBillingOrders(
  credits: Credit[],
  canonical: Credit[] = []
): Credit[] {
  const canonicalOrder = new Map<string, number>();
  const groupCounter = new Map<string, number>();

  for (const credit of canonical) {
    const key = creditMatchKey(credit);
    if (canonicalOrder.has(key)) continue;
    const groupKey = castBillingGroupKey(credit);
    const order = groupCounter.get(groupKey) ?? 0;
    canonicalOrder.set(key, order);
    groupCounter.set(groupKey, order + 1);
  }

  const fallbackCounter = new Map<string, number>();
  return credits.map((credit) => {
    if (credit.billingOrder !== undefined) return credit;
    const key = creditMatchKey(credit);
    const canonicalIdx = canonicalOrder.get(key);
    if (canonicalIdx !== undefined) {
      return { ...credit, billingOrder: canonicalIdx };
    }
    const groupKey = castBillingGroupKey(credit);
    const order = fallbackCounter.get(groupKey) ?? groupCounter.get(groupKey) ?? 0;
    fallbackCounter.set(groupKey, order + 1);
    return { ...credit, billingOrder: order };
  });
}

/** מקצה billingOrder לפי סדר מערך (למשל קובץ JSON של אישים) */
export function assignBillingOrders(credits: Credit[]): Credit[] {
  const counters = new Map<string, number>();
  return credits.map((credit) => {
    const groupKey = castBillingGroupKey(credit);
    const order = counters.get(groupKey) ?? 0;
    counters.set(groupKey, order + 1);
    return { ...credit, billingOrder: order };
  });
}

/** ממיין קרדיטים של הפקה אחת לתצוגה */
export function sortProductionCredits(
  credits: Credit[],
  productionId: string
): Credit[] {
  return credits
    .filter((c) => c.productionId === productionId)
    .sort(compareCreditsForDisplay);
}

/** מאחד מקורות קרדיטים בסדר עדיפות — ללא כפילויות */
export function buildCanonicalCredits(...sources: Credit[][]): Credit[] {
  const seen = new Set<string>();
  const out: Credit[] = [];
  for (const source of sources) {
    for (const credit of source) {
      const key = creditMatchKey(credit);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(credit);
    }
  }
  return out;
}
