import { slugify } from "./ids";
import type {
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";

const NOW = "2026-08-20T00:00:00.000Z";

const ISHIM_BIO =
  "הקים את אולפני הדיבוב אולפנטו ב-1991. לאחר מותו האולפנים נקנו על ידי אולפני אלרום.\n\nטריוויה: בסרט הלהקה כש מנחם עיני (בני) נשאל אם הוא אוהב גברים, המצלמה מתמקדת בפניו של יוני חן";

const PERSON_PATCH: Partial<Person> = {
  name: "יוני חן",
  nameOriginal: "Yoni Chen",
  nicknames: ["יונתן חנונו"],
  birthDate: "1953-08-10",
  deathDate: "1995-06-27",
  tags: ["בובות", "במאים", "גאים/גאות", "מדבבים"],
  activities: ["acting", "dubbing", "film", "series", "stage"],
  bio: ISHIM_BIO,
  wikipediaUrl: "https://he.wikipedia.org/wiki/יוני_חן",
};

/** הפקות קיימות בארכיון שמתאימות לערך אישים (לא ארכיון הופ־תמיר המאוחר) */
const PREFERRED_PRODUCTION_ID: Record<string, string> = {
  "פרפר נחמד": "parpar-nechmad",
  "הדרדסים": "the-smurfs-he",
  "דובוני אכפת לי": "care-bears-he",
};

const FILM_TITLES = new Set([
  "דיזנגוף 99",
  "הלהקה",
  "דאפי דאק באי הקסום",
  "לשחרר את ווילי",
  "באטמן ומסיכת התעתועים",
  "עלילות טייני טון - כיף של חופשה",
  "לוני טונס - הסרט המטורף מטורף של באגס באני",
  "דאפי דאק ומכסחי הברווזים",
  "באגס באני מתרוצץ בדרכים",
  "הדרדסים באים",
]);

const ISRAELI_TITLES = new Set([
  "פרפר נחמד",
  'מאש"ה',
  "פעם אחת",
  "בבית של פיסטוק",
  "סופרים מספרים",
  "חמש חמש",
  "דיזנגוף 99",
  "הלהקה",
]);

type IshimRow = {
  role: CreditRole;
  year: number;
  title: string;
  characterName?: string;
};

const ISHIM_ROWS: IshimRow[] = [
  { role: "writer", year: 1989, title: "פרפר נחמד" },

  {
    role: "actor",
    year: 1993,
    title: "פרפר נחמד",
    characterName: "בץ / פיט / יחזקאל הנגר / ספר / דוור / טכנאי",
  },
  { role: "actor", year: 1987, title: 'מאש"ה', characterName: "צלם" },
  { role: "actor", year: 1984, title: "פעם אחת" },
  { role: "actor", year: 1983, title: "בבית של פיסטוק", characterName: "יונתן" },
  { role: "actor", year: 1980, title: "סופרים מספרים" },
  { role: "actor", year: 1980, title: "חמש חמש", characterName: "צביקה" },
  { role: "actor", year: 1979, title: "דיזנגוף 99", characterName: "שלומי" },
  { role: "actor", year: 1978, title: "הלהקה", characterName: "דורון רודנסקי" },

  { role: "dub_director", year: 1995, title: "טום וג'רי - דור ההמשך" },
  { role: "dub_director", year: 1995, title: "עלילות טייני טון" },
  {
    role: "dub_director",
    year: 1995,
    title: "דאפי דאק באי הקסום",
    characterName: "רפליקות ישנות",
  },
  { role: "dub_director", year: 1994, title: "סיפורי סבא" },
  { role: "dub_director", year: 1994, title: "דובוני אכפת לי - דור חדש" },
  { role: "dub_director", year: 1994, title: "מחנה מפלצות קטנות" },
  { role: "dub_director", year: 1994, title: "קראטה יאו" },
  { role: "dub_director", year: 1994, title: "טין טין" },
  { role: "dub_director", year: 1994, title: "איפה אפי?" },
  { role: "dub_director", year: 1994, title: "באטמן - איש העטלף" },
  { role: "dub_director", year: 1994, title: "כוח כריש" },
  { role: "dub_director", year: 1994, title: "פליקס החתול" },
  { role: "dub_director", year: 1994, title: "לוני טונס" },
  { role: "dub_director", year: 1994, title: "טאזמניה" },
  { role: "dub_director", year: 1994, title: "באטמן ומסיכת התעתועים" },
  { role: "dub_director", year: 1993, title: "פיטר הארנב וחברים" },
  { role: "dub_director", year: 1993, title: "עלילות טדי דוב" },
  { role: "dub_director", year: 1993, title: "תיאודור החמור" },
  { role: "dub_director", year: 1993, title: "חבורת הבובונים" },
  { role: "dub_director", year: 1993, title: "עלילות טייני טון - כיף של חופשה" },
  { role: "dub_director", year: 1993, title: "סודות החיים" },
  { role: "dub_director", year: 1993, title: "כוח וידאו" },
  { role: "dub_director", year: 1993, title: "סיפורי גדליער" },
  { role: "dub_director", year: 1992, title: "ברני הכלב" },
  { role: "dub_director", year: 1992, title: "טיפ-טופ ודי-די" },
  { role: "dub_director", year: 1992, title: "רמבו: כוח החירות" },
  { role: "dub_director", year: 1992, title: "דובוני אכפת לי" },
  { role: "dub_director", year: 1991, title: "כלב הים הלבן" },
  { role: "dub_director", year: 1991, title: "ריקי-טיקי-טאבי" },
  { role: "dub_director", year: 1991, title: "אחיו של מוגלי" },
  { role: "dub_director", year: 1991, title: "ברוך הדב" },
  { role: "dub_director", year: 1991, title: "יוגי דב" },
  { role: "dub_director", year: 1991, title: "טום וג'רי" },
  { role: "dub_director", year: 1991, title: "לופי דה לופ" },
  { role: "dub_director", year: 1991, title: "לוני טונס - הסרט המטורף מטורף של באגס באני" },
  { role: "dub_director", year: 1991, title: "דאפי דאק ומכסחי הברווזים" },
  { role: "dub_director", year: 1991, title: "באגס באני מתרוצץ בדרכים" },
  { role: "dub_director", year: 1990, title: "ג'ימבו וחוג הסילון" },
  { role: "dub_director", year: 1990, title: "משפחת קדמוני" },
  { role: "dub_director", year: 1989, title: "גברת קטינה" },
  { role: "dub_director", year: 1989, title: "פיקניק הארנבים" },

  { role: "producer", year: 1995, title: "טום וג'רי - דור ההמשך" },
  { role: "producer", year: 1995, title: "עלילות טייני טון" },
  { role: "producer", year: 1995, title: "לשחרר את ווילי" },
  { role: "producer", year: 1994, title: "סיפורי סבא" },
  { role: "producer", year: 1994, title: "דובוני אכפת לי - דור חדש" },
  { role: "producer", year: 1994, title: "מחנה מפלצות קטנות" },
  { role: "producer", year: 1994, title: "קראטה יאו" },
  { role: "producer", year: 1994, title: "טין טין" },
  { role: "producer", year: 1994, title: "איפה אפי?" },
  { role: "producer", year: 1994, title: "באטמן - איש העטלף" },
  { role: "producer", year: 1994, title: "כוח כריש" },
  { role: "producer", year: 1994, title: "פליקס החתול" },
  { role: "producer", year: 1994, title: "לוני טונס" },
  { role: "producer", year: 1994, title: "טאזמניה" },
  { role: "producer", year: 1994, title: "באטמן ומסיכת התעתועים" },
  { role: "producer", year: 1993, title: "פיטר הארנב וחברים" },
  { role: "producer", year: 1993, title: "עלילות טדי דוב" },
  { role: "producer", year: 1993, title: "תיאודור החמור" },
  { role: "producer", year: 1993, title: "חבורת הבובונים" },
  { role: "producer", year: 1993, title: "עלילות טייני טון - כיף של חופשה" },
  { role: "producer", year: 1993, title: "סודות החיים" },
  { role: "producer", year: 1993, title: "כוח וידאו" },
  { role: "producer", year: 1993, title: "סיפורי גדליער" },
  { role: "producer", year: 1992, title: "טיפ-טופ ודי-די" },
  { role: "producer", year: 1992, title: "רמבו: כוח החירות" },
  { role: "producer", year: 1992, title: "דובוני אכפת לי" },
  { role: "producer", year: 1991, title: "כלב הים הלבן" },
  { role: "producer", year: 1991, title: "ריקי-טיקי-טאבי" },
  { role: "producer", year: 1991, title: "אחיו של מוגלי" },
  { role: "producer", year: 1991, title: "יוגי דב" },
  { role: "producer", year: 1991, title: "טום וג'רי" },
  { role: "producer", year: 1991, title: "לופי דה לופ" },
  { role: "producer", year: 1991, title: "לוני טונס - הסרט המטורף מטורף של באגס באני" },
  { role: "producer", year: 1991, title: "דאפי דאק ומכסחי הברווזים" },
  { role: "producer", year: 1991, title: "באגס באני מתרוצץ בדרכים" },
  { role: "producer", year: 1990, title: "ג'ימבו וחוג הסילון" },
  { role: "producer", year: 1990, title: "משפחת קדמוני" },

  {
    role: "dubber",
    year: 1995,
    title: "עלילות טייני טון",
    characterName: "פרווני / שדון סביבון / אלמר פאד / אפצ'י הקטן (קול עיטוש)",
  },
  {
    role: "dubber",
    year: 1995,
    title: "דאפי דאק באי הקסום",
    characterName: "הקטור (ארכיון)",
  },
  {
    role: "dubber",
    year: 1994,
    title: "טין טין",
    characterName: "שדרן רדיו / דמויות שונות",
  },
  { role: "dubber", year: 1994, title: "איפה אפי?", characterName: "דמויות שונות" },
  {
    role: "dubber",
    year: 1994,
    title: "באטמן - איש העטלף",
    characterName: "דמויות שונות",
  },
  { role: "dubber", year: 1994, title: "פליקס החתול", characterName: "דמויות שונות" },
  {
    role: "dubber",
    year: 1994,
    title: "לוני טונס",
    characterName: "סילבסטר / טאז / אלמר פאד / מאגסי",
  },
  {
    role: "dubber",
    year: 1994,
    title: "טאזמניה",
    characterName: "טאז השד הטאסמני / וונדל השועל",
  },
  {
    role: "dubber",
    year: 1994,
    title: "באטמן ומסיכת התעתועים",
    characterName: 'צ\'ארלס "צ\'אקי" סול',
  },
  { role: "dubber", year: 1993, title: "פיטר הארנב וחברים" },
  { role: "dubber", year: 1993, title: "תיאודור החמור" },
  { role: "dubber", year: 1993, title: "עכבר בלש" },
  { role: "dubber", year: 1993, title: "חבורת הבובונים" },
  {
    role: "dubber",
    year: 1993,
    title: "עלילות טייני טון - כיף של חופשה",
    characterName:
      'פרווני / שדון סביבון / ביירון / "הפסיכופת עם המסור" / דמויות שונות',
  },
  { role: "dubber", year: 1993, title: "עלילות בבאי", characterName: "האיש הזקן" },
  { role: "dubber", year: 1993, title: "כוח וידאו", characterName: "כוח-סוס" },
  { role: "dubber", year: 1993, title: "סיפורי גדליער", characterName: "דומו" },
  { role: "dubber", year: 1992, title: "טיפ-טופ ודי-די", characterName: "מספר" },
  {
    role: "dubber",
    year: 1992,
    title: "רמבו: כוח החירות",
    characterName: "קולנל סמואל טראוטמן / סמל האווק / דמויות שונות",
  },
  { role: "dubber", year: 1992, title: "דובוני אכפת לי", characterName: "ספחת" },
  {
    role: "dubber",
    year: 1991,
    title: "כלב הים הלבן",
    characterName: "סיקץ' / לוויתן כחול / סיוויץ' / כלבי ים שונים",
  },
  {
    role: "dubber",
    year: 1991,
    title: "ריקי-טיקי-טאבי",
    characterName: "ריקי-טיקי-טאבי / אבא של טדי / נאג",
  },
  {
    role: "dubber",
    year: 1991,
    title: "אחיו של מוגלי",
    characterName: "אבא זאב / באלו / שירחאן / טאבאקי",
  },
  {
    role: "dubber",
    year: 1991,
    title: "ברוך הדב",
    characterName: "ברוך הדב / קריינות",
  },
  { role: "dubber", year: 1991, title: "יוגי דב", characterName: "יוגי הדב" },
  { role: "dubber", year: 1991, title: "בממלכת כיעורוניה", characterName: "גרנלון" },
  {
    role: "dubber",
    year: 1991,
    title: "טום וג'רי",
    characterName: "טום / ספייק / ג'ורג'",
  },
  { role: "dubber", year: 1991, title: "לופי דה לופ", characterName: "דמויות שונות" },
  {
    role: "dubber",
    year: 1991,
    title: "לוני טונס - הסרט המטורף מטורף של באגס באני",
    characterName:
      "סילבסטר / רוקי / השטן / אביר / אליוט נס / עורך דין / משרת / חזיר / זאב / חתולים מהאגודה לגמילה מציפורים / שדרן רדיו",
  },
  {
    role: "dubber",
    year: 1991,
    title: "דאפי דאק ומכסחי הברווזים",
    characterName: "סילבסטר / קריינות",
  },
  {
    role: "dubber",
    year: 1991,
    title: "באגס באני מתרוצץ בדרכים",
    characterName: "אלמר פאד / מרווין / סולטן / ג'יני / שוטר צרפתי",
  },
  {
    role: "dubber",
    year: 1990,
    title: "ג'ימבו וחוג הסילון",
    characterName: "רב פקח / מספר / דמויות שונות",
  },
  { role: "dubber", year: 1990, title: "רובימא", characterName: "המנכ\"ל" },
  {
    role: "dubber",
    year: 1990,
    title: "צבי הנינג'ה",
    characterName: "ספלינטר / טאטסו / שליח פיצה",
  },
  { role: "dubber", year: 1990, title: "עמיקו וחבריו", characterName: "דמויות שונות" },
  {
    role: "dubber",
    year: 1990,
    title: "נעלולים",
    characterName: "נעליז / נעל חרש / נעלוף",
  },
  {
    role: "dubber",
    year: 1990,
    title: "משפחת קדמוני",
    characterName: "מר סלייט / דמויות שונות",
  },
  { role: "dubber", year: 1990, title: "היי! בינבה", characterName: "דמויות שונות" },
  {
    role: "dubber",
    year: 1989,
    title: "גברת קטינה",
    characterName: "מספר / דמויות שונות",
  },
  { role: "dubber", year: 1989, title: "דובי דב" },
  { role: "dubber", year: 1989, title: "אליחדק וחברים" },
  { role: "dubber", year: 1989, title: "פיקניק הארנבים", characterName: "ראש העיר" },
  { role: "dubber", year: 1989, title: "הקוסם מארץ עוץ", characterName: "איש הפח" },
  { role: "dubber", year: 1988, title: "דן-דין השופט", characterName: "בינו" },
  { role: "dubber", year: 1987, title: "קיד וידאו", characterName: "קיד / חיקול רזה" },
  {
    role: "dubber",
    year: 1987,
    title: "נילס הולגרסון",
    characterName: "מולי / גוסטר / גורגו",
  },
  { role: "dubber", year: 1986, title: "בול וביל", characterName: "ביל" },
  { role: "dubber", year: 1986, title: "הרוח בערבי הנחל", characterName: "קרפד" },
  {
    role: "dubber",
    year: 1986,
    title: "טוב טוב הגמד",
    characterName: "טרולים / גמדים / דמויות שונות",
  },
  {
    role: "dubber",
    year: 1986,
    title: "נילס הולגרסון",
    characterName: "מולי / גוסטר / גורגו / עורבים",
  },
  { role: "dubber", year: 1986, title: "נחשון", characterName: "נחשון" },
  { role: "dubber", year: 1984, title: "טום וטים", characterName: "מספר" },
  {
    role: "dubber",
    year: 1984,
    title: "הדרדסים באים",
    characterName: "רגזני / גנדרני / ישנוני",
  },
  {
    role: "dubber",
    year: 1984,
    title: "בארץ הקטקטים",
    characterName: 'ד"ר דוקלין / אדון מיימון / מונגר / אבא של טיפטיפון',
  },
  {
    role: "dubber",
    year: 1984,
    title: "הדרדסים",
    characterName:
      "רגזני / חולמני / ישנוני / זללני / גנדרני / דרדס גשש / פה גדול / דמויות שונות",
  },
  { role: "dubber", year: 1982, title: "בזיק ויויו" },
  { role: "dubber", year: 1982, title: "קוטי הקטר" },

  {
    role: "singer",
    year: 2010,
    title: "משפחת קדמוני",
    characterName: "שיר פתיחה (תרגום)",
  },
  {
    role: "singer",
    year: 1996,
    title: "טום וג'רי - דור ההמשך",
    characterName: "שיר פתיחה (מילים)",
  },
  {
    role: "singer",
    year: 1994,
    title: "דובוני אכפת לי - דור חדש",
    characterName: "שירה",
  },
  {
    role: "singer",
    year: 1994,
    title: "פליקס החתול",
    characterName: "שיר פתיחה (תרגום)",
  },
  {
    role: "singer",
    year: 1994,
    title: "טאזמניה",
    characterName: "שיר פתיחה (תרגום)",
  },
  {
    role: "singer",
    year: 1993,
    title: "עלילות טדי דוב",
    characterName: "שיר פתיחה (תרגום)",
  },
  {
    role: "singer",
    year: 1993,
    title: "תיאודור החמור",
    characterName: "שיר פתיחה (תרגום)",
  },
  {
    role: "singer",
    year: 1993,
    title: "כוח וידאו",
    characterName: "שיר פתיחה (תרגום)",
  },
  {
    role: "singer",
    year: 1992,
    title: "ברני הכלב",
    characterName: "שיר פתיחה (מילים)",
  },
  {
    role: "singer",
    year: 1991,
    title: "לוני טונס - הסרט המטורף מטורף של באגס באני",
    characterName: "שירה",
  },
  {
    role: "singer",
    year: 1990,
    title: "משפחת קדמוני",
    characterName: "שיר פתיחה (תרגום)",
  },
  {
    role: "singer",
    year: 1986,
    title: "נחשון",
    characterName: "ביצוע שיר הפתיחה",
  },
];

function kindFor(title: string): ProductionKind {
  if (FILM_TITLES.has(title)) {
    return ISRAELI_TITLES.has(title) ? "film_cinema" : "film_dubbed_foreign";
  }
  if (ISRAELI_TITLES.has(title)) {
    return title === "סופרים מספרים" ? "tv_program" : "tv_series";
  }
  return "series";
}

function isPlausibleClassicMatch(production: Production, year: number): boolean {
  if (production.year === year) return true;
  if (Math.abs(production.year - year) <= 2) return true;
  if (production.id.startsWith("ht-") && production.year > 2000) return false;
  return production.year <= 1996 && year <= 1996;
}

function newProduction(title: string, year: number): Production {
  const base = slugify(title) || "ishim-prod";
  return {
    id: `ishim-${base}`,
    title,
    year,
    kind: kindFor(title),
    summary: "",
    genres: ISRAELI_TITLES.has(title) ? ["ישראלי"] : ["מדובב", "ילדים"],
    createdAt: NOW,
    updatedAt: NOW,
    dubbingStudio: ISRAELI_TITLES.has(title) ? undefined : "אולפנטו",
  };
}

function resolveProduction(
  title: string,
  year: number,
  productions: Production[],
  byId: Map<string, Production>
): string {
  const preferred = PREFERRED_PRODUCTION_ID[title];
  if (preferred && byId.has(preferred)) {
    const existing = byId.get(preferred)!;
    if (existing.title !== title) {
      byId.set(preferred, { ...existing, title });
      const idx = productions.findIndex((p) => p.id === preferred);
      if (idx >= 0) productions[idx] = byId.get(preferred)!;
    }
    return preferred;
  }

  const exactTitle = productions.filter((p) => p.title === title);
  const match =
    exactTitle.find((p) => p.year === year) ||
    exactTitle.find((p) => isPlausibleClassicMatch(p, year));
  if (match) return match.id;

  const created = newProduction(title, year);
  let id = created.id;
  if (byId.has(id) && byId.get(id)!.title !== title) {
    id = `${created.id}-${year}`;
  }
  if (!byId.has(id)) {
    const production = { ...created, id };
    productions.push(production);
    byId.set(id, production);
  }
  return id;
}

export function applyIshimYoniChen(data: ArchiveData): ArchiveData {
  const productions = [...data.productions];
  const byId = new Map(productions.map((p) => [p.id, p]));

  const yoniCredits: Credit[] = ISHIM_ROWS.map((row) => ({
    personId: "yoni-chen",
    productionId: resolveProduction(row.title, row.year, productions, byId),
    role: row.role,
    characterName: row.characterName,
    year: row.year,
  }));

  const credits = [
    ...data.credits.filter((c) => c.personId !== "yoni-chen"),
    ...yoniCredits,
  ];

  let found = false;
  const people = data.people.map((person) => {
    if (person.id !== "yoni-chen") return person;
    found = true;
    return {
      ...person,
      ...PERSON_PATCH,
      imageUrl: person.imageUrl,
      wikipediaUrl: person.wikipediaUrl || PERSON_PATCH.wikipediaUrl,
      createdAt: person.createdAt,
      updatedAt: NOW,
    };
  });
  if (!found) {
    people.push({
      id: "yoni-chen",
      name: "יוני חן",
      nicknames: PERSON_PATCH.nicknames || [],
      tags: PERSON_PATCH.tags || [],
      activities: PERSON_PATCH.activities || ["dubbing"],
      bio: ISHIM_BIO,
      birthDate: PERSON_PATCH.birthDate,
      deathDate: PERSON_PATCH.deathDate,
      nameOriginal: PERSON_PATCH.nameOriginal,
      wikipediaUrl: PERSON_PATCH.wikipediaUrl,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  return {
    ...data,
    people,
    productions: [...byId.values()],
    credits,
  };
}
