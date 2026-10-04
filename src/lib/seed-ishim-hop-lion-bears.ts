import bearJson from "@/data/ay-hdvbym.json";
import lion2Json from "@/data/mlk-haryvt-2.json";
import lionJson from "@/data/mlk-haryvt-1994.json";
import { canonicalPersonName } from "./aliases";
import { assignBillingOrders } from "./credit-order";
import { portrait } from "./portrait";
import type {
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";

const NOW = "2026-10-04T00:00:00.000Z";

type CreditRow = {
  name: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
  endYear?: number;
};

type PersonRow = { id: string; name: string };

type Note = { heading: string; items: string[] };

type ShowJson = {
  title: string;
  originalTitle?: string;
  year: number;
  endYear?: number;
  kind: ProductionKind;
  summary: string;
  runtimeMinutes?: number;
  episodeCount?: number;
  genres: string[];
  channel?: string;
  ishimKeys?: string[];
  notes?: Note[];
  people: PersonRow[];
  credits: CreditRow[];
};

const BEAR_URL =
  "https://sites.google.com/view/hoptamir/%D7%90%D7%99-%D7%94%D7%93%D7%95%D7%91%D7%99%D7%9D-1990-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const LION_URL =
  "https://sites.google.com/view/hoptamir/%D7%9E%D7%9C%D7%9A-%D7%94%D7%90%D7%A8%D7%99%D7%95%D7%AA-1994-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const LION2_URL =
  "https://sites.google.com/view/hoptamir/%D7%9E%D7%9C%D7%9A-%D7%94%D7%90%D7%A8%D7%99%D7%95%D7%AA-2-%D7%9E%D7%9C%D7%9B%D7%95%D7%AA-%D7%A1%D7%99%D7%9E%D7%91%D7%94-1998-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const ALON_URL =
  "https://web.archive.org/web/20210506000201/https://www.ishim.co.il/p.php?s=%D7%90%D7%9C%D7%95%D7%9F+%D7%90%D7%95%D7%A4%D7%99%D7%A8";

function normName(name: string): string {
  return canonicalPersonName(name)
    .trim()
    .replace(/[\u05BE\u2013\u2014\-־]+/g, " ")
    .replace(/['׳״"]/g, "")
    .replace(/\s+/g, " ");
}

function applyShow(
  data: ArchiveData,
  rows: ShowJson,
  fallbackId: string,
  sourceUrl: string,
  matches: (production: Production) => boolean
): ArchiveData {
  const people = [...data.people];
  const byNorm = new Map(people.map((p) => [normName(p.name), p]));

  for (const row of rows.people) {
    if (byNorm.has(normName(row.name))) continue;
    if (people.some((p) => p.id === row.id)) continue;
    const person: Person = {
      id: row.id,
      name: row.name,
      nicknames: [],
      bio: `מדבב/ת ישראלי/ת — «${rows.title}», לפי ערוץ הופ תמיר.`,
      tags: ["דיבוב", "הופ תמיר"],
      activities: ["dubbing"],
      sourceNote: "ערוץ הופ תמיר",
      sourceUrl,
      imageUrl: portrait(row.name),
      createdAt: NOW,
      updatedAt: NOW,
    };
    people.push(person);
    byNorm.set(normName(row.name), person);
  }

  const personIdFor = (name: string) => {
    const found = byNorm.get(normName(name));
    if (!found) throw new Error(`Missing person for ${rows.title}: ${name}`);
    return found.id;
  };

  const productions = [...data.productions];
  const matchIndexes = productions
    .map((p, i) => (p.id === fallbackId || matches(p) ? i : -1))
    .filter((i) => i >= 0);
  const canonicalIndex = matchIndexes.find((i) => productions[i].id === fallbackId);
  const keepIndex =
    canonicalIndex !== undefined ? canonicalIndex : matchIndexes[0];
  const productionId = fallbackId;
  const droppedIds = new Set(
    matchIndexes
      .map((i) => productions[i].id)
      .filter((id) => id !== fallbackId)
  );

  const record = (imageUrl?: string, createdAt?: string): Production => ({
    id: productionId,
    title: rows.title,
    originalTitle: rows.originalTitle,
    year: rows.year,
    endYear: rows.endYear,
    kind: rows.kind,
    summary: rows.summary,
    genres: rows.genres,
    channel: rows.channel,
    runtimeMinutes: rows.runtimeMinutes,
    episodeCount: rows.episodeCount,
    ishimKeys: rows.ishimKeys,
    ishimNotes: rows.notes,
    ishimClassic: true,
    imageUrl: imageUrl || portrait(rows.title, rows.originalTitle),
    sourceNote: "ערוץ הופ תמיר",
    sourceUrl,
    createdAt: createdAt || NOW,
    updatedAt: NOW,
  });

  if (keepIndex === undefined) {
    productions.push(record());
  } else {
    const existing = productions[keepIndex];
    productions[keepIndex] = record(existing.imageUrl, existing.createdAt);
  }

  const credits: Credit[] = assignBillingOrders(
    rows.credits.map((row) => ({
      personId: personIdFor(row.name),
      productionId,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
      endYear: row.endYear,
    }))
  );

  const replacedIds = new Set([productionId, ...droppedIds]);
  return {
    ...data,
    people,
    productions: productions.filter((p) => !droppedIds.has(p.id)),
    credits: [
      ...data.credits.filter((c) => !replacedIds.has(c.productionId)),
      ...credits,
    ],
  };
}

const ALON_ID = "alon-ofir";

const ALON_ACTOR: {
  title: string;
  year: number;
  character: string;
  heading: string;
  kind: ProductionKind;
  id: string;
}[] = [
  {
    title: "איים אבודים",
    year: 2008,
    character: "קוקסינל",
    heading: "שחקן",
    kind: "stage",
    id: "ishim-ayym-avvdym",
  },
  {
    title: "כל העולם במה",
    year: 1999,
    character: "סקפן / טרומפלדינו",
    heading: "שחקן",
    kind: "stage",
    id: "ishim-kl-havlm-bmh",
  },
  {
    title: "פסטיגל 95 - חיות",
    year: 1995,
    character: "באדי גור (קול בלבד)",
    heading: "שחקן",
    kind: "festival",
    id: "ishim-fstygl-95-chyvt",
  },
  {
    title: "להיטים מצוירים משלנו",
    year: 1992,
    character: "זמיר (קול)",
    heading: "שחקן",
    kind: "cassette_kids",
    id: "ishim-lhytym-mtsvyrym",
  },
  {
    title: "ספיישל 110 שנים להולדת וולט דיסני",
    year: 2011,
    character: "מרואיין",
    heading: "בתפקיד עצמו",
    kind: "tv_program",
    id: "ishim-disney-110",
  },
];

function applyAlonOfirActorRoles(data: ArchiveData): ArchiveData {
  const person = data.people.find((p) => p.id === ALON_ID || p.name === "אלון אופיר");
  if (!person) throw new Error("Missing person אלון אופיר");

  const productions = [...data.productions];
  const credits = [...data.credits];

  for (const row of ALON_ACTOR) {
    const sameTitle = productions.filter((p) => p.title === row.title);
    const found =
      sameTitle.find((p) => p.year === row.year) ||
      (sameTitle.length === 1 ? sameTitle[0] : undefined);
    const productionId = found?.id || row.id;
    if (!found) {
      productions.push({
        id: productionId,
        title: row.title,
        year: row.year,
        kind: row.kind,
        summary: "",
        genres: [],
        sourceNote: "אישים",
        sourceUrl: ALON_URL,
        createdAt: NOW,
        updatedAt: NOW,
      });
    }
    const exists = credits.some(
      (c) =>
        c.personId === person.id &&
        c.productionId === productionId &&
        c.role === "actor" &&
        c.characterName === row.character
    );
    if (exists) continue;
    credits.push({
      personId: person.id,
      productionId,
      role: "actor",
      heading: row.heading,
      characterName: row.character,
      year: row.year,
    });
  }

  return { ...data, productions, credits };
}

/** אי הדובים, מלך האריות 1994 ומלך האריות 2 לפי הופ תמיר, ותפקידי השחקן של אלון אופיר. */
export function applyIshimHopLionAndBears(data: ArchiveData): ArchiveData {
  const withShows = applyShow(
    applyShow(
      applyShow(
        data,
        bearJson as ShowJson,
        "ht-ay-hdvbym",
        BEAR_URL,
        (p) => p.id === "ht-ay-hdvbym" || p.title === bearJson.title
      ),
      lionJson as ShowJson,
      "lion-king-he",
      LION_URL,
      (p) => p.id === "lion-king-he" || p.title === lionJson.title
    ),
    lion2Json as ShowJson,
    "ht-mlk-haryvt-2",
    LION2_URL,
    (p) => p.id === "ht-mlk-haryvt-2" || p.title === lion2Json.title
  );
  return applyAlonOfirActorRoles(withShows);
}
