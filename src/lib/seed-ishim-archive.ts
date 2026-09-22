import "server-only";

import archiveJson from "@/data/ishim-archive.json";
import { canonicalPersonName } from "./aliases";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import {
  ISHIM_CLASSIC_SOURCE,
  ishimCreditHeading,
  ishimWaybackPersonUrl,
  parseIshimNotes,
} from "./ishim-import";
import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";
import { kindToActivity, roleToActivity } from "./types";

const NOW = "2026-08-20T00:00:00.000Z";

type IshimCredit = {
  role: CreditRole;
  heading?: string;
  year?: number;
  title: string;
  s?: string;
  character?: string;
  kind?: ProductionKind | null;
  channel?: string | null;
  orderIndex?: number;
};

type IshimPerson = {
  s: string;
  name: string;
  ishimId?: string;
  birthDate?: string;
  deathDate?: string;
  deathNote?: string;
  birthName?: string;
  nameOriginal?: string;
  keys?: string[];
  credits?: IshimCredit[];
  general?: string[];
  trivia?: string[];
};

type IshimProduction = {
  s: string;
  title: string;
  year?: number;
  kind?: ProductionKind;
  summary?: string;
  genres?: string[];
  keys?: string[];
  channel?: string;
  credits?: {
    role: CreditRole;
    personS?: string;
    personName?: string;
    character?: string;
    year?: number;
  }[];
};

type IshimArchiveFile = {
  people?: IshimPerson[];
  productions?: IshimProduction[];
};

const ISHIM = archiveJson as IshimArchiveFile;

const PREFERRED_PRODUCTION_ID: Record<string, string> = {
  "פרפר נחמד": "parpar-nechmad",
  הדרדסים: "the-smurfs-he",
  "דובוני אכפת לי": "care-bears-he",
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

function ishimBio(_person: IshimPerson): string {
  return "";
}

function classicPersonFields(src: IshimPerson): Partial<Person> {
  const notes = parseIshimNotes(src.trivia, src.general);
  return {
    ishimClassic: true,
    bio: ishimBio(src),
    ishimNotes: notes.length ? notes : undefined,
    entryAuthors: ["ברק חננאל"],
    sourceNote: ISHIM_CLASSIC_SOURCE,
    sourceUrl: ishimWaybackPersonUrl(src.name),
    tags: src.keys || [],
  };
}

function activitiesFor(person: IshimPerson, credits: IshimCredit[]): ActivityCategory[] {
  const set = new Set<ActivityCategory>();
  for (const key of person.keys || []) {
    const act = KEY_ACTIVITY[key];
    if (act) set.add(act);
  }
  for (const credit of credits) {
    set.add(roleToActivity(credit.role));
    if (credit.kind) set.add(kindToActivity(credit.kind));
  }
  if (!set.size) set.add("acting");
  return [...set];
}

function isPlausibleClassicMatch(production: Production, year?: number): boolean {
  if (!year) return production.year <= 2001 && !production.id.startsWith("ht-");
  if (production.year === year) return true;
  if (Math.abs(production.year - year) <= 2) {
    if (production.id.startsWith("ht-") && production.year > 2000 && year <= 2000) {
      return false;
    }
    return true;
  }
  if (production.id.startsWith("ht-") && production.year > 2000) return false;
  return production.year <= 1996 && year <= 1996;
}

function rememberPersonNames(
  person: Person,
  byName: Map<string, Person>,
  byNick: Map<string, Person>,
  opts?: { nicknames?: boolean; skipNickKeys?: Set<string> }
) {
  byName.set(normalizePersonName(canonicalPersonName(person.name)), person);
  if (opts?.nicknames === false) return;
  const skip = opts?.skipNickKeys;
  for (const nick of person.nicknames || []) {
    const key = normalizePersonName(nick);
    // Never let a nickname steal another person's primary archive name.
    if (!key || skip?.has(key)) continue;
    if (!byNick.has(key)) byNick.set(key, person);
  }
  if (person.nameOriginal) {
    const key = normalizePersonName(person.nameOriginal);
    if (key && !skip?.has(key) && !byNick.has(key)) byNick.set(key, person);
  }
}

function resolvePersonId(
  name: string,
  s: string,
  byId: Map<string, Person>,
  byName: Map<string, Person>,
  byNick: Map<string, Person>,
  opts?: { allowNick?: boolean }
): string {
  const canonical = canonicalPersonName(name);
  const key = normalizePersonName(canonical);
  const existing =
    byName.get(key) ||
    (opts?.allowNick === false ? undefined : byNick.get(key));
  if (existing) return existing.id;

  let id = slugify(canonical);
  if (!id || id.startsWith("item-")) id = `ishim-${slugify(s.split("#")[0]) || "person"}`;
  if (byId.has(id) && normalizePersonName(byId.get(id)!.name) !== key) {
    id = `ishim-${id}`;
  }
  if (byId.has(id) && normalizePersonName(byId.get(id)!.name) !== key) {
    id = `${id}-${slugify(s).slice(0, 12)}`;
  }
  return id;
}

function newProduction(
  title: string,
  year: number,
  kind: ProductionKind,
  extra?: Partial<Production>
): Production {
  const base = slugify(title) || "prod";
  return {
    id: `ishim-${base}`,
    title,
    year,
    kind,
    summary: extra?.summary || "",
    genres: extra?.genres || [],
    channel: extra?.channel,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function resolveProductionId(
  title: string,
  year: number | undefined,
  kind: ProductionKind | undefined,
  productions: Production[],
  byId: Map<string, Production>,
  byTitle: Map<string, Production[]>,
  prodIndex: Map<string, number>,
  s?: string
): string {
  const preferred = PREFERRED_PRODUCTION_ID[title];
  if (preferred && byId.has(preferred)) return preferred;

  const exactTitle = byTitle.get(title) || [];
  const match =
    exactTitle.find((p) => year && p.year === year) ||
    exactTitle.find((p) => isPlausibleClassicMatch(p, year));
  if (match) return match.id;

  const created = newProduction(title, year || 0, kind || "tv_series");
  let id = created.id;
  if (s?.includes("#")) {
    const frag = slugify(s.split("#")[1] || "");
    if (frag) id = `${created.id}-${frag}`;
  }
  if (byId.has(id) && byId.get(id)!.title !== title) {
    id = `${created.id}-${year || "x"}`;
  }
  if (!byId.has(id)) {
    const production = { ...created, id };
    prodIndex.set(id, productions.length);
    productions.push(production);
    byId.set(id, production);
    const list = byTitle.get(title) || [];
    list.push(production);
    byTitle.set(title, list);
  }
  return id;
}

function putProduction(
  patched: Production,
  productions: Production[],
  byId: Map<string, Production>,
  byTitle: Map<string, Production[]>,
  prodIndex: Map<string, number>
) {
  const idx = prodIndex.get(patched.id);
  if (idx !== undefined) productions[idx] = patched;
  const previous = byId.get(patched.id);
  byId.set(patched.id, patched);
  if (previous && previous.title === patched.title) {
    const list = byTitle.get(patched.title);
    if (list) {
      const listIdx = list.findIndex((item) => item.id === patched.id);
      if (listIdx >= 0) list[listIdx] = patched;
    }
  }
}

function patchProduction(
  production: Production,
  src?: IshimProduction,
  credit?: IshimCredit
): Production {
  const year = src?.year || credit?.year || production.year;
  const kind = src?.kind || credit?.kind || production.kind;
  const summary =
    src?.summary && (!production.summary || production.id.startsWith("ishim-"))
      ? src.summary
      : production.summary;
  const genres = [...new Set([...(production.genres || []), ...(src?.genres || []), ...(src?.keys || [])])];
  return {
    ...production,
    year: production.id.startsWith("ht-") && production.year > 2000 ? production.year : year || production.year,
    kind,
    summary,
    genres,
    channel: production.channel || src?.channel || credit?.channel || undefined,
    updatedAt: NOW,
  };
}

export function applyIshimArchive(data: ArchiveData): ArchiveData {
  const scrapedPeople = ISHIM.people || [];
  if (!scrapedPeople.length) return data;

  const productions = [...data.productions];
  const prodById = new Map(productions.map((p) => [p.id, p]));
  const prodIndex = new Map(productions.map((p, i) => [p.id, i]));
  const byTitle = new Map<string, Production[]>();
  for (const production of productions) {
    const list = byTitle.get(production.title);
    if (list) list.push(production);
    else byTitle.set(production.title, [production]);
  }

  const people = [...data.people];
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const peopleIndex = new Map(people.map((p, i) => [p.id, i]));
  const peopleByName = new Map<string, Person>();
  const peopleByNick = new Map<string, Person>();
  // Archive primary names must not be claimed by another entry's birthName/nickname.
  const archivePrimaryKeys = new Set(
    scrapedPeople.map((p) => normalizePersonName(canonicalPersonName(p.name)))
  );
  for (const person of people) {
    rememberPersonNames(person, peopleByName, peopleByNick, {
      skipNickKeys: archivePrimaryKeys,
    });
  }

  const scrapedByS = new Map(scrapedPeople.map((p) => [p.s, p]));
  const idByS = new Map<string, string>();
  const ishimPersonIds = new Set<string>();
  const titlesByPerson = new Map<string, Set<string>>();
  const newCredits: Credit[] = [];

  const ensurePerson = (
    src: IshimPerson,
    opts?: { allowNick?: boolean }
  ): string => {
    const cached = idByS.get(src.s);
    if (cached) return cached;
    // Match scraped people by primary name only — birthName nick collisions
    // (e.g. אושיק לוי → אשר לוי) must not absorb a different archive person.
    const id = resolvePersonId(
      src.name,
      src.s,
      peopleById,
      peopleByName,
      peopleByNick,
      { allowNick: opts?.allowNick === true }
    );
    idByS.set(src.s, id);
    ishimPersonIds.add(id);

    const credits = src.credits || [];
    const classic = classicPersonFields(src);
    const patch: Partial<Person> = {
      name: src.name,
      birthDate: src.birthDate,
      deathDate: src.deathDate,
      nameOriginal: src.nameOriginal,
      nicknames: src.birthName &&
      !archivePrimaryKeys.has(normalizePersonName(src.birthName))
        ? [src.birthName]
        : [],
      tags: classic.tags,
      activities: activitiesFor(src, credits),
      ...classic,
    };

    const existing = peopleById.get(id);
    if (existing) {
      const nicknames = [
        ...new Set([
          ...(existing.nicknames || []),
          ...(patch.nicknames || []),
          ...(patch.name &&
          existing.name &&
          normalizePersonName(patch.name) !==
            normalizePersonName(existing.name)
            ? [patch.name]
            : []),
        ]),
      ];
      const updated: Person = {
        ...existing,
        // Never overwrite an established display name with a colliding birth name.
        name: existing.name?.trim() ? existing.name : patch.name || existing.name,
        birthDate: patch.birthDate || existing.birthDate,
        deathDate: patch.deathDate || existing.deathDate,
        nameOriginal: patch.nameOriginal || existing.nameOriginal,
        nicknames: nicknames.length ? nicknames : existing.nicknames,
        tags: [...new Set([...(existing.tags || []), ...(patch.tags || [])])],
        activities: [
          ...new Set([
            ...(existing.activities || []),
            ...activitiesFor(src, credits),
          ]),
        ],
        // Keep curated wiki bio; classic prose lives in ishimNotes.
        bio: existing.bio?.trim() ? existing.bio : classic.bio || "",
        ishimClassic: true,
        ishimNotes: classic.ishimNotes?.length
          ? classic.ishimNotes
          : existing.ishimNotes,
        entryAuthors: classic.entryAuthors || existing.entryAuthors,
        sourceNote: classic.sourceNote || existing.sourceNote,
        sourceUrl: classic.sourceUrl || existing.sourceUrl,
        // Preserve lean/wiki enrichment + any existing portrait.
        wikipediaUrl: existing.wikipediaUrl,
        discography: existing.discography,
        imageUrl: existing.imageUrl,
        updatedAt: NOW,
      };
      const idx = peopleIndex.get(id);
      if (idx !== undefined) people[idx] = updated;
      peopleById.set(id, updated);
      rememberPersonNames(updated, peopleByName, peopleByNick, {
        nicknames: false,
      });
    } else {
      const created: Person = {
        id,
        name: src.name,
        nameOriginal: src.nameOriginal,
        nicknames: patch.nicknames || [],
        birthDate: src.birthDate,
        deathDate: src.deathDate,
        bio: classic.bio || "",
        tags: patch.tags || [],
        activities: patch.activities || ["acting"],
        ishimClassic: true,
        ishimNotes: classic.ishimNotes,
        entryAuthors: classic.entryAuthors,
        sourceNote: classic.sourceNote,
        sourceUrl: classic.sourceUrl,
        createdAt: NOW,
        updatedAt: NOW,
      };
      peopleIndex.set(id, people.length);
      people.push(created);
      peopleById.set(id, created);
      rememberPersonNames(created, peopleByName, peopleByNick, {
        nicknames: false,
      });
    }
    return id;
  };

  for (const src of scrapedPeople) {
    ensurePerson(src, { allowNick: false });
  }

  // Register nicknames only after every archive primary exists.
  for (const id of ishimPersonIds) {
    const person = peopleById.get(id);
    if (person) {
      rememberPersonNames(person, peopleByName, peopleByNick, {
        skipNickKeys: archivePrimaryKeys,
      });
    }
  }

  const scrapedProds = ISHIM.productions || [];
  const prodByS = new Map(scrapedProds.map((p) => [p.s, p]));

  for (const src of scrapedPeople) {
    const personId = idByS.get(src.s);
    if (!personId) continue;
    const titleSet = titlesByPerson.get(personId) || new Set<string>();
    for (const credit of src.credits || []) {
      const prodKey = credit.s || credit.title;
      const prodSrc = prodKey ? prodByS.get(prodKey) : undefined;
      const productionId = resolveProductionId(
        credit.title,
        prodSrc?.year || credit.year,
        (prodSrc?.kind || credit.kind || undefined) as ProductionKind | undefined,
        productions,
        prodById,
        byTitle,
        prodIndex,
        prodKey
      );
      const current = prodById.get(productionId);
      if (current) {
        putProduction(
          patchProduction(current, prodSrc, credit),
          productions,
          prodById,
          byTitle,
          prodIndex
        );
      }
      titleSet.add(credit.title);
      newCredits.push({
        personId,
        productionId,
        role: credit.role,
        characterName: credit.character,
        year: credit.year,
        heading: ishimCreditHeading(credit, src.name),
        billingOrder:
          typeof credit.orderIndex === "number" ? credit.orderIndex : undefined,
      });
    }
    titlesByPerson.set(personId, titleSet);
  }

  for (const src of scrapedProds) {
    const productionId = resolveProductionId(
      src.title,
      src.year,
      src.kind,
      productions,
      prodById,
      byTitle,
      prodIndex,
      src.s
    );
    const current = prodById.get(productionId);
    if (current) {
      putProduction(
        patchProduction(current, src),
        productions,
        prodById,
        byTitle,
        prodIndex
      );
    }
    for (const credit of src.credits || []) {
      if (!credit.personName && !credit.personS) continue;
      let personId: string | undefined;
      if (credit.personS && idByS.has(credit.personS)) {
        personId = idByS.get(credit.personS);
      } else if (credit.personS && scrapedByS.has(credit.personS)) {
        personId = ensurePerson(scrapedByS.get(credit.personS)!);
      } else if (credit.personName) {
        const named =
          peopleByName.get(normalizePersonName(canonicalPersonName(credit.personName))) ||
          peopleByNick.get(normalizePersonName(canonicalPersonName(credit.personName)));
        if (named) personId = named.id;
        else if (credit.personS) {
          personId = ensurePerson({
            s: credit.personS,
            name: credit.personName,
            credits: [],
            keys: [],
          });
        }
      }
      if (!personId) continue;
      const titleSet = titlesByPerson.get(personId) || new Set<string>();
      titleSet.add(src.title);
      titlesByPerson.set(personId, titleSet);
      ishimPersonIds.add(personId);
      newCredits.push({
        personId,
        productionId,
        role: credit.role,
        characterName: credit.character,
        year: credit.year,
      });
    }
  }

  const creditKey = (c: Credit) =>
    `${c.personId}|${c.productionId}|${c.role}|${c.year || ""}|${c.characterName || ""}`;

  const kept = data.credits.filter((credit) => {
    if (!ishimPersonIds.has(credit.personId)) return true;
    const production = prodById.get(credit.productionId);
    if (!production) return true;
    const titles = titlesByPerson.get(credit.personId);
    if (titles?.has(production.title)) return false;
    return true;
  });

  const mergedCredits: Credit[] = [];
  const seen = new Set<string>();
  for (const credit of [...kept, ...newCredits]) {
    const key = creditKey(credit);
    if (seen.has(key)) continue;
    seen.add(key);
    mergedCredits.push(credit);
  }

  return {
    ...data,
    people,
    productions: [...prodById.values()],
    credits: mergedCredits,
  };
}
