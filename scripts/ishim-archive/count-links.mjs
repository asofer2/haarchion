import fs from "fs";

function peopleFrom(file) {
  const h = fs.readFileSync(file, "utf8");
  const names = [...h.matchAll(/p\.php\?s=([^"']+)/g)].map((m) =>
    decodeURIComponent(m[1].replace(/&amp;/g, "&").split("#")[0])
  );
  return [...new Set(names)];
}

for (const file of [
  "scripts/ishim-archive/k-dubbers.html",
  "scripts/ishim-archive/k-directors.html",
  "scripts/ishim-archive/k-kids.html",
]) {
  if (!fs.existsSync(file)) {
    console.log("missing", file);
    continue;
  }
  const n = peopleFrom(file);
  console.log(file, n.length, n.slice(0, 3).join(" | "));
}
