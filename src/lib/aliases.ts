/**
 * Known identity merges: former names / alternate spellings → canonical Hebrew name.
 * Used by dedupe so "אגם גולדברג" and "אגם רודברג" become one person.
 */
export const PERSON_NAME_ALIASES: Record<string, string> = {
  // Agam Goldberg → Agam Rodberg (name change)
  "אגם גולדברג": "אגם רודברג",
  "agam goldberg": "אגם רודברג",
  "agam rodberg": "אגם רודברג",
  // PPTX spelling variants
  "שרית וינו אלעד": "שרה וינו-אלעד",
  "שרית וינו-אלעד": "שרה וינו-אלעד",
  "אורי לוי": "אורי לוי (שחקן)",
  "יעל בן ארי": "יעל בן אריה",
  "שלמה בר שביט": "שלמה בר-שביט",
};

export const PERSON_ID_ALIASES: Record<string, string> = {
  "agos-goldberg": "agam-rodberg",
  "agos-goldberg-w2": "agam-rodberg",
  "agami-ridberd": "agam-rodberg",
  "agami-reidberg": "agam-rodberg",
};

export function canonicalPersonName(name: string): string {
  const trimmed = name.trim();
  return PERSON_NAME_ALIASES[trimmed] || PERSON_NAME_ALIASES[trimmed.toLowerCase()] || trimmed;
}

export function canonicalPersonId(id: string): string {
  return PERSON_ID_ALIASES[id] || id.replace(/-w2$/i, "");
}
