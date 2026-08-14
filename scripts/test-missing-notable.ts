const names = [
  "חרות אשכנזי",
  "גיה באר גורביץ'",
  "גיה באר-גורביץ",
  "ליטל גבאי",
  "קובי ליקורמן",
  "עינת גליקסמן",
  "יואב צרפתי",
  "אורטל זמיר",
  "איילת לוין",
  "צלילה ינאי",
  "אליאנה תדהר",
  "תובל שפיר",
  "עפר שכטר",
];

async function go(n: string) {
  const u =
    "https://he.wikipedia.org/w/api.php?action=query&titles=" +
    encodeURIComponent(n) +
    "&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json";
  const res = await fetch(u, { headers: { "User-Agent": "Ishim/1" } });
  const text = await res.text();
  if (text.startsWith("You are")) {
    console.log(n, "RATE LIMITED");
    return;
  }
  const j = JSON.parse(text);
  const page = Object.values(j.query.pages)[0] as any;
  const qid = page.pageprops?.wikibase_item;
  if (!qid) {
    console.log(n, "NO PAGE");
    return;
  }
  await new Promise((r) => setTimeout(r, 400));
  const w = await (
    await fetch(
      "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" +
        qid +
        "&props=claims&format=json",
      { headers: { "User-Agent": "Ishim/1" } }
    )
  ).json();
  const birth = w.entities[qid].claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time;
  const death = w.entities[qid].claims?.P570?.[0]?.mainsnak?.datavalue?.value?.time;
  console.log(n, qid, birth, death || "");
}

(async () => {
  for (const n of names) {
    await go(n);
    await new Promise((r) => setTimeout(r, 500));
  }
})();
