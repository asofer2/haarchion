/** Multi-source portrait / poster / album-cover resolver (Commons, Wiki, Openverse, CAA). */

export const PORTRAIT_UA =
  "Ishim/1.0 (https://haarchion.vercel.app; Israeli personalities archive; educational)";

type WikiSummary = {
  title?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  type?: string;
};

async function fetchJson<T>(url: string, ms = 4500): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": PORTRAIT_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(ms),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function cleanImageUrl(url?: string): string | null {
  if (!url) return null;
  const cleaned = url.split("?")[0] || null;
  if (!cleaned) return null;
  if (/\.svg($|\?)/i.test(cleaned)) return null;
  return cleaned;
}

function isRaster(url: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(url);
}

async function fromWikipedia(lang: string, title: string): Promise<string | null> {
  const summary = await fetchJson<WikiSummary>(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  );
  if (!summary || summary.type === "disambiguation") return null;
  return (
    cleanImageUrl(summary?.thumbnail?.source) ||
    cleanImageUrl(summary?.originalimage?.source)
  );
}

async function fromWikipediaSearch(
  lang: string,
  query: string
): Promise<string | null> {
  const search = await fetchJson<{
    query?: { search?: { title: string }[] };
  }>(
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=5&format=json&origin=*`
  );
  const hits = search?.query?.search || [];
  for (const hit of hits) {
    const img = await fromWikipedia(lang, hit.title);
    if (img) return img;
  }
  return null;
}

async function fromCommons(query: string): Promise<string | null> {
  const api = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        { title?: string; imageinfo?: { url?: string; thumburl?: string }[] }
      >;
    };
  }>(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`
  );
  const pages = api?.query?.pages || {};
  const qNorm = query.toLowerCase();
  const ranked = Object.values(pages).sort((a, b) => {
    const at = (a.title || "").toLowerCase();
    const bt = (b.title || "").toLowerCase();
    const as = at.includes(qNorm) ? 0 : 1;
    const bs = bt.includes(qNorm) ? 0 : 1;
    return as - bs;
  });
  for (const page of ranked) {
    const info = page.imageinfo?.[0];
    const src = cleanImageUrl(info?.thumburl) || cleanImageUrl(info?.url);
    if (src && isRaster(src)) return src;
  }
  return null;
}

async function fromWikidata(query: string): Promise<string | null> {
  const search = await fetchJson<{
    search?: { id: string; label?: string; description?: string }[];
  }>(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      query
    )}&language=en&uselang=he&type=item&limit=5&format=json&origin=*`
  );
  const hits = search?.search || [];
  if (!hits.length) return null;

  const ids = hits.map((h) => h.id).join("|");
  const entities = await fetchJson<{
    entities?: Record<
      string,
      {
        claims?: {
          P18?: { mainsnak?: { datavalue?: { value?: string } } }[];
        };
      }
    >;
  }>(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=claims&format=json&origin=*`
  );

  for (const hit of hits) {
    const file = entities?.entities?.[hit.id]?.claims?.P18?.[0]?.mainsnak
      ?.datavalue?.value;
    if (!file) continue;
    const info = await fetchJson<{
      query?: {
        pages?: Record<
          string,
          { imageinfo?: { url?: string; thumburl?: string }[] }
        >;
      };
    }>(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        `File:${file}`
      )}&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`
    );
    const pages = info?.query?.pages || {};
    for (const page of Object.values(pages)) {
      const ii = page.imageinfo?.[0];
      const src = cleanImageUrl(ii?.thumburl) || cleanImageUrl(ii?.url);
      if (src && isRaster(src)) return src;
    }
  }
  return null;
}

async function fromOpenverse(query: string): Promise<string | null> {
  const api = await fetchJson<{
    results?: {
      title?: string;
      url?: string;
      thumbnail?: string;
      foreign_landing_url?: string;
    }[];
  }>(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
      query
    )}&page_size=8&license_type=commercial,modification&format=json`,
    5000
  );
  const results = api?.results || [];
  const qParts = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  for (const r of results) {
    const hay = `${r.title || ""} ${r.foreign_landing_url || ""}`.toLowerCase();
    const overlap =
      qParts.length === 0 ||
      qParts.filter((w) => hay.includes(w)).length >= Math.min(2, qParts.length);
    if (!overlap) continue;
    const src = cleanImageUrl(r.url) || cleanImageUrl(r.thumbnail);
    if (src && isRaster(src) && !/logo|icon|svg|sprite/i.test(src)) return src;
  }
  for (const r of results) {
    const src = cleanImageUrl(r.url) || cleanImageUrl(r.thumbnail);
    if (src && isRaster(src)) return src;
  }
  return null;
}

async function fromCoverArtArchive(
  title: string,
  artist?: string | null
): Promise<string | null> {
  const q = artist
    ? `release:"${title}" AND artist:"${artist}"`
    : `release:"${title}"`;
  const mb = await fetchJson<{
    releases?: { id: string; title?: string; score?: number }[];
  }>(
    `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(
      q
    )}&fmt=json&limit=5`,
    5000
  );
  const releases = mb?.releases || [];
  for (const rel of releases) {
    try {
      const res = await fetch(
        `https://coverartarchive.org/release/${rel.id}/front-500`,
        {
          headers: { "User-Agent": PORTRAIT_UA },
          signal: AbortSignal.timeout(4500),
          redirect: "follow",
        }
      );
      if (res.ok && res.url) {
        const url = cleanImageUrl(res.url) || res.url;
        if (url) return url;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

async function firstHit(
  tasks: (() => Promise<string | null>)[]
): Promise<string | null> {
  if (tasks.length === 0) return null;
  return await new Promise((resolve) => {
    let pending = tasks.length;
    let settled = false;
    for (const task of tasks) {
      void task().then((url) => {
        if (settled) return;
        if (url) {
          settled = true;
          resolve(url);
          return;
        }
        pending -= 1;
        if (pending === 0) resolve(null);
      });
    }
  });
}

function primaryQueries(name: string, also?: string | null): string[] {
  const out: string[] = [];
  if (also) {
    const first = also.split(",")[0]!.trim();
    out.push(first);
    out.push(first.replace(/Rodberg/gi, "Rudberg"));
    out.push(first.replace(/Rudberg/gi, "Rodberg"));
  }
  out.push(name);
  return [...new Set(out.filter(Boolean))];
}

function looksLikeAlbum(
  name: string,
  also?: string | null,
  kind?: string | null
): boolean {
  if (kind === "album") return true;
  if (kind === "person" || kind === "film") return false;
  const blob = `${name} ${also || ""}`.toLowerCase();
  return /אלבום|album|ep\b|soundtrack|ost\b|קלטת|דיסק/i.test(blob);
}

export async function resolvePortraitFast(
  name: string,
  also?: string | null,
  kind?: string | null
): Promise<string | null> {
  const queries = primaryQueries(name, also);
  const tasks: (() => Promise<string | null>)[] = [];

  for (const q of queries.slice(0, 3)) {
    if (/[a-z]/i.test(q)) tasks.push(() => fromWikipedia("en", q));
    else tasks.push(() => fromWikipedia("he", q));
  }
  tasks.push(() => fromWikipedia("he", name));
  if (also) tasks.push(() => fromWikipedia("en", also.split(",")[0]!.trim()));

  const wiki = await firstHit(tasks);
  if (wiki) return wiki;

  const commonsQ = also?.split(",")[0]?.trim() || name;
  const secondary: (() => Promise<string | null>)[] = [
    () => fromCommons(commonsQ),
    () => fromCommons(`${commonsQ} portrait`),
    () => fromWikidata(commonsQ),
    () => fromWikidata(name),
    () => fromOpenverse(commonsQ),
  ];

  if (kind === "film") {
    secondary.push(() => fromCommons(`${name} film poster`));
    secondary.push(() => fromCommons(`${commonsQ} poster`));
    secondary.push(() => fromWikipedia("en", `${commonsQ} (film)`));
  }

  if (looksLikeAlbum(name, also, kind)) {
    secondary.push(() => fromCoverArtArchive(name, also?.split(",")[0]?.trim()));
    secondary.push(() => fromCommons(`${name} album cover`));
    secondary.push(() => fromCommons(`${name} album`));
  }

  const hit = await firstHit(secondary);
  if (hit) return hit;

  return (
    (await fromWikipediaSearch(/[a-z]/i.test(name) ? "en" : "he", name)) ||
    (also ? await fromWikipediaSearch("en", also.split(",")[0]!.trim()) : null)
  );
}

export async function resolvePortraitDeep(
  name: string,
  also?: string | null,
  kind?: string | null
): Promise<string | null> {
  const fast = await resolvePortraitFast(name, also, kind);
  if (fast) return fast;

  for (const q of primaryQueries(name, also)) {
    const variants = [
      fromWikipedia("he", `${q} (שחקנית)`),
      fromWikipedia("he", `${q} (שחקן)`),
      fromWikipedia("he", `${q} (זמרת)`),
      fromWikipedia("he", `${q} (זמר)`),
      fromWikipedia("he", `${q} (מדבבת)`),
      fromWikipedia("he", `${q} (מדבב)`),
      fromWikipedia("en", `${q} actress`),
      fromWikipedia("en", `${q} actor`),
      fromWikipedia("en", `${q} singer`),
      fromWikipedia("en", `${q} (film)`),
      fromCommons(`${q} actress`),
      fromCommons(`${q} actor`),
      fromOpenverse(`${q} portrait`),
      fromOpenverse(`${q} israeli`),
    ];
    const hit = await firstHit(variants.map((p) => () => p));
    if (hit) return hit;
  }

  if (looksLikeAlbum(name, also, kind) && also) {
    const artist = also.split(",")[0]!.trim();
    const cover = await fromCoverArtArchive(name, artist);
    if (cover) return cover;
  }

  return null;
}

export async function resolvePortrait(
  name: string,
  also?: string | null,
  opts?: { deep?: boolean; kind?: string | null }
): Promise<string | null> {
  if (opts?.deep) return resolvePortraitDeep(name, also, opts.kind);
  return resolvePortraitFast(name, also, opts?.kind);
}
