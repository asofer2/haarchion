import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import type { ArchiveData, Credit, Person, Production } from "./types";

const ID = "tlpnvly";
const TITLE = "טלפנולי";
const WIKI = "https://he.wikipedia.org/wiki/%D7%98%D7%9C%D7%A4%D7%A0%D7%95%D7%9C%D7%99";
const NOW = "2026-10-07T12:00:00.000Z";

const CAST: { name: string; preferredId?: string; characterName: string }[] = [
  { name: "אור ישראלי", characterName: "נולי" },
  { name: "יגאל עדיקא", preferredId: "yigal-adika", characterName: "דובי" },
  { name: "ארז בן הרוש", characterName: "גאולה / פנחס" },
  { name: "אביעד בנטוב", preferredId: "abyad-bntvb", characterName: "דמויות נוספות" },
];

function nameKey(name: string): string {
  return normalizePersonName(name);
}

function findPerson(people: Person[], name: string, preferredId?: string): Person | undefined {
  if (preferredId) {
    const preferred = people.find((person) => person.id === preferredId);
    if (preferred) return preferred;
  }
  const key = nameKey(name);
  return people.find((person) => nameKey(person.name) === key);
}

function ensurePerson(people: Person[], name: string, preferredId?: string): Person {
  const existing = findPerson(people, name, preferredId);
  if (existing) {
    if (existing.activities?.includes("dubbing")) return existing;
    const next: Person = {
      ...existing,
      activities: [...(existing.activities || []), "dubbing"],
    };
    const at = people.indexOf(existing);
    if (at >= 0) people[at] = next;
    return next;
  }
  const id = preferredId && !people.some((person) => person.id === preferredId)
    ? preferredId
    : slugify(name);
  const person: Person = {
    id,
    name,
    nicknames: [],
    bio: "",
    tags: ["מדבבים"],
    activities: ["dubbing"],
    sourceNote: "ויקיפדיה",
    sourceUrl: WIKI,
    imageUrl: portrait(name, undefined, { kind: "person", personId: id }),
    createdAt: NOW,
    updatedAt: NOW,
  };
  people.push(person);
  return person;
}

function storedImage(url?: string): boolean {
  if (!url) return false;
  if (url.startsWith("/images/") || url.startsWith("data:")) return true;
  return (
    /^https?:\/\//i.test(url) &&
    !url.includes("/api/portrait") &&
    !url.includes("/api/wiki-image")
  );
}

/**
 * טלפנולי אושרה כסדרה זרה בלי קרדיטים. לפי ויקיפדיה זו סדרה ישראלית,
 * והמדבבים והדמויות הם: נולי, דובי, גאולה / פנחס, דמויות נוספות.
 */
export function applyTelepenoli(data: ArchiveData): ArchiveData {
  const people = [...data.people];
  const productions = [...data.productions];
  const index = productions.findIndex(
    (production) => production.id === ID || production.title.trim() === TITLE
  );
  const previous = index >= 0 ? productions[index] : undefined;
  const id = previous?.id || ID;
  const production: Production = {
    ...(previous || {
      id,
      createdAt: NOW,
    }),
    id,
    title: TITLE,
    year: 2001,
    endYear: 2003,
    airStatus: "ended",
    kind: "tv_series",
    channel: "Fox Kids",
    runtimeMinutes: 25,
    genres: ["הנפשה", "ילדים", "קומדיה", "שעשועון"],
    summary:
      "טלפנולי היא סדרת הנפשה ושעשועון טלוויזיה קומי ישראלי ששודרה ב-Fox Kids, המבוססת על תוכנה שנרכשה מחברה דנית בשם \"Animation TV\". התוכנית שודרה משנת 2001 עד שנת 2003 והונחתה על ידי שתי דמויות מונפשות: נולי, ילדה בת 8, ודובי, דב הצעצוע שלה. דמויות נוספות, ובהן גאולה ופנחס, דובבו באותה תוכנית.",
    sourceNote: "ויקיפדיה",
    sourceUrl: WIKI,
    imageUrl: storedImage(previous?.imageUrl)
      ? previous?.imageUrl
      : portrait(TITLE, undefined, { kind: "film", productionId: id }),
    updatedAt: NOW,
  };
  if (index >= 0) productions[index] = production;
  else productions.push(production);

  const cast = CAST.map((row, billingOrder) => {
    const person = ensurePerson(people, row.name, row.preferredId);
    const credit: Credit = {
      personId: person.id,
      productionId: id,
      role: "dubber",
      heading: "מדבב",
      characterName: row.characterName,
      billingOrder,
    };
    return credit;
  });

  const credits = [
    ...data.credits.filter((credit) => credit.productionId !== id),
    ...cast,
  ];

  return { ...data, people, productions, credits };
}
