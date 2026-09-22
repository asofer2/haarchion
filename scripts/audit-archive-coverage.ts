/**
 * Compare every ishim-archive.json person/production against fullSeedArchive.
 * Run: npx --yes tsx -r ./scripts/stub-server-only.cjs scripts/audit-archive-coverage.ts
 */
import archiveJson from "../src/data/ishim-archive.json";
import { canonicalPersonName } from "../src/lib/aliases";
import { normalizePersonName } from "../src/lib/dedupe";
import { fullSeedArchive } from "../src/lib/seed-full-server";
import { SEED } from "../src/lib/seed";
import { applyIshimArchive } from "../src/lib/seed-ishim-archive";

type IshimPerson = {
  s: string;
  name: string;
  credits?: unknown[];
};
type IshimProduction = {
  s: string;
  title: string;
  year?: number;
  credits?: unknown[];
};

const archive = archiveJson as {
  people?: IshimPerson[];
  productions?: IshimProduction[];
};

const scrapedPeople = archive.people || [];
const scrapedProds = archive.productions || [];

const full = fullSeedArchive();
const afterApplyOnly = applyIshimArchive(structuredClone(SEED));

function personKeys(
  people: {
    id: string;
    name: string;
    nicknames?: string[];
    nameOriginal?: string;
  }[]
) {
  const byNorm = new Map<string, string>();
  for (const p of people) {
    byNorm.set(normalizePersonName(canonicalPersonName(p.name)), p.id);
    for (const nick of p.nicknames || []) {
      const k = normalizePersonName(nick);
      if (k && !byNorm.has(k)) byNorm.set(k, p.id);
    }
    if (p.nameOriginal) {
      const k = normalizePersonName(p.nameOriginal);
      if (k && !byNorm.has(k)) byNorm.set(k, p.id);
    }
  }
  return byNorm;
}

function prodKeys(productions: { id: string; title: string; year: number }[]) {
  const byTitle = new Map<string, { id: string; year: number }[]>();
  for (const p of productions) {
    const list = byTitle.get(p.title) || [];
    list.push({ id: p.id, year: p.year });
    byTitle.set(p.title, list);
  }
  return byTitle;
}

function matchProd(
  byTitle: Map<string, { id: string; year: number }[]>,
  title: string,
  year?: number
): string | undefined {
  const list = byTitle.get(title) || [];
  if (!list.length) return undefined;
  if (year != null) {
    const exact = list.find((p) => p.year === year);
    if (exact) return exact.id;
    const near = list.find((p) => Math.abs(p.year - year) <= 2);
    if (near) return near.id;
  }
  return list[0]?.id;
}

function coverage(label: string, data: typeof full) {
  const byPerson = personKeys(data.people);
  const byProd = prodKeys(data.productions);

  const missingPeople: { s: string; name: string; credits: number }[] = [];
  for (const src of scrapedPeople) {
    const key = normalizePersonName(canonicalPersonName(src.name));
    if (!byPerson.has(key)) {
      missingPeople.push({
        s: src.s,
        name: src.name,
        credits: src.credits?.length || 0,
      });
    }
  }

  const missingProds: {
    s: string;
    title: string;
    year?: number;
    credits: number;
  }[] = [];
  for (const src of scrapedProds) {
    if (!matchProd(byProd, src.title, src.year)) {
      missingProds.push({
        s: src.s,
        title: src.title,
        year: src.year,
        credits: src.credits?.length || 0,
      });
    }
  }

  const seen = new Map<string, string>();
  let collisions = 0;
  for (const src of scrapedPeople) {
    const key = normalizePersonName(canonicalPersonName(src.name));
    if (seen.has(key)) collisions++;
    else seen.set(key, src.s);
  }

  return {
    label,
    sitePeople: data.people.length,
    siteProductions: data.productions.length,
    siteCredits: data.credits.length,
    missingPeopleCount: missingPeople.length,
    missingProductionsCount: missingProds.length,
    archiveNameCollisions: collisions,
    missingPeopleSamples: missingPeople.slice(0, 20),
    missingProductionSamples: missingProds.slice(0, 20),
  };
}

console.log(
  JSON.stringify(
    {
      archive: {
        people: scrapedPeople.length,
        productions: scrapedProds.length,
      },
      leanSeed: {
        people: SEED.people.length,
        productions: SEED.productions.length,
        credits: SEED.credits.length,
      },
      afterApplyOnly: coverage("applyIshimArchive", afterApplyOnly),
      fullSeedNormalized: coverage("fullSeedArchive", full),
    },
    null,
    2
  )
);
