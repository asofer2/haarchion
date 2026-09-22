/**
 * Compare lean SEED empties vs fullSeedArchive after ishim merge.
 * Run: npx --yes tsx scripts/verify-full-seed-fill.ts
 */
import archiveJson from "../src/data/ishim-archive.json";
import { canonicalPersonName } from "../src/lib/aliases";
import { normalizePersonName } from "../src/lib/dedupe";
import { SEED } from "../src/lib/seed";
import { applyIshimArchive } from "../src/lib/seed-ishim-archive";
import { fullSeedArchive } from "../src/lib/seed-full-server";
import {
  countEmptyContent,
  mergeCloudOntoFullSeed,
} from "../src/lib/merge-full-seed";
import type { ArchiveData } from "../src/lib/types";

function creditsFor(data: ArchiveData) {
  const byPerson = new Map<string, number>();
  const byProd = new Map<string, number>();
  for (const c of data.credits) {
    byPerson.set(c.personId, (byPerson.get(c.personId) || 0) + 1);
    byProd.set(c.productionId, (byProd.get(c.productionId) || 0) + 1);
  }
  return { byPerson, byProd };
}

function leanEmpty(data: ArchiveData) {
  const { byPerson, byProd } = creditsFor(data);
  const emptyPeople = data.people.filter((p) => {
    const prose =
      (p.bio || "").trim().length > 0 ||
      (p.ishimNotes || []).some((n) => n.items?.length);
    return !prose && !(byPerson.get(p.id) || 0);
  });
  const emptyProds = data.productions.filter((p) => {
    const summary = (p.summary || "").trim().length > 0;
    return !summary && !(byProd.get(p.id) || 0);
  });
  return { emptyPeople, emptyProds };
}

const lean = structuredClone(SEED) as ArchiveData;
const leanStats = leanEmpty(lean);
const full = fullSeedArchive();
const fullStats = countEmptyContent(full);

// Simulate Firestore lean-only upload (common failure mode)
const simulatedCloud: ArchiveData = {
  people: lean.people.map((p) => ({
    ...p,
    bio: "",
    ishimNotes: undefined,
    // keep images to verify preservation
  })),
  productions: lean.productions.map((p) => ({
    ...p,
    summary: "",
  })),
  credits: [],
  contributions: [],
};

const hydrated = mergeCloudOntoFullSeed(simulatedCloud, full);
const hydratedStats = countEmptyContent(hydrated);

const imagesPreserved = simulatedCloud.people.filter((p) => p.imageUrl).every((p) => {
  const h = hydrated.people.find((x) => x.id === p.id);
  return h?.imageUrl === p.imageUrl;
});

const momi = full.people.find((p) => p.id === "mvmy-lvy" || p.name === "מומי לוי");
const momiCredits = full.credits.filter((c) => c.personId === (momi?.id || "mvmy-lvy")).length;

console.log(
  JSON.stringify(
    {
      lean: {
        people: lean.people.length,
        productions: lean.productions.length,
        credits: lean.credits.length,
        emptyPeople: leanStats.emptyPeople.length,
        emptyProductions: leanStats.emptyProds.length,
        sampleEmptyPeople: leanStats.emptyPeople.slice(0, 8).map((p) => p.id),
      },
      fullSeed: {
        people: full.people.length,
        productions: full.productions.length,
        credits: full.credits.length,
        ...fullStats,
      },
      filledVsLean: {
        peopleAdded: full.people.length - lean.people.length,
        productionsAdded: full.productions.length - lean.productions.length,
        creditsAdded: full.credits.length - lean.credits.length,
        emptyPeopleReduced: leanStats.emptyPeople.length - fullStats.emptyPeople,
        emptyProductionsReduced:
          leanStats.emptyProds.length - fullStats.emptyProductions,
      },
      simulatedLeanFirestoreHydrate: {
        ...hydratedStats,
        people: hydrated.people.length,
        productions: hydrated.productions.length,
        credits: hydrated.credits.length,
        imagesPreserved,
      },
      momiLevy: momi
        ? {
            id: momi.id,
            hasBio: Boolean(momi.bio?.trim()),
            notes: momi.ishimNotes?.length || 0,
            credits: momiCredits,
            imageUrl: Boolean(momi.imageUrl),
            ishimClassic: momi.ishimClassic,
          }
        : null,
    },
    null,
    2
  )
);
