/** Classic Ishim slugs that now have a Hop Tamir catalog page. */
export const LEGACY_PRODUCTION_IDS: Record<string, string> = {
  "ishim-tynkrbl": "ht-tynkrbl-2008",
  "ishim-tynkrbl-vhavtsr-habvd": "ht-tynkrbl-vhavtsr-hbvd",
  "ishim-tynkrbl-vhsvd-hksvm": "ht-tynkrbl-vhsvd-hksvm",
  "ishim-knpy-hram-srt": "ishim-knpy-hram",
  "ishim-kyph-advmh-hsypvr-hamyty": "ht-kyph-advmh",
  "bambi-he": "ishim-bmby",
  "ishim-msavt-gvlybr": "ht-msavt-gvlybr",
  "ishim-ayty-chbr-mkvkb-achr": "ht-ayty-chbr-mkvkb-achr",
  "ishim-amyl-vhblshym": "ht-amyl-vhblshym",
  "ishim-alpa-vavmgh": "ht-alpa-vavmgh",
  "ishim-antvny-hnmlh": "ht-antvny-hnmlh",
  "ishim-byt-spr-lpyvt": "ht-byt-spr-lpyvt",
};

/** Exact classic titles whose role pages should link at the catalog id. */
export const CANONICAL_PRODUCTION_ID_BY_TITLE: Record<string, string> = {
  טינקרבל: "ht-tynkrbl-2008",
  "טינקרבל והאוצר האבוד": "ht-tynkrbl-vhavtsr-hbvd",
  "טינקרבל והסוד הקסום": "ht-tynkrbl-vhsvd-hksvm",
  "כיפה אדומה - הסיפור האמיתי": "ht-kyph-advmh",
  במבי: "ishim-bmby",
  "במבי 2": "ishim-bmby-2",
  "מסעות גוליבר": "ht-msavt-gvlybr",
  "אי.טי. - חבר מכוכב אחר": "ht-ayty-chbr-mkvkb-achr",
  "אמיל והבלשים": "ht-amyl-vhblshym",
  "אלפא ואומגה": "ht-alpa-vavmgh",
  "בית ספר לפיות": "ht-byt-spr-lpyvt",
};

export function canonicalProductionId(id: string): string {
  return LEGACY_PRODUCTION_IDS[id] || id;
}
