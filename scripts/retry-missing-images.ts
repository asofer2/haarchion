/**
 * Re-probe entries marked missing in image-fill-report.json (slow, rate-limit safe).
 * Run: npx tsx scripts/retry-missing-images.ts
 */
import fs from "fs";
import path from "path";
import { SEED } from "../src/lib/seed";
import { resolvePortrait } from "../src/lib/portrait-resolve";

const REPORT = path.join(__dirname, "image-fill-report.json");
const CONCURRENCY = 2;
const DELAY_MS = 350;

type Report = {
  at: string;
  summary: Record<string, number>;
  stillMissingPeople: string[];
  stillMissingProductions: string[];
  sampleFound: { id: string; name: string; url: string | null }[];
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!);
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return out;
}

function parsePortraitParams(imageUrl?: string) {
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

async function main() {
  const prev = JSON.parse(fs.readFileSync(REPORT, "utf8")) as Report;
  const missPeople = new Set(prev.stillMissingPeople);
  const missProds = new Set(prev.stillMissingProductions);

  const people = SEED.people.filter((p) => missPeople.has(p.name));
  // Productions titles may duplicate — match by title among those in seed
  const prods = SEED.productions.filter((p) => missProds.has(p.title));

  console.log(
    `Retry people ${people.length}, productions ${prods.length} (concurrency=${CONCURRENCY})`
  );

  let done = 0;
  const total = people.length + prods.length;

  const peopleHits = await mapPool(people, CONCURRENCY, async (p) => {
    const parsed = parsePortraitParams(p.imageUrl);
    const name = parsed.name || p.name;
    const also = parsed.also || p.nameOriginal;
    let url = await resolvePortrait(name, also, {
      deep: false,
      kind: "person",
    });
    if (!url) {
      url = await resolvePortrait(name, also, { deep: true, kind: "person" });
    }
    done++;
    if (done % 20 === 0 || done === total) console.log(`… ${done}/${total}`);
    return { id: p.id, name: p.name, found: Boolean(url), url };
  });

  const prodHits = await mapPool(prods, CONCURRENCY, async (p) => {
    const parsed = parsePortraitParams(p.imageUrl);
    const name = parsed.name || p.title;
    const also = parsed.also || p.originalTitle;
    const kind =
      parsed.kind ||
      (p.kind === "performance" || p.kind === "cassette" ? "album" : "film");
    let url = await resolvePortrait(name, also, { deep: false, kind });
    if (!url) url = await resolvePortrait(name, also, { deep: true, kind });
    done++;
    if (done % 20 === 0 || done === total) console.log(`… ${done}/${total}`);
    return { id: p.id, name: p.title, found: Boolean(url), url };
  });

  const peopleRecovered = peopleHits.filter((h) => h.found).length;
  const peopleStill = peopleHits.filter((h) => !h.found).length;
  const prodsRecovered = prodHits.filter((h) => h.found).length;
  const prodsStill = prodHits.filter((h) => !h.found).length;

  const prevPeopleResolved = prev.summary.peopleResolved || 0;
  const prevProdsResolved = prev.summary.productionsResolved || 0;
  const localPeople = prev.summary.peopleAlreadyLocal || 0;
  const localProds = prev.summary.productionsAlreadyLocal || 0;

  const summary = {
    peopleTotal: prev.summary.peopleTotal,
    peopleAlreadyLocal: localPeople,
    peopleResolved: prevPeopleResolved + peopleRecovered,
    peopleStillMissing: peopleStill,
    peopleWithWorkingImage: localPeople + prevPeopleResolved + peopleRecovered,
    peopleRecoveredThisPass: peopleRecovered,
    productionsTotal: prev.summary.productionsTotal,
    productionsAlreadyLocal: localProds,
    productionsResolved: prevProdsResolved + prodsRecovered,
    productionsStillMissing: prodsStill,
    productionsWithWorkingImage:
      localProds + prevProdsResolved + prodsRecovered,
    productionsRecoveredThisPass: prodsRecovered,
    productionsLackedImageUrl: 0,
  };

  const next: Report = {
    at: new Date().toISOString(),
    summary,
    stillMissingPeople: peopleHits.filter((h) => !h.found).map((h) => h.name),
    stillMissingProductions: prodHits
      .filter((h) => !h.found)
      .map((h) => h.name)
      .slice(0, 120),
    sampleFound: [
      ...peopleHits.filter((h) => h.found).slice(0, 15),
      ...prodHits.filter((h) => h.found).slice(0, 15),
    ].map((h) => ({ id: h.id, name: h.name, url: h.url })),
  };

  fs.writeFileSync(REPORT, JSON.stringify(next, null, 2), "utf8");
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
