/**
 * Fetch Wikipedia cast sections for main Israeli series and dump to JSON.
 */
import * as fs from "fs";
import * as path from "path";

const SERIES: { id: string; wiki: string; sections?: number[] }[] = [
  { id: "shtisel", wiki: "שטיסל", sections: [3, 4] },
  { id: "fauda", wiki: "פאודה", sections: [8, 9, 11] },
  { id: "ha-hamama", wiki: "החממה_(סדרת_טלוויזיה)" },
  { id: "parpar-nechmad", wiki: "פרפר_נחמד" },
  { id: "sesame-israel", wiki: "רחוב_סומסום" },
  { id: "itcha", wiki: "איצ'ה" },
  { id: "hopa-hey", wiki: "הופה_היי" },
  { id: "rega-im-dudley", wiki: "רגע_עם_דודלי" },
  { id: "sefi-tv", wiki: "ספי_(תוכנית_טלוויזיה)" },
  { id: "hop", wiki: "הופ!" },
];

async function wikiParse(title: string, section?: number): Promise<string> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text",
    format: "json",
    redirects: "1",
  });
  if (section != null) params.set("section", String(section));
  const url = `https://he.wikipedia.org/w/api.php?${params}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "haarchion-archive/1.0 (educational)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${title}`);
  const j = (await res.json()) as { parse?: { text?: { "*": string } }; error?: { info: string } };
  if (j.error) throw new Error(j.error.info);
  return j.parse?.text?.["*"] ?? "";
}

async function wikiSections(title: string): Promise<{ index: string; line: string }[]> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "sections",
    format: "json",
    redirects: "1",
  });
  const url = `https://he.wikipedia.org/w/api.php?${params}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "haarchion-archive/1.0 (educational)" },
  });
  const j = (await res.json()) as {
    parse?: { sections?: { index: string; line: string }[] };
    error?: { info: string };
  };
  if (j.error) throw new Error(`${title}: ${j.error.info}`);
  return j.parse?.sections ?? [];
}

function extractLinkedNames(html: string): string[] {
  const names: string[] = [];
  const re = /<a[^>]+title="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const title = m[1];
    const text = m[2].trim();
    if (!text || text.length < 2) continue;
    if (/^(עריכה|עמוד|קטגוריה|ויקיפדיה|עזרה|שיחה|קובץ)/.test(text)) continue;
    if (/^(עריכה|קטגוריה|עזרה|שיחה)/.test(title)) continue;
    if (title.includes(":") && !title.startsWith("ויקיפדיה:")) continue;
    // skip section edits etc
    if (text === title || /^[\u0590-\u05FF\s'״״׳\-–.]+$/.test(text)) {
      names.push(text);
    }
  }
  return [...new Set(names)];
}

function extractInfoboxCast(html: string): string[] {
  // look for שחקנים row
  const m = html.match(/שחקנים[\s\S]{0,800}/);
  if (!m) return [];
  return extractLinkedNames(m[0]);
}

async function main() {
  const out: Record<
    string,
    { wiki: string; sections: { line: string; names: string[] }[]; infobox: string[]; all: string[] }
  > = {};

  for (const s of SERIES) {
    console.log("Fetching", s.id, s.wiki);
    try {
      const sections = await wikiSections(s.wiki);
      const castSecs = sections.filter((sec) =>
        /שחק|צוות|דמוי|מדבב|משתתפ|דיבוב|מגיש/.test(sec.line)
      );
      const toFetch =
        s.sections?.map(String) ??
        castSecs.map((sec) => sec.index).slice(0, 4);

      const sectionResults: { line: string; names: string[] }[] = [];
      const allNames = new Set<string>();

      // full page for infobox
      const full = await wikiParse(s.wiki);
      const infobox = extractInfoboxCast(full);
      infobox.forEach((n) => allNames.add(n));

      for (const idx of toFetch) {
        const line = sections.find((sec) => sec.index === String(idx))?.line ?? `section-${idx}`;
        const html = await wikiParse(s.wiki, Number(idx));
        const names = extractLinkedNames(html);
        names.forEach((n) => allNames.add(n));
        sectionResults.push({ line, names });
        await new Promise((r) => setTimeout(r, 200));
      }

      // if no cast sections found, try whole page links near שחקנים
      if (allNames.size < 3) {
        extractLinkedNames(full).slice(0, 30).forEach((n) => allNames.add(n));
      }

      out[s.id] = {
        wiki: s.wiki,
        sections: sectionResults,
        infobox,
        all: [...allNames],
      };
      console.log(`  -> ${allNames.size} names, sections: ${castSecs.map((x) => x.line).join(", ")}`);
    } catch (e) {
      console.error(`  FAIL ${s.id}:`, e);
      out[s.id] = { wiki: s.wiki, sections: [], infobox: [], all: [] };
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  const dest = path.join(__dirname, "wiki-series-casts.json");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote", dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
