import type {
  ActivityCategory,
  ArchiveData,
  Credit,
  Person,
  Production,
} from "./types";
import { EXTRA_PEOPLE } from "./seed-extra";
import { WAVE2_CREDITS, WAVE2_PEOPLE, WAVE2_PRODUCTIONS } from "./seed-wave2";
import { DUB_CAST_CREDITS } from "./seed-dub-cast";
import { SERIES_CAST_CREDITS, SERIES_CAST_PEOPLE } from "./seed-series-cast";
import { WIKI_DUBBERS } from "./seed-wiki-dubbers";
import { DECEASED_DUBBERS_PEOPLE } from "./seed-deceased-dubbers";
import { WIKI_DUBBED_FILMS } from "./seed-wiki-films";
import {
  HOP_TAMIR_CREDITS,
  HOP_TAMIR_PEOPLE,
  HOP_TAMIR_PRODUCTIONS,
} from "./seed-hop-tamir";
import {
  HOP_TAMIR_GAME_CREDITS,
  HOP_TAMIR_GAMES,
} from "./seed-hop-tamir-games";
import {
  PPTX_DUBBERS_CREDITS,
  PPTX_DUBBERS_PEOPLE,
  PPTX_DUBBERS_PRODUCTIONS,
} from "./seed-pptx-dubbers";
import { dedupeArchive } from "./dedupe";
import { ensureDiscographyProductions } from "./discography-productions";
import { applyDerivedProfessionActivities } from "./derive-activities";
import { ensureFilmographies } from "./filmography";
import { applyPeopleEnrichment } from "./person-dates";
import { applyIshimChnnGoldblatt } from "./seed-ishim-chnn-goldblatt";
import { applyIshimGadiPor } from "./seed-ishim-gadi-por";
import { applyIshimAzraHs } from "./seed-ishim-azra-hs";
import { applyIshimAnvrShtgrAzra } from "./seed-ishim-anvr-shtgr-azra";
import { applyIshimChnhDrvryKshy } from "./seed-ishim-chnh-drvry-kshy";
import { applyIshimHyhHyhHadm } from "./seed-ishim-hyh-hyh-hadm";
import { applyIshimNalvlym } from "./seed-ishim-nalvlym";
import { applyIshimKopyko2009 } from "./seed-ishim-kopyko-2009";
import { applyIshimPeterPan } from "./seed-ishim-peter-pan";
import { applyIshimPinocchioAdventures1993 } from "./seed-ishim-pinocchio-adventures";
import { applyIshimTuviaTsafir } from "./seed-ishim-tuvia-tsafir";
import { applyIshimYaakovShemTov } from "./seed-ishim-yaakov-shem-tov";
import { portrait } from "./portrait";

const now = "2026-07-23T00:00:00.000Z";

function wikiImage(title: string, also?: string) {
  return portrait(title, also);
}

function person(
  partial: Omit<Person, "createdAt" | "updatedAt" | "nicknames" | "tags" | "activities"> & {
    nicknames?: string[];
    tags?: string[];
    activities: ActivityCategory[];
  }
): Person {
  return {
    nicknames: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function production(
  partial: Omit<Production, "createdAt" | "updatedAt" | "genres" | "summary"> & {
    genres?: string[];
    summary?: string;
  }
): Production {
  return {
    genres: [],
    summary: "",
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

const people: Person[] = [
  person({
    id: "gila-almagor",
    name: "גילה אלמגור",
    nameOriginal: "Gila Almagor",
    birthDate: "1939-07-21",
    bio: "שחקנית, סופרת ויוצרת ישראלית. מדמויות המפתח בקולנוע ובתיאטרון הישראלי.",
    imageUrl: "/images/gila-almagor.jpg",
    tags: ["תיאטרון", "קולנוע", "ספרות"],
    activities: ["film", "series", "stage"],
  }),
  person({
    id: "assi-dayan",
    name: "אסי דיין",
    nameOriginal: "Assi Dayan",
    birthDate: "1945-11-06",
    deathDate: "2014-05-01",
    bio: "שחקן, במאי ותסריטאי ישראלי. יצר וכיכב ביצירות מרכזיות בקולנוע הישראלי.",
    imageUrl: "/images/assi-dayan.jpg",
    tags: ["במאי", "שחקן", "תסריטאי"],
    activities: ["film", "series"],
  }),
  person({
    id: "lior-ashkenazi",
    name: "ליאור אשכנזי",
    nameOriginal: "Lior Ashkenazi",
    birthDate: "1968-12-28",
    bio: "שחקן קולנוע, טלוויזיה ותיאטרון ישראלי.",
    imageUrl: "/images/lior-ashkenazi.jpg",
    tags: ["קולנוע", "טלוויזיה"],
    activities: ["film", "series", "stage"],
  }),
  person({
    id: "yael-abeccassis",
    name: "יעל אבקסיס",
    nameOriginal: "Yael Abecassis",
    birthDate: "1967-07-19",
    bio: "שחקנית ודוגמנית ישראלית.",
    imageUrl: "/images/yael-abecassis.jpg",
    tags: ["קולנוע", "טלוויזיה"],
    activities: ["film", "series"],
  }),
  person({
    id: "uri-zohar",
    name: "אורי זוהר",
    nameOriginal: "Uri Zohar",
    birthDate: "1935-11-04",
    deathDate: "2022-06-02",
    bio: "במאי, שחקן וקומיקאי ישראלי. דמות מכוננת בקולנוע הישראלי.",
    imageUrl: wikiImage("אורי זוהר"),
    tags: ["במאי", "קומדיה"],
    activities: ["film", "stage"],
  }),
  person({
    id: "maya-dagan",
    name: "מיה דגן",
    nameOriginal: "Maya Dagan",
    birthDate: "1971-05-01",
    bio: "שחקנית וכוכבת טלוויזיה ישראלית, וגם מדבבת.",
    imageUrl: wikiImage("מיה דגן"),
    tags: ["טלוויזיה", "דיבוב"],
    activities: ["series", "dubbing", "film"],
  }),
  person({
    id: "ronny-kuban",
    name: "רוני קובן",
    nameOriginal: "Roni Kuban",
    bio: "עיתונאי ומנחה טלוויזיה ישראלי.",
    imageUrl: wikiImage("רוני קובן"),
    tags: ["טלוויזיה", "עיתונות"],
    activities: ["hosting", "series"],
  }),
  person({
    id: "hana-maron",
    name: "חנה מרון",
    nameOriginal: "Hanna Maron",
    birthDate: "1923-11-22",
    deathDate: "2014-05-30",
    bio: "שחקנית תיאטרון וקולנוע, זוכת פרס ישראל.",
    imageUrl: wikiImage("חנה מרון"),
    tags: ["תיאטרון", "פרס ישראל"],
    activities: ["stage", "film", "series"],
  }),

  // —— מדבבים ויוצרי דיבוב ——
  person({
    id: "shafrira-zachai",
    name: "שפרירה זכאי",
    nameOriginal: "Shafrira Zachai",
    birthDate: "1932-01-01",
    bio: "חלוצת הדיבוב העברי בישראל. שחקנית, מדבבת, במאית דיבוב ומתרגמת. הקימה את חברת ״סרטי אז״ והובילה דיבובים קלאסיים לטלוויזיה החינוכית ולדיסני.",
    imageUrl: wikiImage("שפרירה זכאי"),
    tags: ["דיבוב", "בימוי דיבוב", "חלוצה"],
    activities: ["dubbing", "film", "series", "cassette", "stage"],
  }),
  person({
    id: "yaffa-gabay",
    name: "יפה גבאי",
    nameOriginal: "Yaffa Gabay",
    bio: "מוותיקות הדיבוב בישראל. קולה מזוהה עם דמויות אייקוניות כמו מרקו (״הלב״), דני שובבני, ובינג׳ו.",
    imageUrl: wikiImage("יפה גבאי"),
    tags: ["דיבוב", "ילדים"],
    activities: ["dubbing", "series", "cassette", "film"],
  }),
  person({
    id: "sharon-cohen",
    name: "שרון כהן",
    nameOriginal: "Sharon Cohen",
    bio: "מדבב, במאי דיבוב, מתרגם ומעבד שירים. מהדמויות המרכזיות בדיבוב העברי העכשווי.",
    imageUrl: wikiImage("שרון כהן (מדבב)"),
    tags: ["דיבוב", "בימוי דיבוב", "תרגום"],
    activities: ["dubbing", "film", "series", "musical"],
  }),
  person({
    id: "daniel-magon",
    name: "דניאל מגון",
    nameOriginal: "Daniel Magon",
    birthDate: "1988-03-15",
    bio: "שחקן ומדבב ישראלי. דיבב מגיל צעיר בהפקות רבות, כולל דיסני ואנימציה, והשתתף גם בפסטיגל.",
    imageUrl: wikiImage("דניאל מגון"),
    tags: ["דיבוב", "שחקן", "פסטיגל"],
    activities: ["dubbing", "film", "series", "festival", "stage"],
  }),
  person({
    id: "eliana-magon",
    name: "אליענה מגון",
    nameOriginal: "Eliana Magon",
    bio: "מדבבת ושחקנית ישראלית. אחותם של דניאל ויהונתן מגון.",
    imageUrl: wikiImage("אליענה מגון"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film"],
  }),
  person({
    id: "yonatan-magon",
    name: "יהונתן מגון",
    nameOriginal: "Yonatan Magon",
    bio: "מדבב ושחקן ישראלי. ממשפחת המגונים — מהמשפחות הבולטות בדיבוב הישראלי.",
    imageUrl: wikiImage("יהונתן מגון"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film"],
  }),
  person({
    id: "kobi-likverman",
    name: "קובי ליקורמן",
    nameOriginal: "Kobi Likverman",
    bio: "מדבב ישראלי פורה בסרטי אנימציה והפקות ילדים ונוער.",
    imageUrl: wikiImage("קובי ליקורמן"),
    tags: ["דיבוב", "אנימציה"],
    activities: ["dubbing", "film", "series"],
  }),
  person({
    id: "laura-shopov",
    name: "לורה שופוב",
    nameOriginal: "Laura Shopov",
    bio: "מדבבת ישראלית בהפקות אנימציה וקולנוע מדובב.",
    imageUrl: wikiImage("לורה שופוב"),
    tags: ["דיבוב"],
    activities: ["dubbing", "film", "series"],
  }),
  person({
    id: "shiri-gadni",
    name: "שירי גדני",
    nameOriginal: "Shiri Gadni",
    bio: "שחקנית ומדבבת ישראלית. מוכרת ממשחק ומדיבוב בהפקות ילדים ומבוגרים.",
    imageUrl: wikiImage("שירי גדני"),
    tags: ["דיבוב", "משחק"],
    activities: ["dubbing", "film", "series", "stage"],
  }),
  person({
    id: "tsvika-furman",
    name: "צביקה פורמן",
    nameOriginal: "Tsvika Furman",
    bio: "מדבב ישראלי. קולו מזוהה עם דמויות רבות באנימציה ובסדרות ילדים.",
    imageUrl: wikiImage("צביקה פורמן"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film", "cassette"],
  }),
  person({
    id: "ayelet-robinson",
    name: "איילת רובינסון",
    nameOriginal: "Ayelet Robinson",
    bio: "מדבבת ישראלית בהפקות טלוויזיה וקולנוע מדובב.",
    imageUrl: wikiImage("איילת רובינסון"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film"],
  }),
  person({
    id: "rama-messinger",
    name: "רמה מסינגר",
    nameOriginal: "Rama Messinger",
    birthDate: "1968-01-01",
    deathDate: "2015-07-18",
    bio: "שחקנית, זמרת ומדבבת ישראלית. כיכבה במחזמרים ובדיבובים אייקוניים.",
    imageUrl: wikiImage("רמה מסינגר"),
    tags: ["דיבוב", "מחזמר", "זמרת"],
    activities: ["dubbing", "musical", "stage", "film", "series", "performance"],
  }),
  person({
    id: "avi-hadash",
    name: "אבי חדש",
    nameOriginal: "Avi Hadash",
    bio: "מדבב ושחקן ישראלי. מוכר מקולות רבים בסדרות ובסרטים מדובבים.",
    imageUrl: wikiImage("אבי חדש"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film"],
  }),
  person({
    id: "yoram-yosefsberg",
    name: "יורם יוספסברג",
    nameOriginal: "Yoram Yosefsberg",
    bio: "מדבב ישראלי ותיק. קולו מופיע בעשרות הפקות ילדים ומבוגרים.",
    imageUrl: wikiImage("יורם יוספסברג"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film", "cassette"],
  }),
  person({
    id: "ami-mandelman",
    name: "עמי מנדלמן",
    nameOriginal: "Ami Mandelman",
    bio: "מדבב, זמר ושחקן ישראלי. מהקולות המזוהים ביותר בדיבוב העברי.",
    imageUrl: wikiImage("עמי מנדלמן"),
    tags: ["דיבוב", "זמר"],
    activities: ["dubbing", "musical", "film", "series", "performance"],
  }),
  person({
    id: "gilad-kelter",
    name: "גלעד קלטר",
    nameOriginal: "Gilad Kelter",
    bio: "מדבב ישראלי בהפקות אנימציה ודיבוב עברי עכשווי.",
    imageUrl: wikiImage("גלעד קלטר"),
    tags: ["דיבוב"],
    activities: ["dubbing", "film", "series"],
  }),
  person({
    id: "liron-lev",
    name: "לירון לב",
    nameOriginal: "Liron Lev",
    bio: "מדבב ישראלי. דיבב דמויות מרכזיות בסרטי דיסני ובהפקות ילדים.",
    imageUrl: wikiImage("לירון לב"),
    tags: ["דיבוב", "דיסני"],
    activities: ["dubbing", "film", "series", "musical"],
  }),
  person({
    id: "einat-gliksman",
    name: "עינת גליקסמן",
    nameOriginal: "Einat Gliksman",
    bio: "מדבבת ישראלית בהפקות ילדים ואנימציה.",
    imageUrl: wikiImage("עינת גליקסמן"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film"],
  }),
  person({
    id: "hadar-shahaf-maayan",
    name: "הדר שחף־מעיין",
    nameOriginal: "Hadar Shahaf-Maayan",
    bio: "מדבבת ישראלית. קולה מזוהה עם דמויות נשיות מרכזיות באנימציה.",
    imageUrl: wikiImage("הדר שחף-מעיין"),
    tags: ["דיבוב"],
    activities: ["dubbing", "film", "series"],
  }),
  person({
    id: "tal-mosseri",
    name: "טל מוסרי",
    nameOriginal: "Tal Mosseri",
    bio: "שחקן, מנחה ומדבב. מוכר מחינוכית, מפסטיגל ומהפקות ילדים.",
    imageUrl: wikiImage("טל מוסרי"),
    tags: ["הנחיה", "דיבוב", "פסטיגל"],
    activities: ["hosting", "dubbing", "festival", "series", "performance"],
  }),
  person({
    id: "tomer-sharon",
    name: "תומר שרון",
    nicknames: ["טרייסי"],
    nameOriginal: "Tomer Sharon",
    bio: "שחקן, קומיקאי ומדבב. מוכר גם בשם הבמה טרייסי.",
    imageUrl: wikiImage("תומר שרון"),
    tags: ["דיבוב", "קומדיה"],
    activities: ["dubbing", "film", "series", "stage", "performance"],
  }),
  person({
    id: "miki-kam",
    name: "מיקי קם",
    nameOriginal: "Miki Kam",
    bio: "שחקנית, קומיקאית ומדבבת ישראלית.",
    imageUrl: wikiImage("מיקי קם"),
    tags: ["דיבוב", "קומדיה", "תיאטרון"],
    activities: ["dubbing", "stage", "film", "series", "performance"],
  }),
  person({
    id: "dudu-zar",
    name: "דודו זר",
    nameOriginal: "Dudu Zar",
    bio: "שחקן, זמר ומדבב. מוכר מהפקות ילדים, מחזמרים ודיבוב.",
    imageUrl: wikiImage("דודו זר"),
    tags: ["דיבוב", "מחזמר", "ילדים"],
    activities: ["dubbing", "musical", "festival", "performance", "series"],
  }),
  person({
    id: "shasi-keshet",
    name: "ששי קשת",
    nameOriginal: "Sassi Keshet",
    bio: "זמר, שחקן וכוכב מחזמרים ישראלי.",
    imageUrl: wikiImage("ששי קשת"),
    tags: ["מחזמר", "זמר"],
    activities: ["musical", "stage", "performance", "film"],
  }),
  person({
    id: "riki-gal",
    name: "ריקי גל",
    nameOriginal: "Riki Gal",
    bio: "זמרת ושחקנית ישראלית. פעילה במחזמרים ובהופעות.",
    imageUrl: wikiImage("ריקי גל"),
    tags: ["מחזמר", "זמרת"],
    activities: ["musical", "performance", "stage", "film"],
  }),
  person({
    id: "moni-moshonov",
    name: "מוני מושונוב",
    nameOriginal: "Moni Moshonov",
    bio: "שחקן וקומיקאי ישראלי. תיאטרון, קולנוע וטלוויזיה.",
    imageUrl: wikiImage("מוני מושונוב"),
    tags: ["תיאטרון", "קולנוע"],
    activities: ["stage", "film", "series", "performance"],
  }),
  person({
    id: "shlomo-baraba",
    name: "שלמה בראבא",
    nameOriginal: "Shlomo Baraba",
    bio: "שחקן וקומיקאי ישראלי. במה, קולנוע וטלוויזיה.",
    imageUrl: wikiImage("שלמה בראבא"),
    tags: ["תיאטרון", "קומדיה"],
    activities: ["stage", "film", "series", "performance"],
  }),
  person({
    id: "debi-beserglik",
    name: "דבי בסרגליק",
    nameOriginal: "Debi Beserglik",
    bio: "מדבבת ישראלית ותיקה בהפקות ילדים וקלטות קלאסיות.",
    imageUrl: wikiImage("דבי בסרגליק"),
    tags: ["דיבוב", "קלטות"],
    activities: ["dubbing", "cassette", "series", "film"],
  }),
  person({
    id: "orna-katz",
    name: "אורנה כץ",
    nameOriginal: "Orna Katz",
    bio: "מדבבת ישראלית. קולה מופיע בסדרות ילדים רבות.",
    imageUrl: wikiImage("אורנה כץ"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "cassette", "film"],
  }),
  person({
    id: "alon-neumann",
    name: "אלון נוימן",
    nameOriginal: "Alon Neumann",
    bio: "שחקן ומדבב ישראלי.",
    imageUrl: wikiImage("אלון נוימן"),
    tags: ["דיבוב", "משחק"],
    activities: ["dubbing", "film", "series", "stage"],
  }),
  person({
    id: "nir-ron",
    name: "ניר רון",
    nameOriginal: "Nir Ron",
    bio: "מדבב ישראלי בהפקות אנימציה ודיבוב עברי.",
    imageUrl: wikiImage("ניר רון"),
    tags: ["דיבוב"],
    activities: ["dubbing", "film", "series"],
  }),
  person({
    id: "sapir-dermon",
    name: "ספיר דרמון",
    nameOriginal: "Sapir Dermon",
    bio: "מדבבת ישראלית בהפקות ילדים ואנימציה.",
    imageUrl: wikiImage("ספיר דרמון"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film"],
  }),
  person({
    id: "yoav-tsarfati",
    name: "יואב צרפתי",
    nameOriginal: "Yoav Tsarfati",
    bio: "מדבב ישראלי בהפקות עכשוויות.",
    imageUrl: wikiImage("יואב צרפתי"),
    tags: ["דיבוב"],
    activities: ["dubbing", "film", "series"],
  }),
  person({
    id: "eran-mor",
    name: "ערן מור",
    nameOriginal: "Eran Mor",
    bio: "מדבב ישראלי. דיבב דמויות מרכזיות בסרטי פיקסאר ודיסני.",
    imageUrl: wikiImage("ערן מור"),
    tags: ["דיבוב", "פיקסאר"],
    activities: ["dubbing", "film", "series"],
  }),
  person({
    id: "mati-atlas",
    name: "מתי אטלס",
    nameOriginal: "Mati Atlas",
    bio: "מדבב ישראלי ותיק בהפקות ילדים.",
    imageUrl: wikiImage("מתי אטלס"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "cassette", "film"],
  }),
  person({
    id: "efi-ben-israel",
    name: "אפי בן ישראל",
    nameOriginal: "Efi Ben Israel",
    bio: "מדבבת, זמרת ושחקנית. פעילה בדיבוב ובמחזמרים.",
    imageUrl: wikiImage("אפי בן ישראל"),
    tags: ["דיבוב", "מחזמר"],
    activities: ["dubbing", "musical", "series", "film", "performance"],
  }),
  person({
    id: "gilit-shoval",
    name: "גיתית שובל",
    nameOriginal: "Gilit Shoval",
    bio: "מדבבת ישראלית בהפקות ילדים ונוער.",
    imageUrl: wikiImage("גיתית שובל"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film"],
  }),
  person({
    id: "simcha-barbiro",
    name: "שמחה ברבירו",
    nameOriginal: "Simcha Barbiro",
    bio: "מדבב ישראלי. קולו מזוהה עם דמויות קומיות רבות.",
    imageUrl: wikiImage("שמחה ברבירו"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film", "cassette"],
  }),
  person({
    id: "assaf-preenta",
    name: "אסף פריינטא",
    nameOriginal: "Assaf Preenta",
    bio: "מדבב ישראלי בהפקות אנימציה.",
    imageUrl: wikiImage("אסף פריינטא"),
    tags: ["דיבוב"],
    activities: ["dubbing", "film", "series"],
  }),
  person({
    id: "michal-reshef",
    name: "מיכל רשף",
    nameOriginal: "Michal Reshef",
    bio: "מדבבת ישראלית בהפקות ילדים.",
    imageUrl: wikiImage("מיכל רשף"),
    tags: ["דיבוב"],
    activities: ["dubbing", "series", "film"],
  }),
  person({
    id: "dani-bassan",
    name: "דני בסן",
    nameOriginal: "Dani Bassan",
    bio: "זמר ושחקן. פעיל במחזמרים ובהופעות.",
    imageUrl: wikiImage("דני בסן"),
    tags: ["מחזמר", "זמר"],
    activities: ["musical", "performance", "stage"],
  }),
  person({
    id: "tamir-ginsburg",
    name: "תמיר גינזבורג",
    nameOriginal: "Tamir Ginsburg",
    bio: "שחקן ומדבב ישראלי. דיבוב עברי בהפקות קולנוע וטלוויזיה.",
    imageUrl: wikiImage("תמיר גינזבורג"),
    tags: ["דיבוב", "משחק"],
    activities: ["dubbing", "film", "series"],
  }),
];

const productions: Production[] = [
  production({
    id: "waltz-with-bashir",
    title: "ואלס עם באשיר",
    originalTitle: "Waltz with Bashir",
    year: 2008,
    kind: "documentary",
    summary: "סרט אנימציה דוקומנטרי על זיכרון המלחמה בלבנון.",
    genres: ["דוקומנטרי", "אנימציה"],
    imageUrl: "/images/waltz-with-bashir.jpg",
  }),
  production({
    id: "shtisel",
    title: "שטיסל",
    originalTitle: "Shtisel",
    year: 2013,
    endYear: 2021,
    kind: "series",
    summary:
      "דרמה משפחתית על משפחה חרדית בירושלים. בכיכוב דב גליקמן, מיכאל אלוני, נטע ריסקין ושירה האס.",
    genres: ["דרמה"],
    channel: "yes",
    imageUrl: "/images/shtisel.jpg",
  }),
  production({
    id: "fauda",
    title: "פאודה",
    originalTitle: "Fauda",
    year: 2015,
    kind: "series",
    summary:
      "סדרת מתח על יחידת מסתערבים. נוצרה בכיכוב ליאור רז (דורון קביליו), עם צחי הלוי, איציק כהן ויובל סגל.",
    genres: ["מתח", "דרמה"],
    channel: "yes",
    imageUrl: wikiImage("פאודה"),
  }),
  production({
    id: "the-band-s-visit",
    title: "ביקור התזמורת",
    originalTitle: "The Band's Visit",
    year: 2007,
    kind: "film",
    summary: "דרמה־קומית על תזמורת מצרית בעיירה ישראלית.",
    genres: ["דרמה", "קומדיה"],
    imageUrl: "/images/the-bands-visit.jpg",
  }),
  production({
    id: "beaufort",
    title: "בופור",
    originalTitle: "Beaufort",
    year: 2007,
    kind: "film",
    summary: "סרט מלחמה על מוצב בופור בלבנון.",
    genres: ["מלחמה", "דרמה"],
    imageUrl: wikiImage("בופור (סרט)"),
  }),
  production({
    id: "ha-hamama",
    title: "החממה",
    originalTitle: "The Greenhouse",
    year: 2012,
    endYear: 2016,
    kind: "series",
    summary:
      "סדרת נוער של גיורא חמיצר על פנימייה למנהיגות. בכיכוב גאיה שליטא־כץ, לי בירן, דניאל ליטמן ודר זוזובסקי.",
    genres: ["נוער", "דרמה"],
    channel: "Nickelodeon ישראל",
    imageUrl: wikiImage("החממה"),
  }),
  production({
    id: "ramzor",
    title: "רמזור",
    originalTitle: "Ramzor",
    year: 2008,
    endYear: 2014,
    kind: "series",
    summary:
      "קומדיית מצבים של אדיר מילר על שלושה חברי ילדות בגבעתיים בשלבי זוגיות שונים (איצקו, אמיר וחפר). שודרה בקשת בערוץ 2 במשך ארבע עונות; זוכת פרס האמי הבינלאומי לקומדיה (2010).",
    genres: ["קומדיה"],
    channel: "ערוץ 2",
    studio: "קופרמן הפקות",
    imageUrl: wikiImage("רמזור (סדרת טלוויזיה)"),
  }),
  production({
    id: "eretz-nehederet",
    title: "ארץ נהדרת",
    originalTitle: "Eretz Nehederet",
    year: 2003,
    kind: "series",
    summary:
      "תוכנית בידור סאטירית של שידורי קשת (ערוץ 2, ומ־2017 קשת 12). בפורמט מהדורת חדשות מדומה בהנחיית איל קיציס, עם צוות קומיקאים שמדמים פוליטיקאים, אנשי ציבור ודמויות ישראליות. עלתה לראשונה ב־2 בנובמבר 2003; נוצרה על ידי מולי שגב.",
    genres: ["סאטירה", "קומדיה", "מערכונים"],
    channel: "קשת 12",
    studio: "שידורי קשת",
    imageUrl: wikiImage("ארץ נהדרת"),
  }),

  // —— דיבוב / ילדים / קלטות / מחזמר ——
  production({
    id: "the-smurfs-he",
    title: "הדרדסים",
    originalTitle: "The Smurfs",
    year: 1981,
    kind: "series",
    summary: "סדרת אנימציה קלאסית שדובבה לעברית ושודרה בטלוויזיה החינוכית.",
    genres: ["אנימציה", "ילדים", "מדובב"],
    channel: "הטלוויזיה החינוכית",
    studio: "סרטי אז",
    dubbingStudio: "סרטי אז",
    imageUrl: wikiImage("הדרדסים"),
  }),
  production({
    id: "care-bears-he",
    title: "דובוני אכפת לי",
    originalTitle: "Care Bears",
    year: 1985,
    kind: "series",
    summary: "סדרת ילדים מדובבת שעיצבה דור שלם בישראל.",
    genres: ["אנימציה", "ילדים", "מדובב"],
    channel: "הטלוויזיה החינוכית",
    dubbingStudio: "סרטי אז",
    imageUrl: wikiImage("דובוני אכפת לי"),
  }),
  production({
    id: "the-heart-marco",
    title: "הלב",
    originalTitle: "Cuore",
    year: 1979,
    kind: "series",
    summary: "סדרה מדובבת אייקונית; קולו של מרקו מזוהה עם יפה גבאי.",
    genres: ["ילדים", "דרמה", "מדובב"],
    channel: "הטלוויזיה החינוכית",
    dubbingStudio: "סרטי אז",
    imageUrl: wikiImage("הלב (סדרת טלוויזיה)"),
  }),
  production({
    id: "danny-phantom-style-danny",
    title: "דני שובבני",
    year: 1987,
    kind: "series",
    summary: "סדרת ילדים מדובבת קלאסית בטלוויזיה הישראלית.",
    genres: ["ילדים", "אנימציה", "מדובב"],
    channel: "הטלוויזיה החינוכית",
    dubbingStudio: "סרטי אז",
    imageUrl: wikiImage("דני שובבני"),
  }),
  production({
    id: "jungle-book-he-1988",
    title: "ספר הג'ונגל (דיבוב 1988)",
    originalTitle: "The Jungle Book",
    year: 1988,
    kind: "film",
    summary: "מדיבובי דיסני הראשונים בעברית בהפקת שפרירה זכאי — אבן דרך בדיבוב הישראלי.",
    genres: ["אנימציה", "דיסני", "ילדים", "מדובב"],
    studio: "סרטי אז / דיסני",
    dubbingStudio: "סרטי אז",
    imageUrl: wikiImage("ספר הג'ונגל"),
  }),
  production({
    id: "little-mermaid-he",
    title: "בת הים הקטנה",
    originalTitle: "The Little Mermaid",
    year: 1989,
    kind: "film",
    summary: "סרט דיסני מדובב לעברית — קלאסיקה של דיבוב, שירה ומחזמר־אנימציה.",
    genres: ["אנימציה", "דיסני", "מחזמר", "מדובב"],
    dubbingStudio: "אולפני וידאופילם אינטרנשיונל",
    imageUrl: wikiImage("בת הים הקטנה (סרט, 1989)"),
  }),
  production({
    id: "lion-king-he",
    title: "מלך האריות",
    originalTitle: "The Lion King",
    year: 1994,
    kind: "film",
    summary: "אחד מדיבובי דיסני המשפיעים ביותר בעברית.",
    genres: ["אנימציה", "דיסני", "מחזמר", "מדובב"],
    dubbingStudio: "אולפני וידאופילם אינטרנשיונל",
    imageUrl: wikiImage("מלך האריות"),
  }),
  production({
    id: "aladdin-he",
    title: "אלאדין",
    originalTitle: "Aladdin",
    year: 1992,
    kind: "film",
    summary: "סרט דיסני מדובב לעברית עם דגש על שירה ודמויות קומיות.",
    genres: ["אנימציה", "דיסני", "מדובב"],
    dubbingStudio: "אולפני וידאופילם אינטרנשיונל",
    imageUrl: wikiImage("אלאדין (סרט, 1992)"),
  }),
  production({
    id: "festigal",
    title: "הפסטיגל",
    year: 1981,
    kind: "festival",
    summary: "מופע ילדים ישראלי שנתי — שירה, משחק והופעות על במה.",
    genres: ["ילדים", "מופע", "שירה"],
    imageUrl: wikiImage("הפסטיגל"),
  }),
  production({
    id: "rega-im-dudley",
    title: "רגע עם דודלי",
    year: 1976,
    endYear: 1981,
    kind: "tv_program",
    summary:
      "תוכנית ילדים קלאסית של החינוכית: שלמה ניצן (דודלי/חביתוש), ציפי מור (רגע) וספי ריבלין (פיסטוק).",
    genres: ["ילדים", "טלוויזיה", "קומדיה"],
    channel: "הטלוויזיה החינוכית",
    imageUrl: wikiImage("רגע עם דודלי"),
  }),
  production({
    id: "hopa-hey",
    title: "הופה היי",
    year: 1986,
    endYear: 1995,
    kind: "tv_program",
    summary:
      "להקה ותוכנית ילדים בערוץ הראשון — יגאל בשן, עוזי חיטמן ויונתן מילר, ואחר כך אבי דור ואהרון פררה; ספי ריבלין אורח קבוע בעונה השנייה.",
    genres: ["ילדים", "טלוויזיה", "מוזיקה"],
    channel: "הערוץ הראשון",
    imageUrl: wikiImage("הופה היי"),
  }),
  production({
    id: "itcha",
    title: "איצ׳ה",
    year: 1994,
    endYear: 1997,
    kind: "series",
    summary:
      "קומדיית מצבים בערוץ 2 (רשת) בכיכוב ספי ריבלין, עליזה רוזן, שגית אמת ואבי טרמין — עיבוד ל„הכל נשאר במשפחה”.",
    genres: ["קומדיה", "טלוויזיה"],
    channel: "ערוץ 2",
    imageUrl: wikiImage("איצ'ה"),
  }),
  production({
    id: "sefi-tv",
    title: "ספי",
    year: 1998,
    endYear: 1999,
    kind: "series",
    summary: "סדרת קומדיה בכיכוב ספי ריבלין בסגנון מיסטר בין.",
    genres: ["קומדיה", "טלוויזיה"],
    channel: "ערוץ 2",
    imageUrl: wikiImage("ספי ריבלין"),
  }),
  production({
    id: "ha-shigaon-hagadol",
    title: "השגעון הגדול",
    year: 1986,
    kind: "film",
    summary: "סרט קומדיה ישראלי בתפקיד ראשי של ספי ריבלין.",
    genres: ["קומדיה", "קולנוע"],
    imageUrl: wikiImage("השגעון הגדול"),
  }),
  production({
    id: "kids-song-cassettes",
    title: "קלטות שירי ילדים קלאסיות",
    year: 1980,
    kind: "cassette",
    summary: "ארכיון מייצג של קלטות שמע ווידאו לילדים — שירה, סיפור ודמויות מדובבות.",
    genres: ["ילדים", "קלטות", "שירה"],
    imageUrl: wikiImage("שירי ילדים"),
  }),
  production({
    id: "les-miserables-il",
    title: "עלובי החיים (מחזמר בישראל)",
    originalTitle: "Les Misérables",
    year: 1987,
    kind: "musical",
    summary: "מחזמר בינלאומי שהועלה בישראל עם שחקנים וזמרים מקומיים.",
    genres: ["מחזמר", "במה"],
    imageUrl: wikiImage("עלובי החיים"),
  }),
  production({
    id: "digimon-he",
    title: "דיג'ימון",
    originalTitle: "Digimon",
    year: 1999,
    kind: "series",
    summary: "סדרת אנימה מדובבת לעברית; מגון ואחרים דיבבו בה מגיל צעיר.",
    genres: ["אנימה", "ילדים", "מדובב"],
    channel: "ערוץ הילדים",
    dubbingStudio: "אולפני וידאופילם אינטרנשיונל",
    imageUrl: wikiImage("דיג'ימון"),
  }),
  production({
    id: "once-upon-a-time-life",
    title: "היה היה – החיים",
    originalTitle: "Il était une fois... la Vie",
    year: 1987,
    kind: "series",
    summary: "סדרה חינוכית מדובבת קלאסית בהפקת שפרירה זכאי.",
    genres: ["ילדים", "חינוכי", "אנימציה", "מדובב"],
    channel: "הטלוויזיה החינוכית",
    dubbingStudio: "סרטי אז",
    imageUrl: wikiImage("היה היה – החיים"),
  }),
];

const credits: Credit[] = [
  { personId: "assi-dayan", productionId: "waltz-with-bashir", role: "actor" },
  { personId: "lior-ashkenazi", productionId: "beaufort", role: "actor" },
  { personId: "gila-almagor", productionId: "the-band-s-visit", role: "actor" },

  { personId: "sefi-rivlin", productionId: "ha-shigaon-hagadol", role: "actor" },
  { personId: "sefi-rivlin", productionId: "festigal-classic", role: "host", characterName: "מנחה (1989, 1993)" },
  { personId: "sefi-rivlin", productionId: "festigal", role: "host" },

  { personId: "shafrira-zachai", productionId: "the-smurfs-he", role: "dub_director" },
  { personId: "shafrira-zachai", productionId: "care-bears-he", role: "dub_director" },
  { personId: "shafrira-zachai", productionId: "jungle-book-he-1988", role: "dub_director" },
  { personId: "shafrira-zachai", productionId: "once-upon-a-time-life", role: "dub_director" },
  { personId: "yaffa-gabay", productionId: "the-heart-marco", role: "dubber", characterName: "מרקו" },
  { personId: "yaffa-gabay", productionId: "danny-phantom-style-danny", role: "dubber" },
  { personId: "yaffa-gabay", productionId: "care-bears-he", role: "dubber" },
  { personId: "sharon-cohen", productionId: "lion-king-he", role: "dub_director" },
  { personId: "sharon-cohen", productionId: "little-mermaid-he", role: "dubber" },
  { personId: "ami-mandelman", productionId: "lion-king-he", role: "dubber" },
  { personId: "ami-mandelman", productionId: "aladdin-he", role: "dubber" },
  { personId: "liron-lev", productionId: "little-mermaid-he", role: "singer" },
  { personId: "liron-lev", productionId: "lion-king-he", role: "dubber" },
  { personId: "rama-messinger", productionId: "little-mermaid-he", role: "dubber" },
  { personId: "rama-messinger", productionId: "les-miserables-il", role: "musical_performer" },
  { personId: "daniel-magon", productionId: "digimon-he", role: "dubber" },
  { personId: "daniel-magon", productionId: "festigal", role: "musical_performer" },
  { personId: "eliana-magon", productionId: "digimon-he", role: "dubber" },
  { personId: "yonatan-magon", productionId: "digimon-he", role: "dubber" },
  { personId: "tsvika-furman", productionId: "the-smurfs-he", role: "dubber" },
  { personId: "yoram-yosefsberg", productionId: "care-bears-he", role: "dubber" },
  { personId: "avi-hadash", productionId: "aladdin-he", role: "dubber" },
  { personId: "kobi-likverman", productionId: "lion-king-he", role: "dubber" },
  { personId: "tal-mosseri", productionId: "festigal", role: "host" },
  { personId: "dudu-zar", productionId: "festigal", role: "singer" },
  { personId: "dudu-zar", productionId: "kids-song-cassettes", role: "singer" },
  { personId: "debi-beserglik", productionId: "kids-song-cassettes", role: "dubber" },
  { personId: "orna-katz", productionId: "the-smurfs-he", role: "dubber" },
  { personId: "simcha-barbiro", productionId: "aladdin-he", role: "dubber" },
  { personId: "shasi-keshet", productionId: "les-miserables-il", role: "musical_performer" },
  { personId: "riki-gal", productionId: "les-miserables-il", role: "singer" },
  { personId: "efi-ben-israel", productionId: "little-mermaid-he", role: "dubber" },
  { personId: "miki-kam", productionId: "festigal", role: "musical_performer" },
  { personId: "tomer-sharon", productionId: "festigal", role: "musical_performer" },
  { personId: "eran-mor", productionId: "lion-king-he", role: "dubber" },
  { personId: "hadar-shahaf-maayan", productionId: "little-mermaid-he", role: "dubber" },
  { personId: "tamir-ginsburg", productionId: "little-mermaid-he", role: "dubber" },
];

export const SEED: ArchiveData = applyIshimPinocchioAdventures1993(
  applyIshimYaakovShemTov(
  applyIshimKopyko2009(
  applyIshimPeterPan(
  applyIshimAnvrShtgrAzra(
  applyIshimChnhDrvryKshy(
  applyIshimNalvlym(
  applyIshimHyhHyhHadm(
  applyIshimChnnGoldblatt(
  applyIshimTuviaTsafir(
  applyIshimGadiPor(
  applyIshimAzraHs(
  applyDerivedProfessionActivities(
  ensureDiscographyProductions(
  ensureFilmographies(
  dedupeArchive({
  people: (() => {
    const map = new Map<string, Person>();
    for (const person of [
      ...people,
      ...EXTRA_PEOPLE,
      ...WAVE2_PEOPLE,
      ...HOP_TAMIR_PEOPLE,
      ...SERIES_CAST_PEOPLE,
      ...WIKI_DUBBERS,
      ...DECEASED_DUBBERS_PEOPLE,
      ...PPTX_DUBBERS_PEOPLE,
    ]) {
      const existing = map.get(person.id);
      if (!existing) {
        map.set(person.id, person);
        continue;
      }
      map.set(person.id, {
        ...existing,
        ...person,
        bio: existing.bio?.length > (person.bio?.length || 0) ? existing.bio : person.bio,
        imageUrl:
          person.imageUrl?.includes("also=") || person.imageUrl?.startsWith("/images/")
            ? person.imageUrl
            : existing.imageUrl || person.imageUrl,
        activities:
          (existing.activities?.length || 0) >= (person.activities?.length || 0)
            ? existing.activities
            : person.activities,
        nameOriginal: existing.nameOriginal || person.nameOriginal,
        nicknames: existing.nicknames?.length ? existing.nicknames : person.nicknames,
        tags: existing.tags?.length ? existing.tags : person.tags,
      });
    }
    return applyPeopleEnrichment([...map.values()]);
  })(),
  productions: (() => {
    const map = new Map<string, Production>();
    for (const item of [
      ...productions,
      ...WAVE2_PRODUCTIONS,
      ...HOP_TAMIR_PRODUCTIONS,
      ...HOP_TAMIR_GAMES,
      ...WIKI_DUBBED_FILMS,
      ...PPTX_DUBBERS_PRODUCTIONS,
    ]) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    return [...map.values()];
  })(),
  credits: (() => {
    const key = (c: Credit) => `${c.productionId}_${c.personId}_${c.role}`;
    const map = new Map<string, Credit>();
    for (const raw of [
      ...credits,
      ...WAVE2_CREDITS,
      ...HOP_TAMIR_CREDITS,
      ...HOP_TAMIR_GAME_CREDITS,
      ...DUB_CAST_CREDITS,
      ...SERIES_CAST_CREDITS,
      ...PPTX_DUBBERS_CREDITS,
    ]) {
      const c = {
        ...raw,
        personId: raw.personId.replace(/-w2$/i, ""),
      };
      const k = key(c);
      const existing = map.get(k);
      // Prefer entries that include a character name
      if (!existing) map.set(k, c);
      else if (!existing.characterName && c.characterName) map.set(k, c);
    }
    return [...map.values()];
  })(),
  contributions: [],
  })
  )
  )
  )
  )
  )
  )
  )
  )
  )
  )
  )
  )
  )
  )
);
