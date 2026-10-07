import rowsJson from "@/data/krvslt-hksmym.json";
import { canonicalPersonName } from "./aliases";
import { assignBillingOrders } from "./credit-order";
import { portrait } from "./portrait";
import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-10-07T17:10:00.000Z";

type CreditRow = {
  name: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

type PersonRow = { id: string; name: string };

type Note = { heading: string; items: string[] };

type ShowRow = {
  id: string;
  title: string;
  year: number;
  kind: ProductionKind;
  summary: string;
  runtimeMinutes: number;
  episodeCount?: number;
  channel?: string;
  genres: string[];
  sourceUrl: string;
  notes?: Note[];
  people: PersonRow[];
  credits: CreditRow[];
};

const SHOWS = rowsJson.shows as ShowRow[];

function normName(name: string): string {
  return canonicalPersonName(name)
    .trim()
    .replace(/[\u05BE\u2013\u2014\-־]+/g, " ")
    .replace(/['׳״"]/g, "")
    .replace(/\s+/g, " ");
}

function storedImage(url?: string): url is string {
  return Boolean(
    url &&
      (/^https?:\/\//i.test(url) ||
        url.startsWith("/images/") ||
        url.startsWith("data:")) &&
      !url.includes("/api/portrait")
  );
}

function stubPerson(row: PersonRow, show: ShowRow): Person {
  const roles = show.credits.filter((credit) => normName(credit.name) === normName(row.name));
  const activities = [
    ...new Set(roles.map((credit) => roleToActivity(credit.role))),
  ] as ActivityCategory[];
  if (show.kind.startsWith("series") && !activities.includes("series")) {
    activities.push("series");
  }
  if (show.kind.startsWith("film") && !activities.includes("film")) {
    activities.push("film");
  }
  return {
    id: row.id,
    name: canonicalPersonName(row.name),
    nicknames: [],
    bio: `מדבב/ת ישראלי/ת — «${show.title}», לפי ערוץ הופ תמיר.`,
    tags: ["דיבוב", "הופ תמיר"],
    activities: activities.length ? activities : ["dubbing"],
    sourceNote: "ערוץ הופ תמיר",
    sourceUrl: show.sourceUrl,
    imageUrl: portrait(canonicalPersonName(row.name)),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function productionRecord(show: ShowRow, imageUrl?: string, createdAt?: string): Production {
  return {
    id: show.id,
    title: show.title,
    year: show.year,
    kind: show.kind,
    summary: show.summary,
    genres: show.genres,
    channel: show.channel,
    runtimeMinutes: show.runtimeMinutes,
    episodeCount: show.episodeCount,
    ishimNotes: show.notes,
    ishimClassic: true,
    dubbingStudio: undefined,
    imageUrl: storedImage(imageUrl) ? imageUrl : portrait(show.title),
    sourceNote: "ערוץ הופ תמיר",
    sourceUrl: show.sourceUrl,
    createdAt: createdAt || NOW,
    updatedAt: NOW,
  };
}

function applyShow(data: ArchiveData, show: ShowRow): ArchiveData {
  const people = [...data.people];

  const matchesFor = (name: string) => {
    const key = normName(name);
    return people.filter(
      (person) =>
        normName(person.name) === key ||
        (person.nicknames || []).some((nick) => normName(nick) === key)
    );
  };

  for (const row of show.people) {
    if (matchesFor(row.name).length) continue;
    if (people.some((person) => person.id === row.id)) continue;
    people.push(stubPerson(row, show));
  }

  const stubIds = new Set(show.people.map((row) => row.id));
  const personIdFor = (name: string) => {
    const matches = [...matchesFor(name)].sort((a, b) => {
      const stubRank = (person: Person) => (stubIds.has(person.id) ? 1 : 0);
      const dubRank = (person: Person) =>
        person.activities?.includes("dubbing") || person.tags?.includes("מדבבים") ? 0 : 1;
      return stubRank(a) - stubRank(b) || dubRank(a) - dubRank(b);
    });
    const found = matches[0];
    if (!found) throw new Error(`Missing person for ${show.title} ${show.year}: ${name}`);
    return found.id;
  };

  const productions = [...data.productions];
  const matchIndexes = productions
    .map((production, index) =>
      production.id === show.id ||
      (production.title === show.title && production.year === show.year)
        ? index
        : -1
    )
    .filter((index) => index >= 0);
  const canonicalIndex = matchIndexes.find((index) => productions[index].id === show.id);
  const keepIndex = canonicalIndex !== undefined ? canonicalIndex : matchIndexes[0];
  const droppedIds = new Set(
    matchIndexes.map((index) => productions[index].id).filter((id) => id !== show.id)
  );

  if (keepIndex === undefined) {
    productions.push(productionRecord(show));
  } else {
    const existing = productions[keepIndex];
    productions[keepIndex] = productionRecord(show, existing.imageUrl, existing.createdAt);
  }

  const credits: Credit[] = assignBillingOrders(
    show.credits.map((row) => ({
      personId: personIdFor(row.name),
      productionId: show.id,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
    }))
  );

  const replacedIds = new Set([show.id, ...droppedIds]);
  const keptCredits = [
    ...data.credits.filter((credit) => !replacedIds.has(credit.productionId)),
    ...credits,
  ];
  const usedPersonIds = new Set(keptCredits.map((credit) => credit.personId));
  return {
    ...data,
    people: people.filter((person) => {
      if (!stubIds.has(person.id) || usedPersonIds.has(person.id)) return true;
      const covered = people.some(
        (other) => other.id !== person.id && normName(other.name) === normName(person.name)
      );
      return !covered;
    }),
    productions: productions.filter((production) => !droppedIds.has(production.id)),
    credits: keptCredits,
  };
}

/** סרט 2005 וסדרת 2008 «קרוסלת הקסמים» מערוץ הופ תמיר — סדר תפקידים כמו במקור. */
export function applyIshimMagicRoundabout(data: ArchiveData): ArchiveData {
  return SHOWS.reduce(applyShow, data);
}
