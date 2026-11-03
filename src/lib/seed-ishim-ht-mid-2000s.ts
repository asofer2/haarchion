import { canonicalPersonName } from "./aliases";
import { assignBillingOrders } from "./credit-order";
import { normalizePersonName } from "./dedupe";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
} from "./types";
import { roleToActivity } from "./types";

const NOW = "2026-11-03T00:00:00.000Z";
const SOURCE_NOTE = "ערוץ הופ תמיר";

type Row = {
  personName: string;
  role: CreditRole;
  heading: string;
  character?: string;
};

type Show = {
  production: Production;
  credits: Row[];
  matches: (production: Production) => boolean;
};

function show(
  production: Production,
  credits: Row[],
  matches: (production: Production) => boolean
): Show {
  return { production, credits, matches };
}

const HOOD_ID = "ishim-kyph-advmh-hsypvr-hamyty";
const BEAR_ID = "brother-bear-he";
const BEAR2_ID = "ishim-achy-hdvb-2";
/** הכתובת הקיימת באתר לסרט 2004. */
export const THUNDER_FILM_ID = "ishim-knpy-hram";
export const THUNDER_SERIES_ID = "ishim-knpy-hram-sdrh";
const RANGE_ID = "ishim-mrd-hchyvt";

const HOOD: Production = {
  id: HOOD_ID,
  title: "כיפה אדומה - הסיפור האמיתי",
  originalTitle: "Hoodwinked!",
  year: 2006,
  kind: "film_dubbed_foreign",
  summary:
    "חוקר מגיע לביתה של סבתא וחוקר את כל הדמויות בסיפור בנוגע למה שקרה. כך מתקבל אותו סיפור מנקודות מבט שונות",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "פשע"],
  runtimeMinutes: 80,
  ishimClassic: true,
  imageUrl: portrait("כיפה אדומה - הסיפור האמיתי", "Hoodwinked"),
  sourceNote: SOURCE_NOTE,
  sourceUrl:
    "https://sites.google.com/view/hoptamir/%D7%9B%D7%99%D7%A4%D7%94-%D7%90%D7%93%D7%95%D7%9E%D7%94-%D7%94%D7%A1%D7%99%D7%A4%D7%95%D7%A8-%D7%94%D7%90%D7%9E%D7%99%D7%AA%D7%99-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D",
  createdAt: NOW,
  updatedAt: NOW,
};

const BEAR: Production = {
  id: BEAR_ID,
  title: "אחי הדוב",
  originalTitle: "Brother Bear",
  year: 2003,
  kind: "film_dubbed_foreign",
  summary:
    "צייד אינואיטי צעיר ששונא דובים, הופך לפתע לדוב גריזלי ולומד על ההנאות שבחיי הדוב ועל הדוב שהרג את אחיו הבכור",
  genres: ["אנימציה", "דרמה", "ילדים", "מדובב - זר", "נוער", "פנטזיה", "קומדיה"],
  runtimeMinutes: 85,
  ishimClassic: true,
  imageUrl: portrait("אחי הדוב", "Brother Bear"),
  sourceNote: SOURCE_NOTE,
  sourceUrl:
    "https://sites.google.com/view/hoptamir/%D7%90%D7%97%D7%99-%D7%94%D7%93%D7%95%D7%91-2003-%D7%90%D7%99%D7%A9%D7%99%D7%9D",
  createdAt: NOW,
  updatedAt: NOW,
};

const BEAR2: Production = {
  id: BEAR2_ID,
  title: "אחי הדוב 2",
  originalTitle: "Brother Bear 2",
  year: 2006,
  kind: "film_dubbed_foreign",
  summary: "חברה ותיקה של קינאי צריכה את עזרתו במסע, למרות רוחו של קודה הקטן",
  genres: ["אנימציה", "דרמה", "מדובב - זר", "מוזיקלי", "נוער", "פנטזיה", "קומדיה"],
  runtimeMinutes: 73,
  ishimClassic: true,
  imageUrl: portrait("אחי הדוב 2", "Brother Bear 2"),
  sourceNote: SOURCE_NOTE,
  sourceUrl:
    "https://sites.google.com/view/hoptamir/%D7%90%D7%97%D7%99-%D7%94%D7%93%D7%95%D7%91-2-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D",
  createdAt: NOW,
  updatedAt: NOW,
};

const THUNDER: Production = {
  id: THUNDER_FILM_ID,
  title: "כנפי הרעם",
  originalTitle: "Thunderbirds",
  year: 2004,
  kind: "film_dubbed_foreign",
  summary:
    "כשהברדס מוצא את הבסיס הסודי של משפחת טרייסי ולוכד את רוב המשפחה, רק בנם הצעיר אלן וחבריו יכולים להציל את היום",
  genres: [
    "אנימציה",
    "דרמה",
    "הרפתקאות",
    "ילדים",
    "מדובב - זר",
    "מדע בדיוני",
    "נוער",
    "פנטזיה",
    "פעולה",
  ],
  runtimeMinutes: 95,
  ishimClassic: true,
  ishimNotes: [
    {
      heading: "ציטוטים",
      items: ['"5, 4, 3, 2, 1, כנפי הרעם – לדרך!"'],
    },
  ],
  imageUrl: portrait("כנפי הרעם", "Thunderbirds"),
  sourceNote: SOURCE_NOTE,
  sourceUrl:
    "https://sites.google.com/view/hoptamir/%D7%9B%D7%A0%D7%A4%D7%99-%D7%94%D7%A8%D7%A2%D7%9D-2004-%D7%90%D7%99%D7%A9%D7%99%D7%9D",
  createdAt: NOW,
  updatedAt: NOW,
};

export const THUNDER_SERIES: Production = {
  id: THUNDER_SERIES_ID,
  title: "כנפי הרעם",
  year: 1994,
  kind: "series",
  summary:
    "במאה ה-21, משפחת טרייסי עובדת בארגון סודי בינלאומי הפועל להצלת העולם",
  genres: ["דרמה", "הרפתקאות", "מדובב - זר", "מדע בדיוני", "פנטזיה", "פעולה"],
  ishimClassic: true,
  createdAt: NOW,
  updatedAt: NOW,
};

const RANGE: Production = {
  id: RANGE_ID,
  title: "מרד החיות",
  originalTitle: "Home on the Range",
  year: 2004,
  kind: "film_dubbed_foreign",
  summary:
    "כדי להציל את החווה שלהן, החיות המקומיות הולכות לציד פורעי חוק ידועים לשימצא",
  genres: ["אנימציה", "ילדים", "מדובב - זר", "קומדיה"],
  runtimeMinutes: 76,
  ishimClassic: true,
  imageUrl: portrait("מרד החיות", "Home on the Range"),
  sourceNote: SOURCE_NOTE,
  sourceUrl:
    "https://sites.google.com/view/hoptamir/%D7%9E%D7%A8%D7%93-%D7%94%D7%97%D7%99%D7%95%D7%AA-2004-%D7%90%D7%99%D7%A9%D7%99%D7%9D",
  createdAt: NOW,
  updatedAt: NOW,
};

function dub(name: string, character?: string): Row {
  return { personName: name, role: "dubber", heading: "מדבבים", character };
}
function crew(name: string, role: CreditRole, heading: string): Row {
  return { personName: name, role, heading };
}
function music(name: string, character: string): Row {
  return { personName: name, role: "singer", heading: "מוזיקה", character };
}

const SHOWS: Show[] = [
  show(
    HOOD,
    [
      crew("שפרירה זכאי", "dub_director", "בימוי דיבוב"),
      crew("שפרירה זכאי", "producer", "הפקת דיבוב"),
      dub("אגם רודברג", 'כיפה "כיפ" אדומה'),
      dub("אלי גורנשטיין", "הזאב"),
      dub("עידו מוסרי", "טוויצ'י"),
      dub("מיקי קם", "סבתא"),
      dub("יובל זמיר", "הצייד"),
      dub("טל פרידמן", "ניקי הצפרדע"),
      dub("יורם יוספסברג", "המפקח גריזלי"),
      dub("שמעון כהן", "הבלש ביל החסידה / דמויות שונות"),
      dub("מומי לוי", "התייש המזמר"),
      dub("אלון אופיר", "בוינגו"),
      dub("דורון רביץ", "ריטה התנית"),
      dub("דב רייזר", "דולף / דמויות שונות"),
      dub("מיכה אוזין סליאן", "דמויות שונות"),
      dub("איציק סיידוף", "דמויות שונות"),
      dub("אדם זמק", "נקר / ילדים"),
      dub("שירה זמק", "ילדות"),
      music("מומי לוי", "שירה"),
      music("רוני וייס", "ניהול מוזיקלי"),
    ],
    (production) =>
      production.id === HOOD_ID ||
      (production.title === HOOD.title && production.year === 2006)
  ),
  show(
    BEAR,
    [
      crew("שפרירה זכאי", "dub_director", "בימוי דיבוב"),
      crew("שפרירה זכאי", "producer", "הפקת דיבוב"),
      dub("אלון אופיר", "קינאי"),
      dub("אלון ברנד", "קודה"),
      dub("מיכאל הנגבי", "דנאהי"),
      dub("דב רייזר", "דנאהי הזקן"),
      dub("דן תורן", "סיטקה"),
      dub("רות גלר", "טאנאנה"),
      dub("דור צויגנבום", "ראט"),
      dub("איציק סיידוף", "טיוק"),
      dub("מיכה אוזין סליאן", "טאג"),
      dub("יורם יוספסברג", "אייל 1"),
      dub("שמעון כהן", "אייל 2 / דוב מאוהב"),
      dub("סיון שביט", "דובה צעירה / סנאית"),
      dub("שפרירה זכאי", "דובה זקנה"),
      dub("יעל דקלבאום", "אמא של קודה / אישה"),
      dub("לירז ברגמן"),
      dub("אמנדה סורודי", "אישה"),
      dub("יסמין עיון", "קולות רקע"),
      dub("מיקי ילון", "קולות רקע"),
      music("עמי מנדלמן", "שירה"),
      music("סיון", "שירה"),
      music("רמי קלינשטיין", "שירה"),
      music("מומי לוי", "שירה"),
      music("רוני וייס", "ניהול מוזיקלי"),
    ],
    (production) =>
      production.id === BEAR_ID ||
      (production.title === "אחי הדוב" && production.year === 2003)
  ),
  show(
    BEAR2,
    [
      crew("שפרירה זכאי", "dub_director", "בימוי דיבוב"),
      crew("שפרירה זכאי", "producer", "הפקת דיבוב"),
      dub("אלון אופיר", "קינאי"),
      dub("גיא קרסנר", "קודה"),
      dub("טלי אורן", "ניטה"),
      dub("שפרירה זכאי", "אנדה"),
      dub("יעל עמית", "קאטה / דודה סיקיניק"),
      dub("נורית כהן", "אינוקו"),
      dub("שרית סרי", "דודה טאקיק"),
      dub("אוהד שחר", "ברינג"),
      dub("דב רייזר", "צ'ילקוט"),
      dub("דור צויגנבום", "ראט"),
      dub("איציק סיידוף", "טיוק"),
      dub("מיכה אוזין סליאן", "טאג / אטקה"),
      dub("אבינועם עמית יוסף", "קינאי הילד / קולות רקע"),
      dub("ליאנה עיון", "ניטה הילדה / קולות רקע"),
      dub("לימור שפירא", "דובה"),
      dub("מומי לוי", "קולות רקע"),
      music("מומי לוי", "שירה"),
      music("סיניה בועז", "שירה"),
      music("רוני וייס", "ניהול מוזיקלי"),
    ],
    (production) =>
      production.id === BEAR2_ID ||
      (production.title === "אחי הדוב 2" && production.year === 2006)
  ),
  show(
    THUNDER,
    [
      crew("שפרירה זכאי", "dub_director", "בימוי דיבוב"),
      crew("שפרירה זכאי", "producer", "הפקת דיבוב"),
      dub("יהונתן מגון", "אלן טרייסי"),
      dub("איל כהן", "פרמאט האקנבייקר"),
      dub("גל סרי", "טינטין"),
      dub("לימור שפירא", "גברת פנלופי"),
      dub("אוהד שחר", "ג'ף טרייסי"),
      dub("זיו מאיר", "סקוט טרייסי"),
      dub("עפרון אטקין", "ג'ון טרייסי / צ'אק לי / קולות רקע"),
      dub("אלון אופיר", "וירג'יל טרייסי"),
      dub("דורון בן עמי", "גורדון טרייסי / ילד בבית ספר"),
      dub("דור צויגנבום", 'ריי "מוח" האקנבייקר'),
      dub("שפרירה זכאי", "אונה"),
      dub("דב רייזר", "קיראנו / מנהל בית הספר"),
      dub("הדר שחף-מעיין", "מיס גארט / מחשב מערכת"),
      dub("יהויכין פרידלנדר", "פארקר"),
      dub("מיכל צפיר", "ליסה הארב"),
      dub("יורם יוספסברג", "הברדס"),
      dub("מיכה אוזין סליאן", "מאריון / קריין פתיח"),
      dub("יסמין עיון", "טרנסום / אמא של דניאל / ילדה"),
      dub("שרית סרי"),
      dub("עומר ברנד", "דניאל / ילד בבית ספר"),
    ],
    (production) => {
      if (production.title !== "כנפי הרעם") return false;
      if (production.id === THUNDER_SERIES_ID || production.id.endsWith("-sdrh")) {
        return false;
      }
      if (production.kind === "series" || production.kind === "tv_series") return false;
      if (production.year === 1994) return false;
      return (
        production.id === THUNDER_FILM_ID ||
        production.id.endsWith("-srt") ||
        production.year === 2004
      );
    }
  ),
  show(
    RANGE,
    [
      crew("שפרירה זכאי", "dub_director", "בימוי דיבוב"),
      crew("שפרירה זכאי", "producer", "הפקת דיבוב"),
      dub("ענת וקסמן", "מגי הפרה"),
      dub("רבקה מיכאלי", "קאלוואי הפרה"),
      dub("רמה מסינגר", "גרייס הפרה"),
      dub("ליאור אשכנזי", "באק הסוס"),
      dub("דור צויגנבום", 'ג\'ק "בר המזל"'),
      dub("דבי בסרגליק", "פרל גסנר"),
      dub("דב רייזר", "השריף סם"),
      dub("עפרון אטקין", "ראסטי / פטריק / קולות רקע"),
      dub("אוהד שחר", "ג'ב התיש"),
      dub("שרית סרי", "אודרי התרנגולת"),
      dub("אלי גורנשטיין", "אלמדה סלים"),
      dub("מיכה אוזין סליאן", "ריקו / זקן משוגע"),
      dub("יורם יוספסברג", "ג'וניור הבאפלו / חמור / קולות רקע"),
      dub("תומר שרון", "האחים ווילי"),
      dub("יהויכין פרידלנדר", "אבנר / לארי / ווסלי"),
      dub("שמעון כהן", "אולי / ברי / מורס / טומי"),
      dub("איציק סיידוף", "בוב / נשר / נהג רכבת רגזן"),
      dub("יסמין עיון", "חזירון"),
      dub("ליאנה עיון", "חזירון"),
      dub("מיקי ילון", "חזירון"),
      dub("לימור שפירא", "אנני"),
      crew("שפרירה זכאי", "singer", "מוזיקה"),
      music("יהודית רביץ", "שירה"),
      music("יגאל קמינקא", "מקהלה"),
      music("לירון אל-על", "מקהלה"),
      music("רון גנג", "מקהלה"),
      music("רפי זליג", "מקהלה"),
      music("רוני וייס", "ניהול מוזיקלי"),
    ],
    (production) =>
      production.id === RANGE_ID ||
      (production.title === "מרד החיות" && production.year === 2004)
  ),
];

const BY_TITLE = new Map(SHOWS.map((item) => [item.production.title, item]));

/** הפקה מוכרת לדף אישים, בלי לחכות לקטלוג המלא. */
export function hopMid2000sProduction(
  title: string,
  year?: number
): Production | undefined {
  if (title === "כנפי הרעם") {
    if (!year || year === 2004) return THUNDER;
    if (year >= 1990 && year <= 1999) return THUNDER_SERIES;
    return undefined;
  }
  const item = BY_TITLE.get(title);
  if (!item) return undefined;
  if (!year || item.production.year === year) return item.production;
  return undefined;
}

function activitiesFor(role: CreditRole): ActivityCategory[] {
  const activity = roleToActivity(role);
  return activity === "film" ? ["film"] : [activity, "film"];
}

function stubPerson(name: string, role: CreditRole, production: Production): Person {
  const canonical = canonicalPersonName(name);
  return {
    id: `ht-${slugify(canonical) || "person"}`,
    name: canonical,
    nicknames: [],
    bio: "",
    tags: ["דיבוב", "הופ תמיר"],
    activities: activitiesFor(role),
    sourceNote: SOURCE_NOTE,
    sourceUrl: production.sourceUrl,
    imageUrl: portrait(canonical),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function resolvePersonId(
  name: string,
  role: CreditRole,
  production: Production,
  people: Person[],
  byName: Map<string, Person>,
  byId: Map<string, Person>
): string {
  const key = normalizePersonName(canonicalPersonName(name));
  const existing = key ? byName.get(key) : undefined;
  if (existing) return existing.id;
  let person = stubPerson(name, role, production);
  if (byId.has(person.id) && byId.get(person.id)!.name !== person.name) {
    person = { ...person, id: `${person.id}-2` };
  }
  if (!byId.has(person.id)) {
    people.push(person);
    byId.set(person.id, person);
    byName.set(normalizePersonName(person.name), person);
  }
  return person.id;
}

/** חמישה דיבובים מעמודי הופ תמיר, 2003–2006. */
export function applyIshimHopMid2000s(data: ArchiveData): ArchiveData {
  const people = [...data.people];
  const byId = new Map(people.map((person) => [person.id, person]));
  const byName = new Map<string, Person>();
  for (const person of people) {
    byName.set(normalizePersonName(person.name), person);
    byName.set(normalizePersonName(canonicalPersonName(person.name)), person);
    for (const nick of person.nicknames || []) {
      const key = normalizePersonName(nick);
      if (key && !byName.has(key)) byName.set(key, person);
    }
  }

  let productions = [...data.productions];
  const replaced = new Set<string>();
  const added: Credit[] = [];

  for (const item of SHOWS) {
    const found = productions.filter(item.matches);
    for (const production of found) replaced.add(production.id);
    const previous = found.find((production) => production.id === item.production.id) || found[0];
    productions = productions.filter((production) => !item.matches(production));
    productions.push({
      ...item.production,
      imageUrl: previous?.imageUrl || item.production.imageUrl,
      createdAt: previous?.createdAt || NOW,
      updatedAt: NOW,
    });
    added.push(
      ...assignBillingOrders(
        item.credits.map((row) => ({
          personId: resolvePersonId(
            row.personName,
            row.role,
            item.production,
            people,
            byName,
            byId
          ),
          productionId: item.production.id,
          role: row.role,
          heading: row.heading,
          characterName: row.character,
          year: item.production.year,
        }))
      )
    );
  }

  return {
    ...data,
    people,
    productions,
    credits: [
      ...data.credits.filter((credit) => !replaced.has(credit.productionId)),
      ...added,
    ],
  };
}
