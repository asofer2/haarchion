/**
 * Probe / fill missing images via multi-source portrait resolver.
 * Run: npx tsx scripts/fill-missing-images.ts
 *
 * Reports how many people/productions resolve to a real image vs still missing.
 * Does NOT invent people — only attaches found portrait/poster/cover URLs.
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { resolvePortrait } from "../src/lib/portrait-resolve";

const CONCURRENCY = 6;
const REPORT = path.join(__dirname, "image-fill-report.json");

type Row = {
  type: "person" | "production";
  id: string;
  name: string;
  also?: string;
  kind?: string;
  hadLocal: boolean;
  found: boolean;
  url: string | null;
};

function parsePortraitParams(imageUrl?: string): {
  name?: string;
  also?: string;
  kind?: string;
} {
  if (!imageUrl?.includes("/api/portrait")) return {};
  try {
    const u = new URL(imageUrl, "http://local");
    return {
      name: u.searchParams.get("name") || undefined,
      also: u.searchParams.get("also") || undefined,
      kind: u.searchParams.get("kind") || undefined,
    };
  } catch {
    return {};
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!, i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return out;
}

async function main() {
  const people = SEED.people;
  const productions = SEED.productions;

  const alreadyLocalPeople = people.filter((p) =>
    p.imageUrl?.startsWith("/images/")
  ).length;
  const alreadyLocalProds = productions.filter((p) =>
    p.imageUrl?.startsWith("/images/")
  ).length;

  const peopleNeed = people.filter((p) => !p.imageUrl?.startsWith("/images/"));
  const prodsNeed = productions.filter(
    (p) => !p.imageUrl?.startsWith("/images/")
  );

  console.log(
    `People: ${people.length} total, ${alreadyLocalPeople} local, ${peopleNeed.length} to resolve`
  );
  console.log(
    `Productions: ${productions.length} total, ${alreadyLocalProds} local, ${prodsNeed.length} to resolve`
  );

  let done = 0;
  const total = peopleNeed.length + prodsNeed.length;

  const peopleRows = await mapPool(peopleNeed, CONCURRENCY, async (p) => {
    const parsed = parsePortraitParams(p.imageUrl);
    const name = parsed.name || p.name;
    const also = parsed.also || p.nameOriginal;
    const kind = parsed.kind || "person";
    let url = await resolvePortrait(name, also, { deep: false, kind });
    if (!url) url = await resolvePortrait(name, also, { deep: true, kind });
    done++;
    if (done % 25 === 0 || done === total) {
      console.log(`… ${done}/${total}`);
    }
    return {
      type: "person" as const,
      id: p.id,
      name: p.name,
      also: also || undefined,
      kind: "person",
      hadLocal: false,
      found: Boolean(url),
      url,
    } satisfies Row;
  });

  const prodRows = await mapPool(prodsNeed, CONCURRENCY, async (p) => {
    const parsed = parsePortraitParams(p.imageUrl);
    const name = parsed.name || p.title;
    const also = parsed.also || p.originalTitle;
    const kind =
      parsed.kind ||
      (p.kind === "performance" || p.kind === "cassette" ? "album" : "film");
    let url = await resolvePortrait(name, also, { deep: false, kind });
    if (!url) url = await resolvePortrait(name, also, { deep: true, kind });
    done++;
    if (done % 25 === 0 || done === total) {
      console.log(`… ${done}/${total}`);
    }
    return {
      type: "production" as const,
      id: p.id,
      name: p.title,
      also: also || undefined,
      kind,
      hadLocal: false,
      found: Boolean(url),
      url,
    } satisfies Row;
  });

  const peopleFound = peopleRows.filter((r) => r.found).length;
  const peopleMissing = peopleRows.filter((r) => !r.found).length;
  const prodsFound = prodRows.filter((r) => r.found).length;
  const prodsMissing = prodRows.filter((r) => !r.found).length;

  const report = {
    at: new Date().toISOString(),
    summary: {
      peopleTotal: people.length,
      peopleAlreadyLocal: alreadyLocalPeople,
      peopleResolved: peopleFound,
      peopleStillMissing: peopleMissing,
      peopleWithWorkingImage: alreadyLocalPeople + peopleFound,
      productionsTotal: productions.length,
      productionsAlreadyLocal: alreadyLocalProds,
      productionsResolved: prodsFound,
      productionsStillMissing: prodsMissing,
      productionsWithWorkingImage: alreadyLocalProds + prodsFound,
      /** Entries that previously had no seed imageUrl (mostly discography) */
      productionsLackedImageUrl: productions.filter((p) => !p.imageUrl).length,
    },
    stillMissingPeople: peopleRows.filter((r) => !r.found).map((r) => r.name),
    stillMissingProductions: prodRows
      .filter((r) => !r.found)
      .map((r) => r.name)
      .slice(0, 80),
    sampleFound: [...peopleRows, ...prodRows]
      .filter((r) => r.found)
      .slice(0, 30)
      .map((r) => ({ id: r.id, name: r.name, url: r.url })),
  };

  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Wrote ${REPORT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
