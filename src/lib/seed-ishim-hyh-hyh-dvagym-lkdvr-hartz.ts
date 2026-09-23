import rowsJson from "@/data/hyh-hyh-dvagym-lkdvr-hartz.json";
import { assignBillingOrders } from "./credit-order";
import { ISHIM_CLASSIC_SOURCE } from "./ishim-import";
import { portrait } from "./portrait";
import type { ArchiveData, Credit, CreditRole, Production } from "./types";

const NOW = "2026-09-23T00:00:00.000Z";
/** Existing Hop Tamir / site id — keep stable URLs. */
export const HYH_HYH_DVAGYM_LKDVR_HARTZ_ID = "ht-hyh-hyh-dvagym-lkdvr-hartz";

const WAYBACK_URL =
  "https://web.archive.org/web/20210818053534/https://www.ishim.co.il/m.php?s=%D7%94%D7%99%D7%94+%D7%94%D7%99%D7%94+-+%D7%93%D7%95%D7%90%D7%92%D7%99%D7%9D+%D7%9C%D7%9B%D7%93%D7%95%D7%A8+%D7%94%D7%90%D7%A8%D7%A5";

type CreditRow = {
  personId: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

const PRODUCTION: Production = {
  id: HYH_HYH_DVAGYM_LKDVR_HARTZ_ID,
  title: rowsJson.title,
  originalTitle: rowsJson.originalTitle,
  year: rowsJson.year,
  kind: "series_dubbed_foreign",
  summary: rowsJson.summary,
  genres: rowsJson.genres,
  channel: rowsJson.channel,
  runtimeMinutes: rowsJson.runtimeMinutes,
  episodeCount: rowsJson.episodeCount,
  ishimKeys: rowsJson.ishimKeys,
  ishimClassic: true,
  imageUrl: portrait(rowsJson.title, rowsJson.originalTitle),
  entryAuthors: rowsJson.entryAuthors,
  sourceNote: ISHIM_CLASSIC_SOURCE,
  sourceUrl: WAYBACK_URL,
  createdAt: NOW,
  updatedAt: NOW,
};

/** Classic ishim production page (Wayback 2021-08-18). */
export function applyIshimHyhHyhDvagymLkdvrHartz(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const duplicateIds = new Set<string>();

  for (let i = 0; i < productions.length; i++) {
    const p = productions[i];
    if (p.title !== rowsJson.title && p.id !== HYH_HYH_DVAGYM_LKDVR_HARTZ_ID) {
      continue;
    }
    if (p.id !== HYH_HYH_DVAGYM_LKDVR_HARTZ_ID) duplicateIds.add(p.id);
    const { endYear: _dropEndYear, ...withoutEndYear } = p;
    productions[i] = {
      ...withoutEndYear,
      ...PRODUCTION,
      id: HYH_HYH_DVAGYM_LKDVR_HARTZ_ID,
      imageUrl: p.imageUrl || PRODUCTION.imageUrl,
      createdAt: p.createdAt || NOW,
      updatedAt: NOW,
    };
  }

  if (!productions.some((p) => p.id === HYH_HYH_DVAGYM_LKDVR_HARTZ_ID)) {
    productions.push(PRODUCTION);
  }

  const keptProductions = productions.filter(
    (p) =>
      p.id === HYH_HYH_DVAGYM_LKDVR_HARTZ_ID || p.title !== rowsJson.title
  );

  const credits: Credit[] = assignBillingOrders(
    (rowsJson.credits as CreditRow[]).map((row) => ({
      personId: row.personId,
      productionId: HYH_HYH_DVAGYM_LKDVR_HARTZ_ID,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: rowsJson.year,
    }))
  );

  const mergedCredits = [
    ...data.credits.filter(
      (c) =>
        c.productionId !== HYH_HYH_DVAGYM_LKDVR_HARTZ_ID &&
        !duplicateIds.has(c.productionId)
    ),
    ...credits,
  ];

  return {
    ...data,
    productions: keptProductions,
    credits: mergedCredits,
  };
}
