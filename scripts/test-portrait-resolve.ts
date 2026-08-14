import { SEED } from "../src/lib/seed";
import { resolvePortrait } from "../src/lib/portrait-resolve";

async function main() {
  const missing = SEED.productions.filter((p) => !p.imageUrl);
  const withImg = SEED.productions.filter((p) => p.imageUrl);
  console.log("prods missing imageUrl", missing.length, "with", withImg.length);
  console.log(
    "sample disc imageUrl",
    SEED.productions.find((p) => p.id.startsWith("disc-"))?.imageUrl
  );

  const samples: [string, string | null, string][] = [
    ["גילה אלמגור", "Gila Almagor", "person"],
    ["Waltz with Bashir", null, "film"],
    ["ריטה", "Rita", "person"],
    ["Boom Boom Boom", "Rita", "album"],
  ];
  for (const [n, a, k] of samples) {
    const url = await resolvePortrait(n, a, { deep: true, kind: k });
    console.log(k, n, "=>", url ? url.slice(0, 100) : "MISSING");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
