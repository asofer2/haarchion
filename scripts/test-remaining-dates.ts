const names = [
  "אבי גריניק",
  "גורי אלפי",
  "יעקב כהן",
  "דנה סמו",
  "יובל שם-טוב",
  "חן אלון",
  "עינת גליקסמן",
  "קובי ליקורמן",
  "יואב צרפתי",
  "איילת לוין",
  "צלילה ינאי",
];

async function go(n: string) {
  const u =
    "https://he.wikipedia.org/w/api.php?action=query&titles=" +
    encodeURIComponent(n) +
    "&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json";
  const j = await (await fetch(u, { headers: { "User-Agent": "Ishim/1" } })).json();
  const page = Object.values(j.query.pages)[0] as any;
  const qid = page.pageprops?.wikibase_item;
  if (!qid) {
    console.log(n, "NO PAGE");
    return;
  }
  const w = await (
    await fetch(
      "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" +
        qid +
        "&props=claims&format=json",
      { headers: { "User-Agent": "Ishim/1" } }
    )
  ).json();
  console.log(n, qid, w.entities[qid].claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time);
}

(async () => {
  for (const n of names) await go(n);
})();
