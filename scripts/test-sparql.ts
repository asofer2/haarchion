const names = [
  "חנה מרון",
  "מוני מושונוב",
  "ציפי שביט",
  "גידי גוב",
  "ריטה",
  "טוביה צפיר",
  "מיקי קם",
  "שפרירה זכאי",
  "יעל אבקסיס",
  "רמה מסינגר",
  "אגם רודברג",
  "נועה קירל",
  "עידו מוסרי",
  "דודו זר",
  "עמי מנדלמן",
  "אפי בן ישראל",
  "ירדנה ארזי",
  "שלמה בראבא",
  "ריקי גל",
  "ששי קשת",
];

async function sparql(name: string) {
  const q = `SELECT ?item ?birth ?death WHERE {
    ?item rdfs:label "${name}"@he.
    ?item wdt:P31 wd:Q5.
    OPTIONAL { ?item wdt:P569 ?birth. }
    OPTIONAL { ?item wdt:P570 ?death. }
  } LIMIT 3`;
  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(q);
  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "Ishim/1.0 (educational)",
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    console.log(name, "HTTP", res.status);
    return null;
  }
  const j = (await res.json()) as {
    results: {
      bindings: {
        birth?: { value: string };
        death?: { value: string };
        item?: { value: string };
      }[];
    };
  };
  const b = j.results.bindings[0];
  if (!b) {
    console.log(name, "no hit");
    return null;
  }
  const birth = b.birth?.value?.slice(0, 10);
  const death = b.death?.value?.slice(0, 10);
  console.log(name, birth || "—", death || "—");
  return { birth, death };
}

async function main() {
  for (const n of names) {
    await sparql(n);
    await new Promise((r) => setTimeout(r, 400));
  }
}

main();
