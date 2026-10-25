import "server-only";

import archiveJson from "@/data/ishim-archive.json";
import { canonicalPersonName } from "@/lib/aliases";
import { normalizePersonName } from "@/lib/dedupe";
import { findById, slugify } from "@/lib/ids";
import {
  ISHIM_CLASSIC_SOURCE,
  cleanIshimCharacter,
  ishimWaybackPersonUrl,
  parseIshimNotes,
} from "@/lib/ishim-import";
import { CANONICAL_PRODUCTION_ID_BY_TITLE } from "@/lib/production-aliases";
import { SEED } from "@/lib/seed";
import {
  kindToActivity,
  roleToActivity,
  type ActivityCategory,
  type Credit,
  type CreditRole,
  type Person,
  type Production,
  type ProductionKind,
} from "@/lib/types";

const NOW = "2026-08-20T00:00:00.000Z";

type IshimCredit = {
  role: CreditRole;
  heading?: string;
  year?: number;
  title: string;
  character?: string;
  kind?: ProductionKind | null;
  orderIndex?: number;
};

type IshimPerson = {
  s: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  birthName?: string;
  nameOriginal?: string;
  keys?: string[];
  credits?: IshimCredit[];
  general?: string[];
  trivia?: string[];
};

const PEOPLE = ((archiveJson as { people?: IshimPerson[] }).people || []).slice();

const PREFERRED_PRODUCTION_ID: Record<string, string> = {
  "פרפר נחמד": "parpar-nechmad",
  הדרדסים: "the-smurfs-he",
  "דובוני אכפת לי": "care-bears-he",
  ...CANONICAL_PRODUCTION_ID_BY_TITLE,
};

const KEY_ACTIVITY: Record<string, ActivityCategory> = {
  מדבבים: "dubbing",
  במאים: "film",
  "כוכבי ילדים": "series",
  זמרים: "musical",
  מלחינים: "musical",
  "מפיקי טלוויזיה": "series",
  "מפיקי קולנוע": "film",
  צלמים: "film",
  סטנדאפ: "stage",
  בובות: "series",
};

let byName: Map<string, IshimPerson> | null = null;
let bySlug: Map<string, IshimPerson> | null = null;
let seedById: Map<string, Production> | null = null;
let seedByTitle: Map<string, Production[]> | null = null;
let seedPeopleByName: Map<string, Person> | null = null;
let catalog: { people: Person[]; byId: Map<string, IshimPerson> } | null = null;

function archiveIndexes(): {
  byName: Map<string, IshimPerson>;
  bySlug: Map<string, IshimPerson>;
} {
  if (byName && bySlug) return { byName, bySlug };
  byName = new Map();
  bySlug = new Map();
  for (const person of PEOPLE) {
    const key = normalizePersonName(canonicalPersonName(person.name));
    const current = byName.get(key);
    if (!current || (person.credits?.length || 0) > (current.credits?.length || 0)) {
      byName.set(key, person);
    }
    const slug = slugify(person.name);
    if (slug) {
      const currentSlug = bySlug.get(slug);
      if (
        !currentSlug ||
        (person.credits?.length || 0) > (currentSlug.credits?.length || 0)
      ) {
        bySlug.set(slug, person);
      }
    }
  }
  return { byName, bySlug };
}

function seedPeopleIndex(): Map<string, Person> {
  if (seedPeopleByName) return seedPeopleByName;
  seedPeopleByName = new Map();
  for (const person of SEED.people) {
    const key = normalizePersonName(canonicalPersonName(person.name));
    if (key && !seedPeopleByName.has(key)) seedPeopleByName.set(key, person);
  }
  return seedPeopleByName;
}

function listPerson(person: Person): Person {
  return {
    ...person,
    bio: "",
    ishimNotes: undefined,
    discography: undefined,
  };
}

function ensureCatalog(): { people: Person[]; byId: Map<string, IshimPerson> } {
  if (catalog) return catalog;
  const { byName: names } = archiveIndexes();
  const seedNames = seedPeopleIndex();
  const people: Person[] = [];
  const byId = new Map<string, IshimPerson>();
  const used = new Set<string>();
  for (const src of names.values()) {
    const key = normalizePersonName(canonicalPersonName(src.name));
    const existing = key ? seedNames.get(key) : undefined;
    let person = listPerson(toPerson(src, existing));
    if (used.has(person.id)) {
      const suffix = slugify(src.s).slice(0, 12) || "2";
      person = { ...person, id: `${person.id}-${suffix}` };
    }
    used.add(person.id);
    byId.set(person.id, src);
    people.push(person);
  }
  catalog = { people, byId };
  return catalog;
}

/** Every person from the classic Ishim archive, keyed like their role page. */
export function classicPeople(): Person[] {
  return ensureCatalog().people;
}

function productionIndexes(): {
  byId: Map<string, Production>;
  byTitle: Map<string, Production[]>;
} {
  if (seedById && seedByTitle) return { byId: seedById, byTitle: seedByTitle };
  seedById = new Map(SEED.productions.map((production) => [production.id, production]));
  seedByTitle = new Map();
  for (const production of SEED.productions) {
    const list = seedByTitle.get(production.title) || [];
    list.push(production);
    seedByTitle.set(production.title, list);
  }
  return { byId: seedById, byTitle: seedByTitle };
}

function activitiesFor(person: IshimPerson, credits: IshimCredit[]): ActivityCategory[] {
  const set = new Set<ActivityCategory>();
  for (const key of person.keys || []) {
    const activity = KEY_ACTIVITY[key];
    if (activity) set.add(activity);
  }
  for (const credit of credits) {
    set.add(roleToActivity(credit.role));
    if (credit.kind) set.add(kindToActivity(credit.kind));
  }
  if (!set.size) set.add("acting");
  return [...set];
}

function productionFor(
  title: string,
  year: number | undefined,
  kind: ProductionKind | null | undefined
): Production {
  const { byId, byTitle } = productionIndexes();
  const preferredId = PREFERRED_PRODUCTION_ID[title];
  const preferred = preferredId ? byId.get(preferredId) : undefined;
  const hits = byTitle.get(title) || [];
  const chosen =
    preferred ||
    (year ? hits.find((production) => production.year === year) : undefined) ||
    (hits.length === 1 ? hits[0] : undefined);
  if (chosen) return chosen;

  if (preferredId && CANONICAL_PRODUCTION_ID_BY_TITLE[title]) {
    return {
      id: preferredId,
      title,
      year: year || 0,
      kind: kind || "film_dubbed_foreign",
      summary: "",
      genres: [],
      ishimClassic: true,
      createdAt: NOW,
      updatedAt: NOW,
    };
  }

  return {
    id: `ishim-${slugify(title) || "prod"}`,
    title,
    year: year || 0,
    kind: kind || "film_cinema",
    summary: "",
    genres: [],
    ishimClassic: true,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function toPerson(src: IshimPerson, existing?: Person): Person {
  const credits = src.credits || [];
  const notes = parseIshimNotes(src.trivia, src.general);
  const activities = [
    ...new Set([...(existing?.activities || []), ...activitiesFor(src, credits)]),
  ];
  const id =
    existing?.id ||
    slugify(canonicalPersonName(src.name)) ||
    `ishim-${slugify(src.s) || "person"}`;
  return {
    id,
    name: existing?.name || src.name,
    nameOriginal: existing?.nameOriginal || src.nameOriginal,
    nicknames: existing?.nicknames?.length
      ? existing.nicknames
      : src.birthName
        ? [src.birthName]
        : [],
    birthDate: src.birthDate || existing?.birthDate,
    deathDate: existing?.deathDate || src.deathDate,
    bio: existing?.bio || "",
    imageUrl: existing?.imageUrl,
    imageSource: existing?.imageSource,
    imageCachedAt: existing?.imageCachedAt,
    tags: [...new Set([...(existing?.tags || []), ...(src.keys || [])])],
    activities,
    gender: existing?.gender,
    wikipediaUrl: existing?.wikipediaUrl,
    discography: existing?.discography,
    ishimClassic: true,
    ishimNotes: notes.length ? notes : existing?.ishimNotes,
    entryAuthors: ["ברק חננאל"],
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: ishimWaybackPersonUrl(src.name),
    createdAt: existing?.createdAt || NOW,
    updatedAt: NOW,
  };
}

/** Classic Ishim roles for one person, without building the full catalog. */
export function classicFilmography(rawId: string): {
  person: Person;
  credits: Credit[];
  productions: Production[];
} | null {
  const id = decodeURIComponent(rawId).trim();
  if (!id) return null;
  const existing = findById(SEED.people, id);
  const { byName, bySlug } = archiveIndexes();
  const assigned = ensureCatalog().byId;
  const src =
    assigned.get(id) ||
    assigned.get(id.replace(/-w2$/i, "")) ||
    (existing
      ? byName.get(normalizePersonName(canonicalPersonName(existing.name)))
      : undefined) ||
    bySlug.get(id.replace(/-w2$/i, "")) ||
    byName.get(normalizePersonName(id.replace(/-/g, " ")));
  if (!src && !existing) return null;
  if (!src) {
    return { person: existing!, credits: [], productions: [] };
  }

  const person = toPerson(src, existing);
  const productions: Production[] = [];
  const seen = new Set<string>();
  const credits: Credit[] = [];
  for (const credit of src.credits || []) {
    const title = credit.title?.trim();
    if (!title) continue;
    const production = productionFor(title, credit.year, credit.kind);
    if (!seen.has(production.id)) {
      seen.add(production.id);
      productions.push(production);
    }
    credits.push({
      personId: person.id,
      productionId: production.id,
      role: credit.role,
      characterName: cleanIshimCharacter(credit.character, person.name),
      year: credit.year,
      heading: credit.heading,
      billingOrder: credit.orderIndex,
    });
  }
  return { person, credits, productions };
}
