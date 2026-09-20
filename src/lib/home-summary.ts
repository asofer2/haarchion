import "server-only";

import { unstable_cache } from "next/cache";
import {
  ARCHIVE_CACHE_TAG,
  ARCHIVE_REVALIDATE_SECONDS,
  readFirestoreArchiveServer,
} from "@/lib/archive-server";
import { bornToday, formatDateHe, recentUpdates } from "@/lib/data";
import { directoryCount, ISHIM_DIRECTORY } from "@/lib/ishim-directory";
import { formatProductionTitle } from "@/lib/production-title";
import { fullSeedArchive } from "@/lib/seed-full-server";
import { upcomingProductions } from "@/lib/types";
import type { ArchiveData } from "@/lib/types";
import staticHomeSummary from "@/data/home-summary.json";

export type HomeSummary = {
  kindCounts: { label: string; listHref: string; count: number }[];
  todayPeople: {
    id: string;
    name: string;
    imageUrl?: string;
    birthDate?: string;
    deathDate?: string;
    activities: string[];
  }[];
  latest: {
    id: string;
    kind: "person" | "production";
    title: string;
    href: string;
    at: string;
    action: "create" | "update";
  }[];
  upcoming: { id: string; title: string; year: number }[];
};

function asHomeSummary(raw: typeof staticHomeSummary): HomeSummary {
  return {
    kindCounts: raw.kindCounts || [],
    todayPeople: (raw.todayPeople || []).map((p) => ({
      id: p.id,
      name: p.name,
      birthDate: p.birthDate,
      deathDate: p.deathDate,
      activities: p.activities || [],
    })),
    latest: (raw.latest || []) as HomeSummary["latest"],
    upcoming: (raw.upcoming || []) as HomeSummary["upcoming"],
  };
}

function upcomingRows(productions: ArchiveData["productions"]): HomeSummary["upcoming"] {
  return upcomingProductions(productions, 8).map((p) => ({
    id: p.id,
    title: formatProductionTitle(p),
    year: p.year,
  }));
}

function buildHomeSummary(data: ArchiveData): HomeSummary {
  return {
    kindCounts: ISHIM_DIRECTORY.map((item) => ({
      label: item.label,
      listHref: item.listHref,
      count: directoryCount(item, data.people, data.productions),
    })),
    todayPeople: bornToday(data.people)
      .slice(0, 12)
      .map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        birthDate: p.birthDate,
        deathDate: p.deathDate,
        activities: (p.activities || []).slice(0, 3),
      })),
    latest: recentUpdates(data, 3),
    upcoming: upcomingRows(data.productions),
  };
}

async function loadArchiveForHome(): Promise<ArchiveData> {
  try {
    return await readFirestoreArchiveServer();
  } catch {
    return fullSeedArchive();
  }
}

/**
 * Upcoming list is always resolved from Firestore/full seed so explicit
 * `airStatus: "upcoming"` (and year heuristics) appear even when the rest of
 * the homepage uses build-time `home-summary.json`.
 */
const getCachedUpcomingRows = unstable_cache(
  async (): Promise<HomeSummary["upcoming"]> => {
    const data = await loadArchiveForHome();
    return upcomingRows(data.productions);
  },
  ["home-upcoming-v1"],
  {
    tags: [ARCHIVE_CACHE_TAG, "home"],
    revalidate: ARCHIVE_REVALIDATE_SECONDS,
  }
);

/**
 * Homepage widgets — prefer build-time `home-summary.json`.
 * Dynamic Firestore/full-seed path only when HOME_SUMMARY_DYNAMIC=1.
 * Upcoming is always live-merged (see getCachedUpcomingRows).
 */
export async function getCachedHomeSummary(): Promise<HomeSummary> {
  if (process.env.HOME_SUMMARY_DYNAMIC === "1") {
    return getDynamicHomeSummary();
  }
  const base = asHomeSummary(staticHomeSummary);
  try {
    const upcoming = await getCachedUpcomingRows();
    return { ...base, upcoming };
  } catch {
    return base;
  }
}

const getDynamicHomeSummary = unstable_cache(
  async (): Promise<HomeSummary> => {
    const data = await loadArchiveForHome();
    return buildHomeSummary(data);
  },
  ["home-summary-v3-dynamic"],
  {
    tags: [ARCHIVE_CACHE_TAG, "home"],
    revalidate: ARCHIVE_REVALIDATE_SECONDS,
  }
);

export { formatDateHe };
