import type { ActivityCategory, ArchiveData, CreditRole } from "./types";

/**
 * מוסיף לכל אישיות את קטגוריות המקצוע:
 * - «שחקן» (acting) — לפי קרדיט actor או פעילות משחק (סרטים/סדרות/במה)
 * - «מדבב» (dubbing) — לפי קרדיט מדבב/במאי דיבוב או פעילות דיבוב קיימת
 */
export function applyDerivedProfessionActivities(
  data: ArchiveData
): ArchiveData {
  const extras = new Map<string, Set<ActivityCategory>>();

  const bump = (personId: string, cat: ActivityCategory) => {
    let set = extras.get(personId);
    if (!set) {
      set = new Set();
      extras.set(personId, set);
    }
    set.add(cat);
  };

  for (const credit of data.credits) {
    const role = credit.role as CreditRole;
    if (role === "actor") bump(credit.personId, "acting");
    if (role === "dubber" || role === "dub_director") {
      bump(credit.personId, "dubbing");
    }
  }

  for (const person of data.people) {
    const acts = person.activities || [];
    if (
      acts.includes("film") ||
      acts.includes("series") ||
      acts.includes("stage") ||
      acts.includes("acting")
    ) {
      bump(person.id, "acting");
    }
    if (acts.includes("dubbing")) {
      bump(person.id, "dubbing");
    }
  }

  return {
    ...data,
    people: data.people.map((person) => {
      const add = extras.get(person.id);
      if (!add?.size) return person;
      return {
        ...person,
        activities: [...new Set([...(person.activities || []), ...add])],
      };
    }),
  };
}
