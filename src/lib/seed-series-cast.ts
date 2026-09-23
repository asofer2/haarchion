import type { ActivityCategory, Credit, Person } from "./types";
import { portrait } from "./portrait";

const now = "2026-07-21T18:00:00.000Z";

function wikiImage(title: string) {
  return portrait(title);
}

function p(
  id: string,
  name: string,
  activities: ActivityCategory[],
  bio: string,
  extra: Partial<Person> = {}
): Person {
  return {
    id,
    name,
    nicknames: extra.nicknames || [],
    tags: extra.tags || ["משחק"],
    activities,
    bio,
    nameOriginal: extra.nameOriginal,
    birthDate: extra.birthDate,
    deathDate: extra.deathDate,
    wikipediaUrl: extra.wikipediaUrl,
    imageUrl: extra.imageUrl ?? wikiImage(name),
    createdAt: now,
    updatedAt: now,
  };
}

function c(
  personId: string,
  productionId: string,
  role: Credit["role"],
  characterName?: string
): Credit {
  return { personId, productionId, role, characterName };
}

/**
 * Wikipedia-sourced casts for main Israeli series / kids programs.
 * Corrects earlier wrong links (e.g. Fauda ≠ Lior Ashkenazi).
 */
export const SERIES_CAST_PEOPLE: Person[] = [
  // —— שטיסל ——
  p("dov-glickman", "דב גליקמן", ["series", "film", "stage"], "שחקן ישראלי. גילם את שלום שטיסל בסדרה „שטיסל”.", {
    nicknames: ["דובל'ה גליקמן", "Dov Glickman"],
    nameOriginal: "Dov Glickman",
    tags: ["דרמה", "שטיסל"],
  }),
  p("neta-riskin", "נטע ריסקין", ["series", "film", "stage"], "שחקנית ישראלית. גילמה את גיטי וייס ב„שטיסל”.", {
    nameOriginal: "Neta Riskin",
    tags: ["דרמה", "שטיסל"],
  }),
  p("shira-haas", "שירה האס", ["series", "film", "stage"], "שחקנית ישראלית. גילמה את רוח׳לה ב„שטיסל”.", {
    nameOriginal: "Shira Haas",
    tags: ["דרמה", "שטיסל"],
  }),
  p("sasson-gabay", "ששון גבאי", ["series", "film", "stage"], "שחקן ישראלי. גילם את נחמיה וייס ב„שטיסל”.", {
    nameOriginal: "Sasson Gabai",
    tags: ["דרמה"],
  }),
  p("hadas-yaron", "הדס ירון", ["series", "film", "stage"], "שחקנית ישראלית. השתתפה ב„שטיסל”.", {
    nameOriginal: "Hadas Yaron",
  }),
  p("zohar-strauss", "זהר שטראוס", ["series", "film", "stage"], "שחקן ישראלי. גילם את ליפא וייס ב„שטיסל”.", {
    nameOriginal: "Zohar Strauss",
  }),
  p("ayelet-zurer", "איילת זורר", ["series", "film", "stage"], "שחקנית ישראלית. השתתפה ב„שטיסל”.", {
    nameOriginal: "Ayelet Zurer",
  }),
  p("yoav-rotman", "יואב רוטמן", ["series", "film", "stage"], "שחקן ישראלי. השתתף ב„שטיסל”.", {
    nameOriginal: "Yoav Rotman",
  }),
  p("orly-zilbershatz", "אורלי זילברשץ", ["series", "film", "stage"], "שחקנית ישראלית. השתתפה ב„שטיסל”.", {
    nameOriginal: "Orly Zilbershatz",
  }),
  p("avraham-mor", "אברהם מור", ["series", "film", "stage"], "שחקן ישראלי. השתתף ב„שטיסל”.", {
    nameOriginal: "Avraham Mor",
  }),
  p("lea-koenig", "ליא קניג", ["series", "film", "stage"], "שחקנית תיאטרון וטלוויזיה. השתתפה ב„שטיסל”.", {
    nameOriginal: "Lea Koenig",
  }),
  p("hana-laslau", "חנה לסלאו", ["series", "film", "stage", "hosting"], "שחקנית וקומיקאית. השתתפה ב„שטיסל”.", {
    nameOriginal: "Hanna Laslo",
  }),

  // —— פאודה ——
  p("lior-raz", "ליאור רז", ["series", "film", "stage"], "שחקן ויוצר. גילם את דורון קביליו ושותף ליצירת „פאודה”.", {
    nameOriginal: "Lior Raz",
    tags: ["מתח", "פאודה"],
  }),
  p("tzachi-halevy", "צחי הלוי", ["series", "film", "stage", "musical"], "שחקן וזמר. גילם את נעים ב„פאודה”.", {
    nameOriginal: "Tzachi Halevy",
    tags: ["פאודה"],
  }),
  p("itzik-cohen", "איציק כהן", ["series", "film", "stage"], "שחקן ישראלי. גילם את אביחי ב„פאודה”.", {
    nameOriginal: "Itzik Cohen",
    nicknames: ["איציק כהן (שחקן)"],
  }),
  p("yaakov-zada-daniel", "יעקב זדה-דניאל", ["series", "film", "stage"], "שחקן ישראלי. השתתף ב„פאודה”.", {
    nameOriginal: "Yaakov Zada Daniel",
  }),
  p("rona-lee-shimon", "רונה-לי שמעון", ["series", "film", "stage"], "שחקנית ישראלית. השתתפה ב„פאודה”.", {
    nameOriginal: "Rona-Lee Shimon",
    nicknames: ["רונה לי שמעון"],
  }),
  p("tomer-kapon", "תומר קאפון", ["series", "film", "stage"], "שחקן ישראלי. גילם את בועז ב„פאודה”.", {
    nameOriginal: "Tomer Kapon",
  }),
  p("doron-ben-david", "דורון בן-דוד", ["series", "film", "stage"], "שחקן ישראלי. השתתף ב„פאודה”.", {
    nameOriginal: "Doron Ben-David",
    nicknames: ["דורון בן דוד"],
  }),
  p("neta-garti", "נטע גרטי", ["series", "film", "stage"], "שחקנית ישראלית. השתתפה ב„פאודה”.", {
    nameOriginal: "Neta Garti",
  }),
  p("boaz-konforti", "בועז קונפורטי", ["series", "film", "stage"], "שחקן ישראלי. השתתף ב„פאודה”.", {
    nameOriginal: "Boaz Konforti",
  }),
  p("marina-maximilian", "מרינה מקסימיליאן", ["series", "film", "musical", "performance"], "זמרת ושחקנית. השתתפה ב„פאודה”.", {
    nameOriginal: "Marina Maximilian Blumin",
    nicknames: ["מרינה מקסימיליאן בלומין"],
  }),
  p("hisham-suliman", "הישאם סלימאן", ["series", "film", "stage"], "שחקן. השתתף ב„פאודה”.", {
    nameOriginal: "Hisham Suliman",
  }),

  // —— החממה ——
  p("gaia-shlita-katz", "גאיה שליטא-כץ", ["series", "film", "performance"], "שחקנית. גילמה את אלה־לי רשף ב„החממה”.", {
    nameOriginal: "Gaia Shalita Katz",
    nicknames: ["גאיה שליטא כץ"],
    tags: ["נוער", "החממה"],
  }),
  p("lee-biran", "לי בירן", ["series", "film", "musical", "performance"], "שחקן וזמר. גילם את יפתח הר לב ב„החממה”.", {
    nameOriginal: "Lee Biran",
    tags: ["נוער", "החממה"],
  }),
  p("daniel-litman", "דניאל ליטמן", ["series", "film", "stage"], "שחקן. גילם את דניאל גורן ב„החממה”.", {
    nameOriginal: "Daniel Litman",
  }),
  p("dar-zuzovsky", "דר זוזובסקי", ["series", "film", "stage"], "שחקנית. גילמה את נטלי קליין ב„החממה”.", {
    nameOriginal: "Dar Zuzovsky",
  }),
  p("yadin-goldman", "ידין גולדמן", ["series", "film", "stage"], "שחקן. השתתף ב„החממה”.", {
    nameOriginal: "Yadin Goldman",
  }),
  p("joy-rieger", "ג'וי ריגר", ["series", "film", "stage"], "שחקנית. השתתפה ב„החממה”.", {
    nameOriginal: "Joy Rieger",
    nicknames: ["ג׳וי ריגר"],
  }),
  p("shir-moreno", "שיר מורנו", ["series", "film", "stage"], "שחקנית. גילמה את סופי ב„החממה”.", {
    nameOriginal: "Shir Moreno",
  }),
  p("lior-shabtay", "ליאור שבתאי", ["series", "film", "stage"], "שחקן. השתתף ב„החממה”.", {
    nameOriginal: "Lior Shabtay",
  }),
  p("smadar-hayat", "סמדר חייט", ["series", "film", "stage"], "שחקנית. השתתפה ב„החממה”.", {
    nameOriginal: "Smadar Hayat",
  }),
  p("eli-keren-asaf", "אלי קרן-אסף", ["series", "film", "stage"], "שחקן. השתתף ב„החממה”.", {
    nameOriginal: "Eli Keren-Asaf",
  }),

  // —— רמזור ——
  p(
    "adir-miller",
    "אדיר מילר",
    ["series", "film", "stage", "hosting", "performance"],
    "שחקן, קומיקאי, תסריטאי ובמאי. יוצר „רמזור” וגילם את אמיר רוזנר; יוצר גם של „צומת מילר”.",
    {
      nameOriginal: "Adir Miller",
      birthDate: "1974-06-16",
      tags: ["קומדיה", "רמזור"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%90%D7%93%D7%99%D7%A8_%D7%9E%D7%99%D7%9C%D7%A8",
    }
  ),
  p(
    "lyavr-klpvn",
    "ליאור כלפון",
    ["series", "film", "stage", "dubbing", "performance", "hosting"],
    "שחקן, קומיקאי ומדבב. גילם את אייל „איצקו” איצקוביץ׳ ב„רמזור”.",
    {
      nameOriginal: "Lior Halfon",
      nicknames: ["ליאור אלי כלפון"],
      birthDate: "1973-04-26",
      tags: ["קומדיה", "רמזור", "דיבוב"],
    }
  ),
  p(
    "niro-levy",
    "נירו לוי",
    ["series", "film", "stage", "dubbing", "musical"],
    "שחקן ישראלי (ניר לוי). גילם את חפר גורי ב„רמזור”; זוכה פרס אופיר על „החברים של יאנה”.",
    {
      nameOriginal: "Niro Levy",
      nicknames: ["ניר לוי"],
      birthDate: "1968-06-27",
      tags: ["קומדיה", "רמזור"],
      imageUrl: wikiImage("ניר לוי"),
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%A0%D7%99%D7%A8_%D7%9C%D7%95%D7%99",
    }
  ),
  p(
    "yael-sharony",
    "יעל שרוני",
    ["series", "film", "stage"],
    "שחקנית טלוויזיה ותיאטרון. גילמה את לילך איצקוביץ׳ ב„רמזור”; זוכת פרס האקדמיה לטלוויזיה על „סרוגים”.",
    {
      nameOriginal: "Yael Sharony",
      birthDate: "1975-08-10",
      tags: ["קומדיה", "רמזור"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%99%D7%A2%D7%9C_%D7%A9%D7%A8%D7%95%D7%A0%D7%99",
    }
  ),
  p(
    "lyat-hr-lb",
    "ליאת הר לב",
    ["series", "film", "stage", "dubbing"],
    "שחקנית, קומיקאית ומדבבת. גילמה את טלי רוזנר ב„רמזור”; זוכת פרסי האקדמיה לטלוויזיה על „הפרלמנט” ו„אלישע”.",
    {
      nameOriginal: "Liat Har-Lev",
      nicknames: ["ליאת הר-לב"],
      birthDate: "1979-08-09",
      tags: ["קומדיה", "רמזור", "דיבוב"],
    }
  ),
  p("yuval-win", "יובל וין", ["series", "stage"], "שחקנית. גילמה את דניאל איצקוביץ׳, בתם של איצקו ולילך, ב„רמזור”.", {
    nameOriginal: "Yuval Win",
    tags: ["רמזור"],
  }),
  p("tehaya-danon", "תחיה דנון", ["series", "film", "stage"], "שחקנית. גילמה את אילנה רוזנר, אמו של אמיר, ב„רמזור”.", {
    nameOriginal: "Tehiya Danon",
  }),
  p("emma-rubin", "אמה רובין", ["series", "film", "stage"], "שחקנית. גילמה את סנאית ב„רמזור” (עונות 1–2).", {
    nameOriginal: "Emma Rubin",
  }),
  p(
    "shira-katzenellenbogen",
    "שירה קצנלנבוגן",
    ["series", "film", "stage"],
    "שחקנית ישראלית. גילמה את שירי „סרטים”, בת זוגו של חפר, ב„רמזור”.",
    {
      nameOriginal: "Shira Katzenellenbogen",
    }
  ),
  p("rina-padva", "רינה פדווה", ["series", "film", "stage"], "שחקנית. גילמה את דליה מלקין ב„רמזור” (עונות 2–3).", {
    nameOriginal: "Rina Padva",
  }),
  p(
    "ohad-perach",
    "אוהד פרח",
    ["series", "film"],
    "במאי ושחקן. ביים את עונות 2–4 של „רמזור” וגילם את זיסו.",
    {
      nameOriginal: "Ohad Perach",
      tags: ["בימוי", "רמזור"],
    }
  ),
  p("yagil-marisin", "יגיל מריסין", ["series", "film", "stage"], "שחקן. גילם את גיורא בחנות של איצקו ב„רמזור” (עונה 1).", {
    nameOriginal: "Yagil Marisin",
  }),
  p("shifra-tziprin", "שפרה ציפרין", ["series", "film", "stage"], "שחקנית. גילמה את שפרה, סבתו של אמיר, ב„רמזור”.", {
    nameOriginal: "Shifra Tziprin",
  }),
  p("alon-gal", "אלון גל", ["series", "film", "stage", "hosting"], "שחקן ומנחה. גילם את עו״ד בני שטיין ב„רמזור” (עונה 4).", {
    nameOriginal: "Alon Gal",
  }),
  p("shalom-korem", "שלום כורם", ["series", "film", "stage"], "שחקן. גילם את נפתלי דביר, אביה של טלי, ב„רמזור”.", {
    nameOriginal: "Shalom Korem",
  }),
  p(
    "asty-kvsvbytsky",
    "אסתי קוסוביצקי",
    ["series", "film", "stage", "dubbing"],
    "שחקנית. גילמה את שושי „שושקה” דביר, אימה של טלי, ב„רמזור”.",
    {
      nameOriginal: "Esti Kosovitzky",
    }
  ),
  p("ran-sarig", "רן שריג", ["series"], "תסריטאי. כתב את „רמזור” יחד עם אדיר מילר.", {
    nameOriginal: "Ran Sarig",
    tags: ["תסריט", "רמזור"],
  }),
  p("rani-saar", "רני סער", ["series", "film"], "במאי. ביים את העונה הראשונה של „רמזור”.", {
    nameOriginal: "Rani Saar",
    tags: ["בימוי", "רמזור"],
  }),
  p("moshe-dats", "משה דץ", ["series", "film", "musical", "performance", "hosting"], "זמר, שחקן ומנחה. התארח ב„רמזור” (עונה 4).", {
    nameOriginal: "Moshe Datz",
  }),

  // —— איצ׳ה / דודלי / הופה היי ——
  p("aliza-rosen", "עליזה רוזן", ["series", "film", "stage", "musical", "radio"], "עליזה רוזן (רוזנטל; נולדה ב-3 בדצמבר 1939) היא שחקנית, קומיקאית וזמרת ישראלית. גילמה את שפרה שולמן ב„איצ׳ה”. מקור: ויקיפדיה.", {
    nameOriginal: "Aliza Rosen",
    nicknames: ["עליזה רוזנטל"],
    birthDate: "1939-12-03",
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%A2%D7%9C%D7%99%D7%96%D7%94_%D7%A8%D7%95%D7%96%D7%9F",
    tags: ["משחק", "תיאטרון", "קולנוע", "טלוויזיה", "זמר"],
  }),
  p("sagit-emet", "שגית אמת", ["series", "film", "stage"], "שחקנית. גילמה את שולי ב„איצ׳ה”.", {
    nameOriginal: "Sagit Emet",
  }),
  p("avi-termin", "אבי טרמין", ["series", "film", "stage"], "שחקן. גילם את ציון ב„איצ׳ה”.", {
    nameOriginal: "Avi Termin",
  }),
  p("shlomo-nizan", "שלמה ניצן", ["series", "film", "stage", "hosting", "dubbing"], "שחקן. גילם את דודלי ודיבב את חביתוש ב„רגע עם דודלי”.", {
    nameOriginal: "Shlomo Nitzan",
    tags: ["ילדים", "חינוכית"],
  }),
  p("zipi-mor", "ציפי מור", ["series", "film", "stage", "hosting"], "שחקנית. גילמה את רגע ב„רגע עם דודלי”.", {
    nameOriginal: "Tzipi Mor",
    nicknames: ["ציפי מור"],
    tags: ["ילדים", "חינוכית"],
  }),
  p("yigal-bashan", "יגאל בשן", ["series", "musical", "performance", "festival", "hosting"], "זמר וכוכב ילדים. ממייסדי „הופה היי”.", {
    nameOriginal: "Yigal Bashan",
    deathDate: "2018-12-09",
    tags: ["ילדים", "הופה היי"],
  }),
  p("uzi-hitman", "עוזי חיטמן", ["series", "musical", "performance", "festival", "hosting"], "זמר ויוצר. ממייסדי „הופה היי”; מנחה ב„פרפר נחמד”.", {
    nameOriginal: "Uzi Hitman",
    deathDate: "2004-10-17",
    tags: ["ילדים", "הופה היי"],
  }),
  p("yonatan-miller", "יונתן מילר", ["series", "musical", "performance", "festival"], "כנר וכוכב ילדים. חבר בהרכב המקורי של „הופה היי”.", {
    nameOriginal: "Yonatan Miller",
  }),
  p("avi-dor", "אבי דור", ["series", "musical", "performance", "festival", "hosting"], "זמר. חבר בהרכב השני של „הופה היי”.", {
    nameOriginal: "Avi Dor",
  }),
  p("aharon-perera", "אהרון פררה", ["series", "musical", "performance", "festival", "hosting"], "זמר. חבר בהרכב השני של „הופה היי”.", {
    nameOriginal: "Aharon Perera",
  }),

  // —— פרפר נחמד / סומסום ——
  p("ofra-weingarten", "עפרה ויינגרטן", ["series", "hosting", "performance"], "מנחה ב„פרפר נחמד”.", {
    nameOriginal: "Ofra Weingarten",
  }),
  p("shlomit-hagoel", "שלומית הגואל-טריגר", ["series", "hosting", "performance"], "מנחה אורחת ב„פרפר נחמד”.", {
    nameOriginal: "Shlomit Hagoel",
    nicknames: ["שלומית הגואל"],
  }),
  p("ayelet-levin", "איילת לוין", ["dubbing", "series", "stage"], "בובנאית ומדבבת. דיבבה את נולי ב„פרפר נחמד”.", {
    nameOriginal: "Ayelet Levin",
    tags: ["דיבוב", "בובות"],
  }),
  p("irit-shilo", "עירית שילה", ["dubbing", "series", "stage"], "בובנאית ומדבבת. דיבבה את אוזה ב„פרפר נחמד” ודפי ב„רחוב סומסום”.", {
    nameOriginal: "Irit Shilo",
    tags: ["דיבוב", "בובות"],
  }),
  p("itzik-geyer", "איציק גייר", ["dubbing", "series", "stage"], "בובנאי ומדבב. השתתף ב„פרפר נחמד”.", {
    nameOriginal: "Itzik Geyer",
  }),
  p("gilles-ben-david", "ז'יל בן דוד", ["dubbing", "series", "film", "stage"], "שחקן ומדבב. דיבב את בץ (לאחר יוני חן) ואת שבי ב„פרפר נחמד”.", {
    nameOriginal: "Gilles Ben-David",
    nicknames: ["ז׳יל בן-דוד", "ג'יל בן דוד"],
  }),
  p("avi-yakir", "אבי יקיר", ["dubbing", "series", "stage"], "בובנאי. הפעיל את שבי ב„פרפר נחמד”.", {
    nameOriginal: "Avi Yakir",
  }),
  p("tzlila-yanai", "צלילה ינאי", ["dubbing", "series", "stage"], "מדבבת. דיבבה את נולי בראשית „פרפר נחמד”.", {
    nameOriginal: "Tzlila Yanai",
  }),
  p("galia-yishai", "גליה ישי", ["series", "stage", "dubbing"], "שחקנית. גילמה והפעילה את פינגי ב„פרפר נחמד”.", {
    nameOriginal: "Galia Yishai",
  }),
  p("ami-weinberg", "עמי ויינברג", ["dubbing", "series", "stage"], "בובנאי ומדבב. דיבב את בץ ב„פרפר נחמד”.", {
    nameOriginal: "Ami Weinberg",
  }),
  p("shari-zuriel", "שרי צוריאל", ["series", "dubbing", "stage", "hosting"], "שחקנית ובובנאית. גילמה ודיבבה את קיפי בן קיפוד ב„רחוב סומסום”.", {
    nameOriginal: "Shari Zuriel",
    tags: ["ילדים", "סומסום"],
  }),
  p("nathan-datner", "נתן דטנר", ["series", "film", "stage", "hosting"], "שחקן. השתתף ב„רחוב סומסום”.", {
    nameOriginal: "Nathan Datner",
  }),
  p("yona-atari", "יונה עטרי", ["series", "film", "stage", "musical"], "שחקנית וזמרת. השתתפה ב„רחוב סומסום”.", {
    nameOriginal: "Yona Atari",
  }),
  p("hana-rot", "חנה רוט", ["series", "film", "stage"], "שחקנית. השתתפה ב„רחוב סומסום”.", {
    nameOriginal: "Hana Rot",
  }),
  p("shosh-marziano", "שוש מרציאנו", ["series", "film", "stage"], "שחקנית. השתתפה ב„רחוב סומסום”.", {
    nameOriginal: "Shosh Marziano",
  }),
  p("albert-iluz", "אלברט אילוז", ["series", "film", "stage"], "שחקן. השתתף ב„רחוב סומסום”.", {
    nameOriginal: "Albert Iluz",
  }),
  p("shmuel-shilo", "שמואל שילה", ["series", "film", "stage"], "שחקן. השתתף ב„רחוב סומסום”.", {
    nameOriginal: "Shmuel Shilo",
  }),
  p("avner-katz", "אבנר כץ", ["series", "film", "stage"], "אמן ושחקן. עיצב את קיפי והשתתף ב„רחוב סומסום”.", {
    nameOriginal: "Avner Katz",
  }),
  p("guy-friedman", "גיא פרידמן", ["series", "hosting", "dubbing"], "מנחה ומדבב. דיבב את קיפי בעונות מאוחרות של „רחוב סומסום”; מנחה ב„פרפר נחמד” (1998–2004).", {
    nameOriginal: "Guy Friedman",
  }),
  p("elinor-aharon", "אלינור אהרון", ["series", "hosting", "performance", "musical"], "שחקנית, זמרת ומנחה. הנחתה ב„פרפר נחמד” (2000–2004).", {
    nameOriginal: "Elinor Aharon",
    wikipediaUrl: "https://he.wikipedia.org/wiki/אלינור_אהרון",
  }),
  p("adva-adani", "אדוה עדני", ["series", "hosting", "performance"], "מנחה אורחת ב„פרפר נחמד” (1998).", {
    nameOriginal: "Adva Adani",
  }),
  // —— קופיקו ——
  p("gny-tmyr", "גני תמיר", ["series", "dubbing", "acting"], "שחקנית ומדבבת. דיבבה את קופיקו בעונה הראשונה של הסדרה (1993).", {
    nameOriginal: "Geni Tamir",
    tags: ["ילדים", "דיבוב"],
  }),
  p("yosi-marshak", "יוסי מרשק", ["series", "film", "stage"], "שחקן ישראלי. גילם את שלומק'ה לזר ב«קופיקו» (עונות 2–4).", {
    nameOriginal: "Yossi Marshak",
    tags: ["ילדים"],
  }),
  p("idit-neudorfer", "עידית נוידרפר", ["series", "film", "stage"], "שחקנית ישראלית. גילמה את תמר לזר ב«קופיקו» (עונות 2–4).", {
    nameOriginal: "Idit Neudorfer",
    tags: ["ילדים"],
  }),
  p("maayan-aloni", "מעיין אלוני", ["series", "film"], "שחקן ישראלי. גילם את יורם לזר ב«קופיקו» (עונות 2–4).", {
    nameOriginal: "Maayan Aloni",
    tags: ["ילדים"],
  }),
  p("hila-luzia", "הילה לוזיה", ["series", "film"], "שחקנית ישראלית. גילמה את אורנה לזר ב«קופיקו» (עונות 2–4).", {
    nameOriginal: "Hila Luzia",
    tags: ["ילדים"],
  }),
  p("rudi-saada", "רודי סעדה", ["series", "film", "stage"], "שחקן ישראלי. גילם את אברום תפוחי ב«קופיקו» (עונות 2–4).", {
    nameOriginal: "Rudi Saada",
    tags: ["ילדים"],
  }),
  p("daniel-litvin", "דניאל ליטוין", ["series", "film"], "שחקן ישראלי. גילם את דובי תפוחי ב«קופיקו» (עונות 2–4).", {
    nameOriginal: "Daniel Litvin",
    tags: ["ילדים"],
  }),
  p("yael-barkman", "יעל ברקמן", ["series", "acting"], "בובנאית. הפעילה את בובת קופיקו בעונות המחודשות.", {
    nameOriginal: "Yael Barkman",
    tags: ["ילדים", "בובות"],
  }),
  p("tal-levi-puppeteer", "טל לוי", ["series", "acting"], "בובנאי. הפעיל את בובת קופיקו בעונות המחודשות.", {
    nameOriginal: "Tal Levi",
    tags: ["ילדים", "בובות"],
  }),
  p("gali-hazan", "גלי חזן", ["series", "acting"], "השתתפה ב«קופיקו» בעונה השנייה.", {
    nameOriginal: "Gali Hazan",
    tags: ["ילדים"],
  }),
  p("adi-benyaminov", "עדי בנימינוב", ["series", "film"], "במאי ישראלי. ביים את «קופיקו» ואת הספין־אוף «חוקי הג'ונגל».", {
    nameOriginal: "Adi Benyaminov",
    tags: ["בימוי", "ילדים"],
  }),
  p("tamar-bornstein-lazar", "תמר בורנשטיין-לזר", ["series"], "סופרת ילדים. יוצרת סדרת הספרים והטלוויזיה «קופיקו».", {
    nameOriginal: "Tamar Bornstein-Lazar",
    deathDate: "2020-06-16",
    tags: ["ספרות", "ילדים"],
  }),
  p("chanan-peled", "חנן פלד", ["series", "film"], "תסריטאי ישראלי. כתב ל«קופיקו».", {
    nameOriginal: "Chanan Peled",
    tags: ["תסריט"],
  }),
  p("dor-zweigenboom", "דור צויגנבום", ["series", "film", "stage"], "שחקן ישראלי. גילם את שלומק'ה לזר בעונה הראשונה של «קופיקו».", {
    nameOriginal: "Dor Zweigenboom",
  }),
  p("dorit-peled", "דורית פלד", ["series", "film", "stage"], "שחקנית ישראלית. גילמה את תמר לזר בעונה הראשונה של «קופיקו».", {
    nameOriginal: "Dorit Peled",
  }),

  // —— ארץ נהדרת (ויקיפדיה / ויקידאטה Q2910877) ——
  p(
    "eyal-kitzis",
    "איל קיציס",
    ["series", "hosting", "stage", "performance", "film"],
    "שחקן, קומיקאי ומנחה. מנחה „ארץ נהדרת” מאז עלייתה לשידור ב־2003.",
    {
      nameOriginal: "Eyal Kitzis",
      birthDate: "1969-01-07",
      tags: ["סאטירה", "ארץ נהדרת", "הנחיה"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%90%D7%99%D7%9C_%D7%A7%D7%99%D7%A6%D7%99%D7%A1",
    }
  ),
  p(
    "mariano-idelman",
    "מריאנו אידלמן",
    ["series", "stage", "performance", "film"],
    "שחקן וקומיקאי. חבר צוות קבוע ב„ארץ נהדרת” מאז העונה הראשונה.",
    {
      nameOriginal: "Mariano Idelman",
      birthDate: "1974-06-27",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%9E%D7%A8%D7%99%D7%90%D7%A0%D7%95_%D7%90%D7%99%D7%93%D7%9C%D7%9E%D7%9F",
    }
  ),
  p(
    "yuval-semo",
    "יובל סמו",
    ["series", "stage", "performance", "film"],
    "שחקן וקומיקאי. חבר צוות ב„ארץ נהדרת” (אורח קבוע ואחר כך קבוע).",
    {
      nameOriginal: "Yuval Semo",
      birthDate: "1969-06-20",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%99%D7%95%D7%91%D7%9C_%D7%A1%D7%9E%D7%95",
    }
  ),
  p(
    "assi-cohen",
    "אסי כהן",
    ["series", "stage", "performance", "film"],
    "שחקן וקומיקאי. חבר צוות ב„ארץ נהדרת”; ידוע בין השאר בדמות שאולי.",
    {
      nameOriginal: "Asi Cohen",
      nicknames: ["אסי כהן (קומיקאי)"],
      birthDate: "1974-10-10",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%90%D7%A1%D7%99_%D7%9B%D7%94%D7%9F",
    }
  ),
  p(
    "orna-banai",
    "אורנה בנאי",
    ["series", "stage", "performance", "film", "hosting"],
    "שחקנית וקומיקאית. חברה בצוות המקורי של „ארץ נהדרת”.",
    {
      nameOriginal: "Orna Banai",
      birthDate: "1966-11-25",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%90%D7%95%D7%A8%D7%A0%D7%94_%D7%91%D7%A0%D7%90%D7%99",
    }
  ),
  p(
    "eran-zarhovitz",
    "ערן זרחוביץ'",
    ["series", "stage", "performance", "film"],
    "שחקן וקומיקאי. חבר צוות ב„ארץ נהדרת”.",
    {
      nameOriginal: "Eran Zaracovitz",
      nicknames: ["ערן זרחוביץ"],
      birthDate: "1974-11-15",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%A2%D7%A8%D7%9F_%D7%96%D7%A8%D7%97%D7%95%D7%91%D7%99%D7%A5%27",
    }
  ),
  p(
    "dov-navon",
    "דב נבון",
    ["series", "stage", "performance", "film"],
    "שחקן וקומיקאי. חבר בצוות המקורי של „ארץ נהדרת”.",
    {
      nameOriginal: "Dov Navon",
      birthDate: "1959-06-15",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%93%D7%91_%D7%A0%D7%91%D7%95%D7%9F",
    }
  ),
  p(
    "yaron-berlad",
    "ירון ברלד",
    ["series", "stage", "performance", "film"],
    "שחקן וקומיקאי. חבר צוות ב„ארץ נהדרת”.",
    {
      nameOriginal: "Yaron Berlad",
      birthDate: "1976-03-21",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%99%D7%A8%D7%95%D7%9F_%D7%91%D7%A8%D7%9C%D7%93",
    }
  ),
  p(
    "maor-cohen",
    "מאור כהן",
    ["series", "musical", "performance", "film", "stage"],
    "זמר, שחקן וקומיקאי. חבר צוות ב„ארץ נהדרת” בעונות מוקדמות.",
    {
      nameOriginal: "Maor Cohen",
      birthDate: "1974-05-01",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%9E%D7%90%D7%95%D7%A8_%D7%9B%D7%94%D7%9F",
    }
  ),
  p(
    "udi-kagan",
    "אודי כגן",
    ["series", "stage", "performance", "film"],
    "שחקן וקומיקאי. חבר צוות ב„ארץ נהדרת”.",
    {
      nameOriginal: "Udi Kagan",
      birthDate: "1981-06-08",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%90%D7%95%D7%93%D7%99_%D7%9B%D7%92%D7%9F",
    }
  ),
  p(
    "tom-yaar",
    "תום יער",
    ["series", "stage", "performance", "film"],
    "שחקנית וקומיקאית. חברה בצוות „ארץ נהדרת”.",
    {
      nameOriginal: "Tom Yaar",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%AA%D7%95%D7%9D_%D7%99%D7%A2%D7%A8",
    }
  ),
  p(
    "yaniv-biton",
    "יניב ביטון",
    ["series", "film", "stage"],
    "שחקן ישראלי. חבר צוות ב„ארץ נהדרת”.",
    {
      nameOriginal: "Yaniv Biton",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%99%D7%A0%D7%99%D7%91_%D7%91%D7%99%D7%98%D7%95%D7%9F",
    }
  ),
  p(
    "amir-shurush",
    "אמיר שורוש",
    ["series", "film", "stage", "performance"],
    "שחקן וקומיקאי. חבר צוות ב„ארץ נהדרת”.",
    {
      nameOriginal: "Amir Shurush",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%90%D7%9E%D7%99%D7%A8_%D7%A9%D7%95%D7%A8%D7%95%D7%A9",
    }
  ),
  p(
    "tamir-bar",
    "תמיר בר",
    ["series", "stage", "performance"],
    "קומיקאי ושחקן. חבר צוות ב„ארץ נהדרת”.",
    {
      nameOriginal: "Tamir Bar",
      tags: ["סאטירה", "ארץ נהדרת"],
    }
  ),
  p(
    "dudu-erez",
    "דודו ארז",
    ["series", "hosting", "performance", "stage"],
    "קומיקאי ומנחה. אורח קבוע ב„ארץ נהדרת” (בין השאר משאלי רחוב).",
    {
      nameOriginal: "Dudu Erez",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%93%D7%95%D7%93%D7%95_%D7%90%D7%A8%D7%96",
    }
  ),
  p(
    "gitit-fisher",
    "גיתית פישר",
    ["series", "stage", "performance", "film"],
    "שחקנית וקומיקאית. חברה בצוות „ארץ נהדרת”.",
    {
      nameOriginal: "Gitit Fisher",
      tags: ["סאטירה", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%92%D7%99%D7%AA%D7%99%D7%AA_%D7%A4%D7%99%D7%A9%D7%A8",
    }
  ),
  p(
    "muli-segev",
    "מולי שגב",
    ["series", "film"],
    "תסריטאי ועורך. יוצר ועורך ראשי של „ארץ נהדרת”; מנהל תוכן בקשת.",
    {
      nameOriginal: "Muli Segev",
      birthDate: "1972-02-19",
      tags: ["תסריט", "ארץ נהדרת"],
      wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%9E%D7%95%D7%9C%D7%99_%D7%A9%D7%92%D7%91",
    }
  ),
  p(
    "david-lifshitz",
    "דוד ליפשיץ",
    ["series"],
    "תסריטאי. כתב ל„ארץ נהדרת” (ויקידאטה).",
    {
      nameOriginal: "David Lifshitz",
      birthDate: "1975-01-31",
      tags: ["תסריט", "ארץ נהדרת"],
    }
  ),
];

export const SERIES_CAST_CREDITS: Credit[] = [
  // —— שטיסל (ויקיפדיה: צוות שחקנים) ——
  c("dov-glickman", "shtisel", "actor", "שלום שטיסל"),
  c("michael-alinor", "shtisel", "actor", "עקיבא שטיסל"),
  c("neta-riskin", "shtisel", "actor", "גיטי וייס"),
  c("shira-haas", "shtisel", "actor", "רוח׳לה קושניר"),
  c("sasson-gabay", "shtisel", "actor", "נחמיה וייס"),
  c("hadas-yaron", "shtisel", "actor", "ליבה"),
  c("zohar-strauss", "shtisel", "actor", "ליפא וייס"),
  c("ayelet-zurer", "shtisel", "actor", "אלישבע"),
  c("miki-kam", "shtisel", "actor", "מירי"),
  c("yoav-rotman", "shtisel", "actor", "צביקי"),
  c("avraham-mor", "shtisel", "actor"),
  c("orly-zilbershatz", "shtisel", "actor"),
  c("lea-koenig", "shtisel", "actor"),
  c("hana-laslau", "shtisel", "actor"),

  // —— פאודה (ויקיפדיה: דמויות) ——
  c("lior-raz", "fauda", "actor", "דורון קביליו"),
  c("lior-raz", "fauda", "writer"),
  c("tzachi-halevy", "fauda", "actor", "נאור ברזני"),
  c("itzik-cohen", "fauda", "actor", "גבי (קפטן איוב)"),
  c("yuval-segal", "fauda", "actor", "מיקי מורנו"),
  c("yaakov-zada-daniel", "fauda", "actor", "אלי אהרון"),
  c("rona-lee-shimon", "fauda", "actor", "נורית"),
  c("tomer-kapon", "fauda", "actor", "בועז"),
  c("doron-ben-david", "fauda", "actor", "סטיב פינטו"),
  c("neta-garti", "fauda", "actor"),
  c("boaz-konforti", "fauda", "actor", "אביחי בן חיים"),
  c("marina-maximilian", "fauda", "actor", "הילה בשן"),
  c("hisham-suliman", "fauda", "actor", "תאופיק חאמד (אבו אחמד)"),

  // —— החממה (ויקיפדיה: דמויות) ——
  c("gaia-shlita-katz", "ha-hamama", "actor", "אלה־לי רשף"),
  c("lee-biran", "ha-hamama", "actor", "יפתח הר לב"),
  c("lee-biran", "ha-hamama", "singer", "שיר הנושא „צעד קטן”"),
  c("daniel-litman", "ha-hamama", "actor", "דניאל גורן"),
  c("dar-zuzovsky", "ha-hamama", "actor", "נטלי קליין"),
  c("yadin-goldman", "ha-hamama", "actor", "אלפי רשף"),
  c("joy-rieger", "ha-hamama", "actor", "דינה נבון"),
  c("shir-moreno", "ha-hamama", "actor", "סופי נוימן"),
  c("lior-shabtay", "ha-hamama", "actor", "מתי ספיבק"),
  c("smadar-hayat", "ha-hamama", "actor", "אלונה ברגר"),
  c("eli-keren-asaf", "ha-hamama", "actor", "איימי בלום"),
  c("tamir-ginsburg", "ha-hamama", "actor", "רון אשכנזי"),
  c("ayelet-robinson", "ha-hamama", "actor"),
  c("gaia-shlita-katz", "ha-hamama-musical-ish", "actor", "אלה־לי רשף"),
  c("lee-biran", "ha-hamama-musical-ish", "singer"),
  c("daniel-litman", "ha-hamama-musical-ish", "actor", "דניאל גורן"),
  c("dar-zuzovsky", "ha-hamama-musical-ish", "actor", "נטלי קליין"),
  c("tamir-ginsburg", "ha-hamama-musical-ish", "actor", "רון אשכנזי"),
  c("shir-moreno", "ha-hamama-musical-ish", "actor", "סופי"),

  // —— רמזור (ויקיפדיה: דמויות) ——
  c("adir-miller", "ramzor", "actor", "אמיר „מירי” רוזנר"),
  c("adir-miller", "ramzor", "writer"),
  c("ran-sarig", "ramzor", "writer"),
  c("rani-saar", "ramzor", "director"),
  c("ohad-perach", "ramzor", "director"),
  c("lyavr-klpvn", "ramzor", "actor", "אייל „איצקו” איצקוביץ׳"),
  c("niro-levy", "ramzor", "actor", "חפר גורי"),
  c("yael-sharony", "ramzor", "actor", "לילך איצקוביץ׳–יפה"),
  c("lyat-hr-lb", "ramzor", "actor", "טלי רוזנר"),
  c("yuval-win", "ramzor", "actor", "דניאל איצקוביץ׳"),
  c("tehaya-danon", "ramzor", "actor", "אילנה רוזנר"),
  c("emma-rubin", "ramzor", "actor", "סנאית"),
  c("shira-katzenellenbogen", "ramzor", "actor", "שירי „סרטים”"),
  c("rina-padva", "ramzor", "actor", "דליה מלקין"),
  c("ohad-perach", "ramzor", "actor", "זיסו"),
  c("yagil-marisin", "ramzor", "actor", "גיורא"),
  c("shifra-tziprin", "ramzor", "actor", "שפרה"),
  c("alon-gal", "ramzor", "actor", "עו״ד בני שטיין"),
  c("shalom-korem", "ramzor", "actor", "נפתלי דביר"),
  c("asty-kvsvbytsky", "ramzor", "actor", "שושי „שושקה” דביר"),
  c("moshe-dats", "ramzor", "actor"),

  // —— איצ׳ה ——
  c("sefi-rivlin", "itcha", "actor", "יצחק „איצ׳ה” שולמן"),
  c("aliza-rosen", "itcha", "actor", "שפרה שולמן"),
  c("sagit-emet", "itcha", "actor", "שולי שולמן"),
  c("avi-termin", "itcha", "actor", "ציון כהן"),

  // —— רגע עם דודלי ——
  c("shlomo-nizan", "rega-im-dudley", "actor", "דודלי"),
  c("shlomo-nizan", "rega-im-dudley", "dubber", "חביתוש"),
  c("zipi-mor", "rega-im-dudley", "actor", "רגע"),
  c("sefi-rivlin", "rega-im-dudley", "actor", "פיסטוק"),

  // —— הופה היי ——
  c("yigal-bashan", "hopa-hey", "host", "מנחה / שירה"),
  c("yigal-bashan", "hopa-hey", "singer", "שירה"),
  c("uzi-hitman", "hopa-hey", "host", "מנחה / שירה"),
  c("uzi-hitman", "hopa-hey", "singer", "שירה"),
  c("yonatan-miller", "hopa-hey", "host", "מנחה / כינור"),
  c("yonatan-miller", "hopa-hey", "singer", "שירה"),
  c("avi-dor", "hopa-hey", "host", "מנחה (הרכב שני)"),
  c("avi-dor", "hopa-hey", "singer", "שירה"),
  c("aharon-perera", "hopa-hey", "host", "מנחה (הרכב שני)"),
  c("aharon-perera", "hopa-hey", "singer", "שירה"),
  c("sefi-rivlin", "hopa-hey", "actor", "אורח קבוע / דמויות"),
  c("zipi-shavit", "hopa-hey", "actor", "ציפי קפיץ"),
  c("shlomo-baraba", "hopa-hey", "actor", "אורח"),
  c("moni-moshonov", "hopa-hey", "actor", "אורח"),

  // —— ספי (מיסטר בין ישראלי) ——
  c("sefi-rivlin", "sefi-tv", "actor", "ספי"),

  // —— פרפר נחמד — העונות הראשונות (1982–1997) ——
  c("dudu-zar", "parpar-nechmad", "host", "מנחה"),
  c("uzi-hitman", "parpar-nechmad", "host", "מנחה"),
  c("ofra-weingarten", "parpar-nechmad", "host", "מנחה"),
  c("efi-ben-israel", "parpar-nechmad", "host", "מנחה"),
  c("shlomit-hagoel", "parpar-nechmad", "host", "מנחה אורחת"),
  c("yoni-chen", "parpar-nechmad", "dubber", "בץ (1982–1993)"),
  c("gilles-ben-david", "parpar-nechmad", "dubber", "בץ (1994) / שבי"),
  c("ami-weinberg", "parpar-nechmad", "dubber", "בץ (1996–1997)"),
  c("tzlila-yanai", "parpar-nechmad", "dubber", "נולי (1982–1989)"),
  c("ayelet-levin", "parpar-nechmad", "dubber", "נולי (1990–1997)"),
  c("irit-shilo", "parpar-nechmad", "dubber", "אוזה"),
  c("avi-yakir", "parpar-nechmad", "dubber", "שבי"),
  c("itzik-geyer", "parpar-nechmad", "dubber", "דמויות / בובות"),
  c("galia-yishai", "parpar-nechmad", "actor", "פינגי"),
  c("miki-kam", "parpar-nechmad", "dubber", "הפרפר הנחמד"),
  c("ht-avrnh-lbya-plynt", "parpar-nechmad", "dubber", "הפרפר הנחמד"),
  c("yaffa-gabay", "parpar-nechmad", "dubber", "דמויות"),
  c("yoram-yosefsberg", "parpar-nechmad", "actor", "אורח / דמויות"),
  c("zipi-mor", "parpar-nechmad", "actor", "אורחת"),
  c("zipi-shavit", "parpar-nechmad", "actor", "אורחת"),

  // —— פרפר נחמד — העונות המאוחרות (1998–2004) / הופ תמיר ——
  c("dudu-zar", "ht-prpr-nchmd-late", "host", "מנחה"),
  c("efi-ben-israel", "ht-prpr-nchmd-late", "host", "מנחה"),
  c("guy-friedman", "ht-prpr-nchmd-late", "host", "מנחה"),
  c("elinor-aharon", "ht-prpr-nchmd-late", "host", "מנחה"),
  c("adva-adani", "ht-prpr-nchmd-late", "host", "מנחה אורחת"),
  c("rama-messinger", "ht-prpr-nchmd-late", "actor", "אורחת"),
  c("ami-weinberg", "ht-prpr-nchmd-late", "dubber", "בץ"),
  c("ayelet-levin", "ht-prpr-nchmd-late", "dubber", "נולי"),
  c("irit-shilo", "ht-prpr-nchmd-late", "dubber", "אוזה"),
  c("avi-yakir", "ht-prpr-nchmd-late", "dubber", "שבי"),
  c("itzik-geyer", "ht-prpr-nchmd-late", "dubber", "דמויות / בובות"),
  c("drvr-krn", "ht-prpr-nchmd-late", "actor", "אורח"),
  c("gylyh-shtrn", "ht-prpr-nchmd-late", "actor", "אורחת"),

  // —— רחוב סומסום ——
  c("shari-zuriel", "sesame-israel", "actor", "קיפי בן קיפוד"),
  c("shari-zuriel", "sesame-israel", "dubber", "קיפי בן קיפוד"),
  c("nathan-datner", "sesame-israel", "actor", "נתן"),
  c("yona-atari", "sesame-israel", "actor", "יונה"),
  c("hana-rot", "sesame-israel", "actor", "חנה"),
  c("shosh-marziano", "sesame-israel", "actor", "שושי"),
  c("albert-iluz", "sesame-israel", "actor", "אלברט"),
  c("shmuel-shilo", "sesame-israel", "actor", "שמואל"),
  c("avner-katz", "sesame-israel", "actor", "אבנר"),
  c("miki-kam", "sesame-israel", "actor", "מיקי"),
  c("tuvia-tsafir", "sesame-israel", "actor", "טוביה / דמויות"),
  c("guy-friedman", "sesame-israel", "dubber", "קיפי (עונות מאוחרות)"),
  c("irit-shilo", "sesame-israel", "dubber", "דפי"),
  c("gilles-ben-david", "sesame-israel", "actor", "דמויות"),
  c("yoram-yosefsberg", "sesame-israel", "dubber", "דמויות"),

  // —— הופ! ——
  c("tal-mosseri", "hop", "host", "מנחה"),
  c("yuval-hamvulbal", "hop", "actor", "יובל המבולבל"),
  c("michal-tzafir", "hop", "host", "מנחה"),
  c("gidi-gov", "hop", "host", "מנחה / אורח"),

  // —— סדרות מדובבות — השלמת שמות דמויות (ויקי / אישים) ——
  c("tsvika-furman", "the-smurfs-he", "dubber", "דרדס גדול / דמויות"),
  c("orna-katz", "the-smurfs-he", "dubber", "דרדסית / דמויות"),
  c("yaffa-gabay", "care-bears-he", "dubber", "דובונים / דמויות"),
  c("yoram-yosefsberg", "care-bears-he", "dubber", "דמויות"),
  c("shafrira-zachai", "once-upon-a-time-life", "dub_director", "בימוי דיבוב"),
  c("yaffa-gabay", "danny-phantom-style-danny", "dubber", "דני שובבני"),
  c("yaffa-gabay", "the-heart-marco", "dubber", "מרקו"),
  c("tsvika-furman", "dragonball-he", "dubber", "גוקו"),
  c("orna-katz", "sailormoon-he", "dubber", "סיילור מון / אוסגי צוקינו"),
  c("sapir-dermon", "winx-he", "dubber", "בלום"),
  c("eliana-magon", "totally-spies-he", "dubber", "סם"),
  // בובספוג — דיבוב ויקיפדיה (לא צביקה=בובספוג)
  c("ido-mosseri", "spongebob-he", "dubber", "בובספוג מכנסמרובע"),
  c("lyrvn-brns", "spongebob-he", "dubber", "פטריק סטאר"),
  c("gilad-kelter", "spongebob-he", "dubber", "סקווידוויד"),
  c("ami-mandelman", "spongebob-he", "dubber", "מר קראב"),
  c("tsbykh-shvvrtsbrg", "spongebob-he", "dubber", "פלנקטון"),
  c("tsvika-furman", "spongebob-he", "dubber", "דמויות שונות"),
  c("simcha-barbiro", "spongebob-he", "dubber", "דמויות"),
  c("yonatan-magon", "pokemon-he", "dubber", "אש קטצ׳ם"),
  c("daniel-magon", "pokemon-he", "dubber", "דמויות"),
  c("daniel-magon", "naruto-he", "dubber", "נארוטו / דמויות"),
  c("yonatan-magon", "naruto-he", "dubber", "דמויות"),
  c("sapir-dermon", "miraculous-he", "dubber", "מרינט / החיפושית"),
  c("einat-gliksman", "peppa-pig-he", "dubber", "פפה"),
  c("gilit-shoval", "peppa-pig-he", "dubber", "דמויות"),
  c("einat-gliksman", "paw-patrol-he", "dubber", "צ׳ייס / דמויות"),
  c("ofek-pati", "paw-patrol-he", "dubber", "דמויות"),
  c("hadar-shahaf-maayan", "bluey-he", "dubber", "בלואי / דמויות"),
  c("ayelet-robinson", "bluey-he", "dubber", "דמויות"),
  c("daniel-magon", "digimon-he", "dubber", "טאי / דמויות"),
  c("eliana-magon", "digimon-he", "dubber", "דמויות"),
  c("yonatan-magon", "digimon-he", "dubber", "דמויות"),

  // —— טימון ופומבה (הופ תמיר) ——
  c("shafrira-zachai", "ht-tymvn-vpvmbh", "dub_director", "בימוי דיבוב"),
  c("shafrira-zachai", "ht-tymvn-vpvmbh", "dubber", "שנזי"),
  c("tomer-sharon", "ht-tymvn-vpvmbh", "dubber", "טימון"),
  c("ami-mandelman", "ht-tymvn-vpvmbh", "dubber", "פומבה"),
  c("alon-ofir", "ht-tymvn-vpvmbh", "dubber", "סימבה"),
  c("dov-reiber", "ht-tymvn-vpvmbh", "dubber", "ראפיקי"),
  c("avhd-shchr", "ht-tymvn-vpvmbh", "dubber", "זאזו"),
  c("shmvlyk-tna", "ht-tymvn-vpvmbh", "dubber", "בנזאי"),
  c("ht-shmavn-khn", "ht-tymvn-vpvmbh", "dubber", "בנזאי / קווינט"),
  c("chn-chgy", "ht-tymvn-vpvmbh", "dubber", "אד"),

  // —— היה היה - דואגים לכדור הארץ → seed-ishim-hyh-hyh-dvagym-lkdvr-hartz.ts ——

  // —— המומינים (הופ תמיר / ויקיפדיה) ——
  c("ht-chnh-drvry-kshy", "ht-hmvmywnym", "dub_director", "בימוי דיבוב"),
  c("ht-chsyh-vrthyym", "ht-hmvmywnym", "producer", "הפקת דיבוב"),
  c("yuval-segal", "ht-hmvmywnym", "dubber", "מומינטרול"),
  c("ht-yrvn-dgn", "ht-hmvmywnym", "dubber", "מומינטרול"),
  c("yonatan-hashiloni", "ht-hmvmywnym", "dubber", "מומינטרול"),
  c("ht-asf-khvly", "ht-hmvmywnym", "dubber", "סניף / סנורק"),
  c("syvn-shbyt", "ht-hmvmywnym", "dubber", "מאי הקטנה / בימבל / דינורה / המכשפה"),
  c("ht-avdd-mnshh", "ht-hmvmywnym", "dubber", "סנופקין"),
  c("amy-travb", "ht-hmvmywnym", "dubber", "מומינאבא"),
  c("ht-lylyan-brtv", "ht-hmvmywnym", "dubber", "מומינאמא / סנורקה"),
  c("ht-chny-nchmyas", "ht-hmvmywnym", "dubber", "מומינאמא / סנורקה"),
  c("ht-rvty-hvltzmn", "ht-hmvmywnym", "dubber", "מומינאמא"),
  c("rama-messinger", "ht-hmvmywnym", "dubber", "מומינאמא"),
  c("ht-ayrys-zyngr", "ht-hmvmywnym", "dubber", "סנורקה"),
  c("ht-avrnh-lbya-plynt", "ht-hmvmywnym", "dubber", "גב' פיליונק / אליסיה / סנורקה"),
  c("dn-tvrn", "ht-hmvmywnym", "dubber", "סנופקין / המפקח / סרח / המספר"),
  c("ht-shmavn-khn", "ht-hmvmywnym", "dubber", "מר המיולין"),
  c("avi-hadash", "ht-hmvmywnym", "dubber", "מספר / ארינמל"),

  // —— לילו וסטיץ׳: הסדרה (הופ תמיר / אישים) ——
  c("simcha-barbiro", "ht-lylv-vstytz", "dubber", "סטיץ׳ / דוקטור האמסטרוויל / קומו"),
  c("hadar-shahaf-maayan", "ht-lylv-vstytz", "dubber", "נאני פלקאי / דמויות"),
  c("gilad-kelter", "ht-lylv-vstytz", "dubber", "וונדי פליקלי / דמויות"),
  c("yoram-yosefsberg", "ht-lylv-vstytz", "dubber", "קפטן גאנטו / דמויות"),
  c("yuval-segal", "ht-lylv-vstytz", "dubber", "ראובן / דמויות"),
  c("yonatan-magon", "ht-lylv-vstytz", "dubber", "וייד לוד [אורח]"),

  // —— לירוי וסטיץ׳ ——
  c("simcha-barbiro", "ht-lyrvy-vstytz", "dubber", "סטיץ׳ / דמויות"),

  // —— סוניק X / טוטלי ספייס / דרגון בול (הופ תמיר) ——
  c("eliana-magon", "ht-tvtly-spyys", "dubber", "סם"),
  c("tsvika-furman", "ht-drgvn-bvl", "dubber", "גוקו"),

  // —— אמפיביה (ויקיפדיה / אישים) ——
  c("namh-shtryt", "ht-ampybyh", "dubber", "אן בונצ׳וי"),
  c("tsvika-furman", "ht-ampybyh", "dubber", "הופ פופ"),
  c("eran-mor", "ht-ampybyh", "dubber", "וולי"),
  c("eliana-magon", "ht-ampybyh", "dubber", "מרסי"),
  c("tamir-ginsburg", "ht-ampybyh", "dubber", "טודי / אנדריאס / דמויות"),
  c("simcha-barbiro", "ht-ampybyh", "dubber", "גריים / דמויות"),
  c("yoram-yosefsberg", "ht-ampybyh", "dubber", "סטאמפי"),
  c("yonatan-magon", "ht-ampybyh", "dubber", "אנדריאס הצעיר [אורח]"),

  // —— משמר האריות / מפרץ / פלונטר (הופ תמיר — קישור למדבבים מוכרים) ——
  c("ami-mandelman", "ht-mshmr-haryvt", "dubber", "סימבה / דמויות"),
  c("einat-gliksman", "ht-mprtz-hhrptkavt-hsrt", "dubber", "דמויות"),
  c("laura-shopov", "ht-plvntr-hsdrh", "dubber", "רפונזל / דמויות"),
  c("ami-mandelman", "ht-plvntr-hsdrh", "dubber", "פלין / דמויות"),

  // —— קופיקו (ויקיפדיה העברית) ——
  c("tamar-bornstein-lazar", "kofiko", "writer", "יוצרת / מבוסס על ספריה"),
  c("chanan-peled", "kofiko", "writer"),
  c("adi-benyaminov", "kofiko", "director"),
  c("gny-tmyr", "kofiko", "dubber", "קופיקו (עונה 1)"),
  c("mykl-mvktr", "kofiko", "dubber", "קופיקו (עונה 2)"),
  c("lyavr-dtavkr", "kofiko", "dubber", "קופיקו (עונות 3–4)"),
  c("gali-hazan", "kofiko", "actor", "קופיקו (עונה 2)"),
  c("tal-levi-puppeteer", "kofiko", "actor", "קופיקו (בובנאות)"),
  c("yael-barkman", "kofiko", "actor", "קופיקו (בובנאות)"),
  c("dor-zweigenboom", "kofiko", "actor", "שלומק'ה לזר (עונה 1)"),
  c("yosi-marshak", "kofiko", "actor", "שלומק'ה לזר (עונות 2–4)"),
  c("dorit-peled", "kofiko", "actor", "תמר לזר (עונה 1)"),
  c("idit-neudorfer", "kofiko", "actor", "תמר לזר (עונות 2–4)"),
  c("hila-luzia", "kofiko", "actor", "אורנה לזר (עונות 2–4)"),
  c("maayan-aloni", "kofiko", "actor", "יורם לזר (עונות 2–4)"),
  c("br-mynyaly", "kofiko", "actor", "נגה לזר (עונות 2–4)"),
  c("rudi-saada", "kofiko", "actor", "אברום תפוחי (עונות 2–4)"),
  c("tly-avrn", "kofiko", "actor", "שושנה תפוחי (עונות 2–4)"),
  c("daniel-litvin", "kofiko", "actor", "דובי תפוחי (עונות 2–4)"),

  // —— קופיקו – חוקי הג'ונגל ——
  c("adi-benyaminov", "kofiko-jungle-laws", "director"),
  c("chanan-peled", "kofiko-jungle-laws", "writer"),
  c("mykl-mvktr", "kofiko-jungle-laws", "dubber", "קופיקו"),
  c("tal-levi-puppeteer", "kofiko-jungle-laws", "actor", "קופיקו (בובנאות)"),
  c("yael-barkman", "kofiko-jungle-laws", "actor", "קופיקו (בובנאות)"),
  c("yosi-marshak", "kofiko-jungle-laws", "actor", "שלומק'ה לזר"),
  c("idit-neudorfer", "kofiko-jungle-laws", "actor", "תמר לזר"),
  c("br-mynyaly", "kofiko-jungle-laws", "actor", "נגה לזר"),
  c("rudi-saada", "kofiko-jungle-laws", "actor", "אברום תפוחי"),
  c("tly-avrn", "kofiko-jungle-laws", "actor", "שושנה תפוחי"),

  // —— ארץ נהדרת (ויקיפדיה / ויקידאטה Q2910877) ——
  c("eyal-kitzis", "eretz-nehederet", "host", "מנחה"),
  c("eli-finish", "eretz-nehederet", "actor"),
  c("mariano-idelman", "eretz-nehederet", "actor"),
  c("almh-zk", "eretz-nehederet", "actor"),
  c("yuval-semo", "eretz-nehederet", "actor"),
  c("tl-prydmn", "eretz-nehederet", "actor"),
  c("shny-khn", "eretz-nehederet", "actor"),
  c("assi-cohen", "eretz-nehederet", "actor"),
  c("eran-zarhovitz", "eretz-nehederet", "actor"),
  c("rvay-br-ntn", "eretz-nehederet", "actor"),
  c("yaron-berlad", "eretz-nehederet", "actor"),
  c("lyat-hr-lb", "eretz-nehederet", "actor"),
  c("tom-yaar", "eretz-nehederet", "actor"),
  c("udi-kagan", "eretz-nehederet", "actor"),
  c("shrvn-tyykr", "eretz-nehederet", "actor"),
  c("gyh-bar-gvrbyts", "eretz-nehederet", "actor"),
  c("avry-lyyzrvbyts", "eretz-nehederet", "actor"),
  c("lior-ashkenazi", "eretz-nehederet", "actor"),
  c("shchr-chsvn", "eretz-nehederet", "actor"),
  c("orna-banai", "eretz-nehederet", "actor"),
  c("yaniv-biton", "eretz-nehederet", "actor"),
  c("amir-shurush", "eretz-nehederet", "actor"),
  c("tamir-bar", "eretz-nehederet", "actor"),
  c("dudu-erez", "eretz-nehederet", "actor"),
  c("maor-cohen", "eretz-nehederet", "actor"),
  c("dov-navon", "eretz-nehederet", "actor"),
  c("gitit-fisher", "eretz-nehederet", "actor"),
  c("avral-tsbry", "eretz-nehederet", "actor"),
  c("muli-segev", "eretz-nehederet", "writer"),
  c("david-lifshitz", "eretz-nehederet", "writer"),
];
