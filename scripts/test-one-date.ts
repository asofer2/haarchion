async function t(name: string) {
  const url =
    "https://he.wikipedia.org/w/api.php?action=query&titles=" +
    encodeURIComponent(name) +
    "&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&origin=*";
  const res = await fetch(url, { headers: { "User-Agent": "IshimArchive/1.0" } });
  const text = await res.text();
  console.log(name, res.status, text.slice(0, 250));
  const j = JSON.parse(text);
  const page = Object.values(j.query.pages)[0] as { pageprops?: { wikibase_item?: string } };
  const qid = page.pageprops?.wikibase_item;
  console.log("  qid", qid);
  if (!qid) return;
  const w = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`,
    { headers: { "User-Agent": "IshimArchive/1.0" } }
  );
  const wj = await w.json();
  const time = wj.entities?.[qid]?.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time;
  console.log("  birth", time);
}

(async () => {
  for (const n of ["דב גליקמן", "ליאור רז", "אליאנה תדהר", "יובל המבולבל", "שירה האס"]) {
    await t(n);
  }
})();
