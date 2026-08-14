import { resolvePortrait } from "../src/lib/portrait-resolve";

async function main() {
  for (const n of [
    "נועה קירל",
    "שלומי שבת",
    "מיכאל אלוני",
    "דני בסן",
    "אנה זק",
    "רותם סלע",
    "עודד מנשה",
    "טוביה צפיר",
  ]) {
    const url = await resolvePortrait(n, null, { deep: false, kind: "person" });
    console.log(n, "=>", url ? "OK " + url.slice(0, 80) : "MISS");
    await new Promise((r) => setTimeout(r, 500));
  }
}

main().catch(console.error);
