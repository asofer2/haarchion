/** Classic Ishim slugs that now have a Hop Tamir catalog page. */
export const LEGACY_PRODUCTION_IDS: Record<string, string> = {
  "ishim-tynkrbl": "ht-tynkrbl-2008",
  "ishim-tynkrbl-vhavtsr-habvd": "ht-tynkrbl-vhavtsr-hbvd",
  "ishim-tynkrbl-vhsvd-hksvm": "ht-tynkrbl-vhsvd-hksvm",
  "ishim-knpy-hram-srt": "ishim-knpy-hram",
  "bambi-he": "ishim-bmby",
};

/** Exact classic titles whose role pages should link at the catalog id. */
export const CANONICAL_PRODUCTION_ID_BY_TITLE: Record<string, string> = {
  טינקרבל: "ht-tynkrbl-2008",
  "טינקרבל והאוצר האבוד": "ht-tynkrbl-vhavtsr-hbvd",
  "טינקרבל והסוד הקסום": "ht-tynkrbl-vhsvd-hksvm",
  במבי: "ishim-bmby",
  "במבי 2": "ishim-bmby-2",
};

export function canonicalProductionId(id: string): string {
  return LEGACY_PRODUCTION_IDS[id] || id;
}
