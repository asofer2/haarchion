import fs from "fs";

const list = JSON.parse(
  fs.readFileSync("scripts/series-audit.json", "utf8")
) as { id: string; title: string; credits: number; named: number }[];

const main = list.filter((x) => !x.id.startsWith("ht-"));
console.log("main series", main.length);
for (const x of main) {
  console.log(`${x.credits}\t${x.named}\t${x.id}\t${x.title}`);
}
fs.writeFileSync("scripts/series-main.json", JSON.stringify(main, null, 2));
