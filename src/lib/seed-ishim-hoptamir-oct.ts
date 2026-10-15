import { canonicalPersonName } from "./aliases";
import { assignBillingOrders } from "./credit-order";
import { slugify } from "./ids";
import { portrait } from "./portrait";
import type {
  ArchiveData,
  Credit,
  CreditRole,
  Person,
  Production,
  ProductionKind,
} from "./types";

const NOW = "2026-10-15T00:00:00.000Z";
const SOURCE = "ערוץ הופ תמיר";

type CreditRow = {
  name: string;
  role: CreditRole;
  heading: string;
  character?: string;
  year?: number;
  endYear?: number;
};

type Show = {
  id: string;
  title: string;
  originalTitle?: string;
  year: number;
  endYear?: number;
  kind: ProductionKind;
  summary: string;
  genres: string[];
  channel?: string;
  runtimeMinutes?: number;
  episodeCount?: number;
  ishimKeys?: string[];
  ishimNotes?: { heading: string; items: string[] }[];
  sourceUrl: string;
  credits: CreditRow[];
};

const HOP = "https://sites.google.com/view/hoptamir/";

function page(slug: string): string {
  return HOP + slug;
}

const SHOWS: Show[] = [
  {
    id: "ht-hsyh-hshchvr",
    title: "הסייח השחור",
    originalTitle: "Black Beauty",
    year: 2003,
    kind: "film_dubbed_foreign",
    summary:
      "סיפורו של סוס שחור, העובר בין בעלים שונים וחווה אירועים בכפר ובעיר",
    genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר"],
    runtimeMinutes: 46,
    ishimNotes: [{ heading: "כללי", items: ["מבוסס על ספר"] }],
    sourceUrl: page(
      "%D7%94%D7%A1%D7%99%D7%99%D7%97-%D7%94%D7%A9%D7%97%D7%95%D7%A8-2003-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "שרון כהן", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "נטע בן צבי", role: "producer", heading: "הפקת דיבוב" },
      { name: "אסף קורמן", role: "dubber", heading: "מדבבים", character: "הסייח השחור" },
      { name: "אניה בוקשטיין", role: "dubber", heading: "מדבבים", character: "ג'ני" },
      { name: "הדר שחף-מעיין", role: "dubber", heading: "מדבבים", character: "ג'ני (בוגרת)" },
      { name: "סיון שביט", role: "dubber", heading: "מדבבים", character: "ג'ינג'ר / גברת גורדון" },
      { name: "יגאל מזרחי", role: "dubber", heading: "מדבבים", character: "אצן חייכן / דמויות שונות" },
      { name: "שמחה ברבירו", role: "dubber", heading: "מדבבים", character: "סם אוליבר / דמויות שונות" },
      { name: "אלברט כהן", role: "dubber", heading: "מדבבים", character: "ג'ון מנלי" },
      { name: "יגאל שדה", role: "dubber", heading: "מדבבים", character: "דאגלאס גורדון / אבא של ווילי" },
      { name: "מאי רוזנר", role: "dubber", heading: "מדבבים", character: "פלורה / ג'סי" },
      { name: "יעל עמית", role: "dubber", heading: "מדבבים", character: "ליידי ווסטמון" },
      { name: "לירון ברנס", role: "dubber", heading: "מדבבים", character: "מר יורק / סם" },
      { name: "דב רייזר", role: "dubber", heading: "מדבבים", character: "ג'רמייה ברקר" },
      { name: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "מספר / ד\"ר ווייט / דמויות שונות" },
      { name: "לני כהן", role: "dubber", heading: "מדבבים", character: "ווילי" },
      { name: "שרון כהן", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
      { name: "שרון כהן", role: "singer", heading: "מוזיקה", character: "שירה / תרגום שירים וניהול מוזיקלי" },
      { name: "הדר שחף-מעיין", role: "singer", heading: "מוזיקה", character: "שירה" },
      { name: "יגאל מזרחי", role: "singer", heading: "מוזיקה", character: "שירה" },
    ],
  },
  {
    id: "ht-bgs-chvvt",
    title: "באגס באני וחברים בעולם החיות",
    year: 1997,
    kind: "series_dubbed_foreign",
    summary: "באגס באני והקריינית מסבירים לחבריהם על עולם החי.",
    genres: ["אנימציה", "ילדים", "מדובב - זר", "קומדיה"],
    runtimeMinutes: 30,
    episodeCount: 5,
    ishimNotes: [
      {
        heading: "טריוויה לא מעניינת",
        items: [
          "שמות הפרקים היו: אריות הים, דובים, קופי אדם, אריות, פילים,",
          "כל חמש הפרקים יצאו בקלטות וידאו בלבד",
        ],
      },
    ],
    sourceUrl: page(
      "%D7%91%D7%90%D7%92%D7%A1-%D7%91%D7%90%D7%A0%D7%99-%D7%95%D7%97%D7%91%D7%A8%D7%99%D7%9D-%D7%91%D7%A2%D7%95%D7%9C%D7%9D-%D7%94%D7%97%D7%99%D7%95%D7%AA-1997-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "ענת ניב", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "ענת ניב", role: "producer", heading: "הפקת דיבוב" },
      { name: "יסמין גמליאל", role: "producer", heading: "הפקת דיבוב" },
      { name: "עוזי פוקס", role: "producer", heading: "הפקת דיבוב" },
      { name: "סאלי אמיגה", role: "producer", heading: "הפקת דיבוב" },
      { name: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
      { name: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "באגס באני" },
      { name: "ענת ניב", role: "dubber", heading: "מדבבים", character: "קריינית / אמא גורילה" },
      { name: "ניר פרידמן", role: "dubber", heading: "מדבבים", character: "ג'וניור דוב" },
      { name: "תומר שרון", role: "dubber", heading: "מדבבים", character: "סילבסטר החתול" },
      { name: "דור צויגנבום", role: "dubber", heading: "מדבבים", character: "טוויטי" },
      { name: "איילת לוין", role: "dubber", heading: "מדבבים", character: "עכבר" },
    ],
  },
  {
    id: "ht-tvm-vmvby",
    title: "תום ומובי מציגים",
    originalTitle: "BrainPOP",
    year: 2011,
    kind: "series_dubbed_foreign",
    summary: "תום ומובי מנחים סרטים בנושאים שונים",
    genres: ["אנימציה", "הרפתקאות", "חינוכי", "ילדים", "מדובב - זר"],
    channel: "חינוכית אינטרנט",
    runtimeMinutes: 10,
    ishimKeys: ["ישראלי מדובב לעברית"],
    ishimNotes: [{ heading: "מאחורי הקלעים", items: ["מורכב מסרטוני בריינפופ"] }],
    sourceUrl: page(
      "%D7%AA%D7%95%D7%9D-%D7%95%D7%9E%D7%95%D7%91%D7%99-%D7%9E%D7%A6%D7%99%D7%92%D7%99%D7%9D-2011-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "עומרי רונן", role: "dubber", heading: "מדבבים", character: "תום" },
    ],
  },
  {
    id: "ht-hchvh",
    title: "החווה",
    originalTitle: "The Ranch / Le Ranch",
    year: 2013,
    kind: "series_dubbed_foreign",
    summary: "ילדה שאוהבת סוסים, פוגשת בסוס פרא פצוע ומחליטה לאלף אותו, ולשמור עליו יחד עם חבריה",
    genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר"],
    channel: "ערוץ הילדים",
    runtimeMinutes: 23,
    episodeCount: 26,
    sourceUrl: page("%D7%94%D7%97%D7%95%D7%95%D7%94-2013-%D7%90%D7%99%D7%A9%D7%99%D7%9D"),
    credits: [
      { name: "אפי בן ישראל", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
      { name: "שחר קדוש", role: "dubber", heading: "מדבבים", character: "לינה" },
      { name: "ברק ברויטמן", role: "dubber", heading: "מדבבים", character: "הוגו" },
      { name: "עדן גמליאל", role: "dubber", heading: "מדבבים", character: "אנאיס" },
      { name: "עמית יוסוביץ'", role: "dubber", heading: "מדבבים", character: "אנג'לו" },
      { name: "מייה קדוש", role: "dubber", heading: "מדבבים", character: "סמנתה" },
      { name: "שקד פרסי", role: "dubber", heading: "מדבבים", character: "קיווין" },
      { name: "סער בדישי", role: "dubber", heading: "מדבבים", character: "מר סטיינר / דמויות שונות" },
      { name: "מאיה בר שלום", role: "dubber", heading: "מדבבים", character: "גברת סטיינר / דמויות שונות" },
      { name: "אפי בן ישראל", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
      { name: "צביקה פורמן", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
      { name: "דניאל מגון", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
      { name: "אפי בן ישראל", role: "singer", heading: "מוזיקה", character: "ביצוע שיר הפתיחה" },
    ],
  },
  {
    id: "ht-ayr-mlakhym",
    title: "עיר המלאכים",
    originalTitle: "Angel's Friends",
    year: 2010,
    endYear: 2013,
    kind: "series_dubbed_foreign",
    summary: "מלאכים ושטנים מתבגרים מנסים לשנות את ההחלטות של בני האדם ולכבן אותם לדרך הישרה או השגויה",
    genres: ["אנימציה", "מדובב - זר", "נוער"],
    channel: "ערוץ הילדים",
    runtimeMinutes: 20,
    episodeCount: 104,
    sourceUrl: page(
      "%D7%A2%D7%99%D7%A8-%D7%94%D7%9E%D7%9C%D7%90%D7%9B%D7%99%D7%9D-2010-2013-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "טל רזניק", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "אורלי קטן", role: "dub_director", heading: "בימוי דיבוב", year: 2010 },
      { name: "יעל אללוף", role: "producer", heading: "הפקת דיבוב" },
      { name: "ספיר דרמון", role: "dubber", heading: "מדבבים", character: "ראפ" },
      { name: "תום שוורצברג", role: "dubber", heading: "מדבבים", character: "סולפיס" },
      { name: "נעמה אוזן", role: "dubber", heading: "מדבבים", character: "אורי" },
      { name: "לורן סביר", role: "dubber", heading: "מדבבים", character: "מיקי / דמויות שונות" },
      { name: "אלעד סמוכה", role: "dubber", heading: "מדבבים", character: "מותק" },
      { name: "מיכל רשף", role: "dubber", heading: "מדבבים", character: "קבלה / סקארלט / דמויות שונות" },
      { name: "מייה קדוש", role: "dubber", heading: "מדבבים", character: "קבלה / קתרין / גלוריה / דמויות שונות", year: 2013 },
      { name: "טליה ברקאי", role: "dubber", heading: "מדבבים", character: "קביריה / אמא של שרה ג'יין / דמויות שונות" },
      { name: "מירון אהרונוביץ'", role: "dubber", heading: "מדבבים", character: "גאס" },
      { name: "צביקה שוורצברג", role: "dubber", heading: "מדבבים", character: "פרופסור ארקן / דמויות שונות" },
      { name: "רונה בקרמן", role: "dubber", heading: "מדבבים", character: "פרופסור טמפל / דמויות שונות" },
      { name: "דדי זהר", role: "dubber", heading: "מדבבים", character: "גייב / דמויות שונות", year: 2010 },
      { name: "עדי קוזלובסקי", role: "dubber", heading: "מדבבים", character: "לילי", year: 2010 },
      { name: "דניאל מגון", role: "dubber", heading: "מדבבים", character: "אנדרו", year: 2010 },
      { name: "דור סרוגו", role: "dubber", heading: "מדבבים", character: "ג'ייקוב / צ'ארלס / דניאל / מירקו / דמויות שונות" },
      { name: "מאי יעקובסון", role: "dubber", heading: "מדבבים", character: "ג'ניפר / שרה ג'יין / לילי ליו / דמויות שונות" },
      { name: "קובי ליקורמן", role: "dubber", heading: "מדבבים", character: "אדוארד / ולריוס / דמויות שונות", year: 2010 },
      { name: "אורלי תגר", role: "dubber", heading: "מדבבים", character: "ג'וליה", year: 2010 },
      { name: "רום מילשטיין", role: "dubber", heading: "מדבבים", character: "הלן", year: 2010 },
      { name: "לירי אור", role: "dubber", heading: "מדבבים", character: "מתיו / דמויות שונות", year: 2010 },
      { name: "יהונתן מגון", role: "dubber", heading: "מדבבים", character: "טייקו / מתיו / דמויות שונות", year: 2010 },
      { name: "ליאת הר לב", role: "dubber", heading: "מדבבים", character: "סאי", year: 2010 },
      { name: "אורלי קטן", role: "dubber", heading: "מדבבים", character: "ריינה / אנג'לי / קאסידי / אומניה / דמויות שונות" },
      { name: "יורם יוספסברג", role: "dubber", heading: "מדבבים", character: "מלאכי / דמויות שונות", year: 2010 },
      { name: "עמי מנדלמן", role: "dubber", heading: "מדבבים", character: "קולברל / דמויות שונות" },
      { name: "עדן גמליאל", role: "dubber", heading: "מדבבים", character: "בלו / גלוריה / אמי / דמויות שונות", year: 2013 },
      { name: "אורן בכר", role: "dubber", heading: "מדבבים", character: "מיילו", year: 2013 },
      { name: "ברק ברויטמן", role: "dubber", heading: "מדבבים", character: "מיילו", year: 2013 },
      { name: "אורנה כץ", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2010 },
      { name: "לורה למבז", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2010 },
      { name: "עפרון אטקין", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2010 },
      { name: "גדי לוי", role: "dubber", heading: "מדבבים", character: "טרנס / אבא של דניאל / ויליאם / דמויות שונות", year: 2013 },
      { name: "דן שצברג", role: "dubber", heading: "מדבבים", character: "אלכסנדר / גנוסיס / דמויות שונות", year: 2013 },
      { name: "עדנה סולודקי", role: "dubber", heading: "מדבבים אורחים", character: "אמא של אנדרו (פרק 1)", year: 2010 },
    ],
  },
  {
    id: "ht-akhvr-ayr",
    title: "עכבר העיר ועכבר הכפר",
    originalTitle: "The Country Mouse and the City Mouse Adventures",
    year: 1998,
    endYear: 1999,
    kind: "series_dubbed_foreign",
    summary: "הרפתקאותיהם של אמילי ואלכסנדר המטיילים מסביב לעולם, פוגשים חברים ופותרים תעלומות",
    genres: ["אנימציה", "ילדים", "מדובב - זר"],
    channel: "ערוץ הילדים",
    runtimeMinutes: 23,
    episodeCount: 52,
    sourceUrl: page(
      "%D7%A2%D7%9B%D7%91%D7%A8-%D7%94%D7%A2%D7%99%D7%A8-%D7%95%D7%A2%D7%9B%D7%91%D7%A8-%D7%94%D7%9B%D7%A4%D7%A8-1998-1999-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "קובי אשל", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "קובי אשל", role: "producer", heading: "הפקת דיבוב" },
      { name: "אור אזולאי", role: "dubber", heading: "מדבבים", character: "אמילי / דמויות שונות" },
      { name: "גיורא קנת", role: "dubber", heading: "מדבבים", character: "אלכסנדר / דמויות שונות" },
      { name: "אלי לולאי", role: "dubber", heading: "מדבבים", character: "אומברט שומכלומברט / דמויות שונות" },
      { name: "דבי בסרגליק", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
      { name: "דור צויגנבום", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
      { name: "מיכל צפיר", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
      { name: "קובי אשל", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
      { name: "יהויכין פרידלנדר", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 1999 },
      { name: "שי חורש", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 1999 },
      { name: "אור אזולאי", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
      { name: "גיורא קנת", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
    ],
  },
  {
    id: "ht-chvrym-bchvh",
    title: "חברים בחווה",
    originalTitle: "Back at the Barnyard",
    year: 2009,
    endYear: 2010,
    kind: "series_dubbed_foreign",
    summary: "החיות שגרות בחווה עוברות הרפתקאות שונות ומשונות ובעיקר מצחיקות",
    genres: ["אנימציה", "ילדים", "מדובב - זר", "נוער", "קומדיה"],
    channel: "ניקולודיאון",
    runtimeMinutes: 24,
    episodeCount: 52,
    ishimNotes: [
      { heading: "כללי", items: ["סדרת המשך של בלאגן בחווה"] },
      {
        heading: "ציטוטים",
        items: [
          "\"תחלבו אותי!\" - אוטיס, תסכול חוזר",
          "\"חלב משומר!\" - אוטיס, שהוא רואה צרה",
        ],
      },
    ],
    sourceUrl: page(
      "%D7%97%D7%91%D7%A8%D7%99%D7%9D-%D7%91%D7%97%D7%95%D7%95%D7%94-2009-2010-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "עפרון אטקין", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "מיכל בשירי", role: "producer", heading: "הפקת דיבוב", year: 2009 },
      { name: "יעל אללוף", role: "producer", heading: "הפקת דיבוב", year: 2010 },
      { name: "דניאל מגון", role: "dubber", heading: "מדבבים", character: "אוטיס" },
      { name: "נועה קשפיצקי", role: "dubber", heading: "מדבבים", character: "אבי" },
      { name: "עפרון אטקין", role: "dubber", heading: "מדבבים", character: "פיפ / האיכר / דמויות שונות" },
      { name: "נורית בנאי קורן", role: "dubber", heading: "מדבבים", character: "בסי / דמויות שונות" },
      { name: "יהונתן מגון", role: "dubber", heading: "מדבבים", character: "פרדי" },
      { name: "זיו מאיר", role: "dubber", heading: "מדבבים", character: "פק / תאום הפיצה2# / דמויות שונות" },
      { name: "אסף אבידן", role: "dubber", heading: "מדבבים", character: "פק / תאום הפיצה2# / דמויות שונות", year: 2009 },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "חזיר / דמויות שונות" },
      { name: "דדי זהר", role: "dubber", heading: "מדבבים", character: "דוכס / דמויות שונות" },
      { name: "דור סרוגו", role: "dubber", heading: "מדבבים", character: "יוג'ין / בויל / תאום הפיצה1# / דמויות שונות" },
      { name: "אורלי קטן", role: "dubber", heading: "מדבבים", character: "גברת בידי / דמויות שונות" },
      { name: "עמי מנדלמן", role: "dubber", heading: "מדבבים", character: "נתן בידי / אוורט / ביגפוט / דמויות שונות" },
      { name: "גדי לוי", role: "dubber", heading: "מדבבים", character: "הילי ביופורד / דמויות שונות" },
      { name: "טליה ברקאי", role: "dubber", heading: "מדבבים", character: "מייסי / ג'סיקה אולספייס / דמויות שונות" },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "קריין / בקסטר / דמויות שונות" },
      { name: "יורם יוספסברג", role: "dubber", heading: "מדבבים", character: "תייש / סנטה קלאוס (פרק 45) / דמויות שונות", year: 2010 },
      { name: "איטן גרינברג", role: "dubber", heading: "מדבבים אורחים", character: "חבר של יוג'ין", year: 2009 },
      { name: "אלעד סמוכה", role: "dubber", heading: "מדבבים אורחים", character: "סטמפ / דמויות שונות", year: 2010 },
      { name: "אמנון וולף", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2010 },
      { name: "בניהו שיר", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2010 },
      { name: "גיא קשפיצקי", role: "dubber", heading: "מדבבים אורחים", character: "חבר של יוג'ין", year: 2010 },
      { name: "חנן רוזן", role: "dubber", heading: "מדבבים אורחים", character: "שדון אירי", year: 2010 },
      { name: "מיכה אוזין סליאן", role: "dubber", heading: "מדבבים אורחים", character: "רוט / בירגרד", year: 2009 },
      { name: "מירון אהרונוביץ'", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות" },
      { name: "נועם טל", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2010 },
      { name: "נעמה אוזן", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2010 },
      { name: "צביקה שוורצברג", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות" },
      { name: "עדי רז", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2009 },
      { name: "רונה בקרמן", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות" },
      { name: "קובי ליקורמן", role: "dubber", heading: "מדבבים אורחים", character: "חבר של יוג'ין", year: 2009 },
      { name: "שירלי לילו", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2009 },
      { name: "תובל שפיר", role: "dubber", heading: "מדבבים אורחים", character: "חבר של יוג'ין", year: 2009 },
      { name: "תום שוורצברג", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות" },
      { name: "דדי זהר", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
      { name: "לירון לב", role: "singer", heading: "מוזיקה", character: "שירה" },
      { name: "נועה קשפיצקי", role: "singer", heading: "מוזיקה", character: "שירה" },
    ],
  },
  {
    id: "ht-chvrym-lvly",
    title: "חברים בחווה (לולי)",
    year: 2008,
    kind: "series_dubbed_foreign",
    summary: "חזירונת תייש חמור וגם כלבלב עוברים הרפתקאות בחווה",
    genres: ["הרפתקאות", "חינוכי", "ילדים", "מדובב - זר"],
    runtimeMinutes: 10,
    sourceUrl: page(
      "%D7%97%D7%91%D7%A8%D7%99%D7%9D-%D7%91%D7%97%D7%95%D7%95%D7%94-%D7%9C%D7%95%D7%9C%D7%99-2008-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "אורלי קטן", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
      { name: "אשר סיוון", role: "dubber", heading: "מדבבים", character: "קריינות" },
      { name: "מיכל רשף", role: "dubber", heading: "מדבבים", character: "פה" },
      { name: "עידו דנקנר", role: "dubber", heading: "מדבבים", character: "חפרני" },
      { name: "דורון בן עמי", role: "dubber", heading: "מדבבים", character: "גדי" },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "חמי" },
      { name: "צביקה פורמן", role: "dubber", heading: "מדבבים", character: "קירקורי" },
      { name: "גדי לוי", role: "dubber", heading: "מדבבים", character: "עוזי" },
      { name: "גיורא קנת", role: "dubber", heading: "מדבבים", character: "ספי" },
      { name: "עדי רז", role: "dubber", heading: "מדבבים", character: "איכר" },
      { name: "נורית בנאי קורן", role: "dubber", heading: "מדבבים", character: "חיות שונות" },
      { name: "אורלי קטן", role: "dubber", heading: "מדבבים", character: "חיות שונות" },
      { name: "לירון לב", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
      { name: "מיכל רשף", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
    ],
  },
  {
    id: "ht-byt-spr-pyrtym",
    title: "בית ספר לפיראטים",
    originalTitle: "Monsters and pirates",
    year: 2012,
    kind: "series_dubbed_foreign",
    summary:
      "בכל פרק, יוצאות קבוצות פיראטים צעירים למשימות חיפוש שונים אחר אוצרות שונים, וגם נלחמים זה בזה על האוצר",
    genres: ["אנימציה", "הרפתקאות", "מדובב - זר", "נוער", "פעולה", "קומדיה"],
    channel: "ערוץ הילדים",
    runtimeMinutes: 23,
    episodeCount: 13,
    sourceUrl: page(
      "%D7%91%D7%99%D7%AA-%D7%A1%D7%A4%D7%A8-%D7%9C%D7%A4%D7%99%D7%A8%D7%90%D7%98%D7%99%D7%9D-2012-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "אלי לולאי", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
      { name: "דור סרוגו", role: "dubber", heading: "מדבבים", character: "פלין" },
      { name: "אריאל שמיר", role: "dubber", heading: "מדבבים", character: "אליסי" },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "צ'יל / דמויות שונות" },
      { name: "שרון שחל", role: "dubber", heading: "מדבבים", character: "ג'יפסי / לילי" },
      { name: "אביתר אדיר", role: "dubber", heading: "מדבבים", character: "תומס / דמויות שונות" },
      { name: "ליהי לאופר", role: "dubber", heading: "מדבבים", character: "דוני / לובה / לולו" },
      { name: "אלי לולאי", role: "dubber", heading: "מדבבים", character: "פאבלו / הוריקן ג'ו / דמויות שונות" },
      { name: "סער בדישי", role: "dubber", heading: "מדבבים", character: "זוריון / רימו / מלך בולה בולה / דמויות שונות" },
      { name: "צביקה שוורצברג", role: "dubber", heading: "מדבבים", character: "אספדון / טריטון הזקן" },
      { name: "יובל סגל", role: "dubber", heading: "מדבבים", character: "פרופסור מונטגו / סיימון קווילט / רולפו / גרוק / מיסטר רב חובל / דמויות שונות" },
      { name: "אורלי קטן", role: "dubber", heading: "מדבבים", character: "פלור / מירה / מלכת הים / סבתא של לילי" },
      { name: "ספיר דרמון", role: "singer", heading: "מוזיקה", character: "ביצוע שיר הפתיחה" },
      { name: "אלי לולאי", role: "singer", heading: "מוזיקה", character: "ליווי וניהול מוזיקלי לשיר הפתיחה" },
    ],
  },
  {
    id: "ht-skank-pv",
    title: "סקאנק פו!",
    originalTitle: "Skunk Fu!",
    year: 2010,
    kind: "series_dubbed_foreign",
    summary:
      "בואש צעיר מתאמן אצל פנדה זקן, ונלחם בעזרת חבריו החיות בכוחות הרשע של הדרקון, הבבון וקופי הנינג'ה",
    genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר", "פעולה", "קומדיה"],
    channel: "ערוץ הילדים",
    runtimeMinutes: 10,
    episodeCount: 52,
    sourceUrl: page("%D7%A1%D7%A7%D7%90%D7%A0%D7%A7-%D7%A4%D7%95-2010-%D7%90%D7%99%D7%A9%D7%99%D7%9D"),
    credits: [
      { name: "אורלי קטן", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
      { name: "נועם טל", role: "dubber", heading: "מדבבים", character: "סקאנק" },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "ארנב" },
      { name: "שרון שחל", role: "dubber", heading: "מדבבים", character: "שועלה" },
      { name: "מיכה אוזין סליאן", role: "dubber", heading: "מדבבים", character: "מאסטר פנדה" },
      { name: "עפרון אטקין", role: "dubber", heading: "מדבבים", character: "ד\"ר צב" },
      { name: "אורלי קטן", role: "dubber", heading: "מדבבים", character: "גברת ברווזה" },
      { name: "נורית בנאי קורן", role: "dubber", heading: "מדבבים", character: "עגורה" },
      { name: "אורי אומנותי", role: "dubber", heading: "מדבבים", character: "ציפור" },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "טיגריס / צפרדע" },
      { name: "דור צויגנבום", role: "dubber", heading: "מדבבים", character: "חזיר" },
      { name: "שמחה ברבירו", role: "dubber", heading: "מדבבים", character: "נחש / שור" },
      { name: "יורם יוספסברג", role: "dubber", heading: "מדבבים", character: "דרקון / דג / גמל שלמה" },
      { name: "עמי מנדלמן", role: "dubber", heading: "מדבבים", character: "בבון" },
      { name: "ג'ינו קמבוס", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
    ],
  },
  {
    id: "ht-alprd",
    title: "אלפרד חקירות",
    originalTitle: "The Mysteries of Alfred Hedgehog",
    year: 2010,
    kind: "series_dubbed_foreign",
    summary:
      "הבלש הצעיר אלפרד הקיפוד וחבריו חוקרים היעלמויות מוזרות, תופעות טבע משונות והתנהגויות מסקרנות של בעלי חיים",
    genres: ["אנימציה", "ילדים", "מדובב - זר"],
    channel: "לוגי",
    runtimeMinutes: 11,
    episodeCount: 52,
    sourceUrl: page(
      "%D7%90%D7%9C%D7%A4%D7%A8%D7%93-%D7%97%D7%A7%D7%99%D7%A8%D7%95%D7%AA-2010-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "אורלי קטן", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
      { name: "יהונתן מגון", role: "dubber", heading: "מדבבים", character: "אלפרד" },
      { name: "מורן שכניק", role: "dubber", heading: "מדבבים", character: "קמיל" },
      { name: "תומר פרי", role: "dubber", heading: "מדבבים", character: "מיילו" },
      { name: "מאי יעקובסון", role: "dubber", heading: "מדבבים", character: "לילי / תלמידה" },
      { name: "אתי קסטרו", role: "dubber", heading: "מדבבים", character: "קלואי / גבי / אמא של אוקלי" },
      { name: "מיכה אוזין סליאן", role: "dubber", heading: "מדבבים", character: "וינסטון / המנהל / לוגובריוס" },
      { name: "ניר רון", role: "dubber", heading: "מדבבים", character: "ויקטור / המומחה לעצים / ברני" },
      { name: "אמנון וולף", role: "dubber", heading: "מדבבים", character: "לומוס / אבא של אלפרד / מר רמי / המפקח" },
      { name: "עמית יוסוביץ'", role: "dubber", heading: "מדבבים", character: "אדגר" },
      { name: "נועה קשפיצקי", role: "dubber", heading: "מדבבים", character: "סינתיה" },
      { name: "יפה תוסיה כהן", role: "dubber", heading: "מדבבים", character: "אמא של סינתיה / ד\"ר אנה" },
      { name: "אורלי קטן", role: "dubber", heading: "מדבבים", character: "פולי / אמא של אלפרד / קלרה / מיני" },
      { name: "אלי לולאי", role: "dubber", heading: "מדבבים", character: "מר רוזרד / גריז" },
      { name: "טליה ברקאי", role: "dubber", heading: "מדבבים", character: "לואיז / גברת ראדלי" },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "ריקרדו / ראזי / תלמיד" },
      { name: "שמחה ברבירו", role: "dubber", heading: "מדבבים", character: "אוקלי / וודי / ויטרס / המנהל (זמני)" },
      { name: "יובל סגל", role: "dubber", heading: "מדבבים", character: "הלמוט" },
      { name: "אביתר אדיר", role: "dubber", heading: "מדבבים", character: "ג'יי ג'יי" },
      { name: "שירה נאור", role: "dubber", heading: "מדבבים", character: "טינה / תלמידה" },
      { name: "איטן גרינברג", role: "dubber", heading: "מדבבים", character: "תלמיד" },
      { name: "מירון אהרונוביץ'", role: "dubber", heading: "מדבבים אורחים", character: "טום" },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים אורחים", character: "מר רמי (זמני)" },
      { name: "אלי לולאי", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
    ],
  },
  {
    id: "ht-gvrmyty",
    title: "גורמיטי",
    year: 2010,
    endYear: 2011,
    kind: "series_dubbed_foreign",
    summary:
      "ארבעה ילדים רגילים נבחרים להיות אדוני הטבע המגינים על עולם הגורמיטי ועולמם האמיתי מפני גורמיטי האש המרושעים",
    genres: ["אנימציה", "ילדים", "מדובב - זר", "מדע בדיוני", "נוער", "פנטזיה", "פעולה", "קומדיה"],
    channel: "ערוץ הילדים",
    runtimeMinutes: 24,
    episodeCount: 65,
    ishimNotes: [
      {
        heading: "ציטוטים",
        items: [
          "כל כוחות הטבע זרמו גורמיטי אדוני הטבע קדימה צאו",
          "גלו מי הוא השומר ותתנו לו את כיסר ההשגחה",
          "הביטו בכוח של האור - לומינוס",
          "חוזק היער -לוקאס בשינוי צורה",
          "עוצמתה של האבן-ניק בשינוי צורה",
          "כוחו של הים-טובי בשינוי צורה",
          "ריבונות הרוח -ג'סיקה בשינוי צורה",
        ],
      },
    ],
    sourceUrl: page("%D7%92%D7%95%D7%A8%D7%9E%D7%99%D7%98%D7%99-2010-2011-%D7%90%D7%99%D7%A9%D7%99%D7%9D"),
    credits: [
      { name: "אורלי קטן", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "טובי / דמויות שונות" },
      { name: "אורי אומנותי", role: "dubber", heading: "מדבבים", character: "ניק" },
      { name: "מירב דמארי", role: "dubber", heading: "מדבבים", character: "ג'סיקה", year: 2010, endYear: 2011 },
      { name: "הדר שחף-מעיין", role: "dubber", heading: "מדבבים", character: "ג'סיקה", year: 2011 },
      { name: "דניאל מגון", role: "dubber", heading: "מדבבים", character: "לוקאס" },
      { name: "צביקה שוורצברג", role: "dubber", heading: "מדבבים", character: "ראזל / טנטקליון / דמויות שונות" },
      { name: "עפרון אטקין", role: "dubber", heading: "מדבבים", character: "מר טריפ (עונות 1 ו2) / בומבוס (חזה ימין) / פטיש בוער / לוקסליון / דמויות שונות" },
      { name: "רונה בקרמן", role: "dubber", heading: "מדבבים", character: "גברת טריפ (עונות 1 ו2) / דמויות שונות" },
      { name: "דור סרוגו", role: "dubber", heading: "מדבבים", character: "אייק פינקני / דמויות שונות" },
      { name: "מיכל רשף", role: "dubber", heading: "מדבבים", character: "פולה פינקני / דמויות שונות" },
      { name: "מאי יעקובסון", role: "dubber", heading: "מדבבים", character: "ג'ינה / ילד בגן משחקים", year: 2010 },
      { name: "תום שוורצברג", role: "dubber", heading: "מדבבים", character: "לומינוס" },
      { name: "אלי לולאי", role: "dubber", heading: "מדבבים", character: "חכם זקן / מפאסטור / דמויות שונות", year: 2011 },
      { name: "לירון ברנס", role: "dubber", heading: "מדבבים", character: "מגמיון / סיריוס / דמויות שונות" },
      { name: "שמחה ברבירו", role: "dubber", heading: "מדבבים", character: "לאביון / שוט קטלני / ברץ / ציקלופ (עונה 2) / דמויות שונות" },
      { name: "ניר רון", role: "dubber", heading: "מדבבים", character: "בומבוס / קווארי / מולוק / טרונקליון / דמויות שונות" },
      { name: "מיכה אוזין סליאן", role: "dubber", heading: "מדבבים", character: "לאוור (עונה 1) / אובסקיוריו / גזע תותח / דמויות שונות" },
      { name: "יובל גרבש", role: "dubber", heading: "מדבבים", character: "לאוור (עונה 2) / כוכב ים / דמויות שונות", year: 2011 },
      { name: "גיא רושיניאק", role: "dubber", heading: "מדבבים", character: "מאגור", year: 2011 },
      { name: "אמנון וולף", role: "dubber", heading: "מדבבים", character: "אורורה / בומבוס (חזה שמאל) / גורגס / דמויות שונות" },
      { name: "עמי מנדלמן", role: "dubber", heading: "מדבבים", character: "מר טריפ (עונה 3) / לוכד המחשבות / וויקד / רוסקליון / דמויות שונות" },
      { name: "אורלי קטן", role: "dubber", heading: "מדבבים", character: "גברת טריפ (עונה 3) / כתבת חדשות / דמויות שונות" },
      { name: "יורם יוספסברג", role: "dubber", heading: "מדבבים", character: "בולרוק / ארמגדון / ציקלופ (עונה 1) / דמויות שונות" },
      { name: "יואב בר לב", role: "dubber", heading: "מדבבים", character: "בולבור / דמויות שונות", year: 2011 },
      { name: "גדי לוי", role: "dubber", heading: "מדבבים", character: "פניסון / להב אש / דמויות שונות", year: 2011 },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "ממלטור / דמויות שונות", year: 2011 },
      { name: "נורית בנאי קורן", role: "dubber", heading: "מדבבים", character: "גברת גולינדה", year: 2011 },
      { name: "דור צויגנבום", role: "dubber", heading: "מדבבים אורחים", character: "מדריך טיולים", year: 2011 },
      { name: "יהונתן מגון", role: "dubber", heading: "מדבבים אורחים", character: "רוכב אופניים", year: 2011 },
      { name: "איטן גרינברג", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2011 },
      { name: "דדי זהר", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2011 },
    ],
  },
  {
    id: "ht-myky-maus",
    title: "מיקי מאוס",
    originalTitle: "Mickey Mouse",
    year: 2013,
    endYear: 2019,
    kind: "series_dubbed_foreign",
    summary: "הרפתקאותיו החדשות של העכבר המפורסם של דיסני - מיקי מאוס וחבריו בדומה לסרטים הראשונים בשחור לבן",
    genres: ["אנימציה", "הרפתקאות", "מדובב - זר", "קומדיה"],
    channel: "ערוץ דיסני",
    runtimeMinutes: 3,
    ishimNotes: [{ heading: "קישורים", items: ["ראה גם קטעים עם מיקי והחבר'ה"] }],
    sourceUrl: page(
      "%D7%9E%D7%99%D7%A7%D7%99-%D7%9E%D7%90%D7%95%D7%A1-2013-2019-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "אפרת ענבל", role: "dub_director", heading: "בימוי דיבוב", year: 2013, endYear: 2017 },
      { name: "תומר שביט", role: "dub_director", heading: "בימוי דיבוב", year: 2013, endYear: 2014 },
      { name: "שרון כהן", role: "dub_director", heading: "בימוי דיבוב", year: 2014, endYear: 2016 },
      { name: "תמי ברק", role: "dub_director", heading: "בימוי דיבוב", year: 2018, endYear: 2019 },
      { name: "הדס מוזס", role: "producer", heading: "הפקת דיבוב", year: 2013, endYear: 2015 },
      { name: "גלי נשר", role: "producer", heading: "הפקת דיבוב", year: 2016 },
      { name: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "מיקי מאוס / דמויות שונות" },
      { name: "נועה גורן", role: "dubber", heading: "מדבבים", character: "מיני מאוס / דמויות שונות", year: 2013, endYear: 2016 },
      { name: "עינת אזולאי", role: "dubber", heading: "מדבבים", character: "מיני מאוס", year: 2017, endYear: 2019 },
      { name: "ניר נדיר", role: "dubber", heading: "מדבבים", character: "דונלד דאק / דמויות שונות" },
      { name: "הדר שחף-מעיין", role: "dubber", heading: "מדבבים", character: "דייזי דאק / קלרה-בל / דמויות שונות" },
      { name: "יורם יוספסברג", role: "dubber", heading: "מדבבים", character: "גופי (פרק 1) / דמויות שונות", year: 2013, endYear: 2015 },
      { name: "עמי מנדלמן", role: "dubber", heading: "מדבבים", character: "גופי / דמויות שונות" },
      { name: "מיכה אוזין סליאן", role: "dubber", heading: "מדבבים", character: "פיט / דמויות שונות", year: 2014, endYear: 2016 },
      { name: "ערן מור", role: "dubber", heading: "מדבבים", character: "פיט / סקרוג' מקדאק / דמויות שונות", year: 2018, endYear: 2019 },
      { name: "שמחה ברבירו", role: "dubber", heading: "מדבבים", character: "לודוויג פון דרייק / סקרוג' מקדאק / דמויות שונות", year: 2016 },
      { name: "גדי לוי", role: "dubber", heading: "מדבבים", character: "לודוויג פון דרייק / דמויות שונות", year: 2018, endYear: 2019 },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "מורטימר מאוס / דמויות שונות", year: 2016, endYear: 2018 },
      { name: "רובי מוסקוביץ", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2013 },
      { name: "יואב כהן", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2014 },
      { name: "תמי ברק", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2014, endYear: 2017 },
      { name: "שירלי לילו", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2014 },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2014 },
      { name: "גיא רייפמן", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2016 },
      { name: "יובל ינאי", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2014 },
      { name: "שרון כהן", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2015, endYear: 2016 },
      { name: "אפרת ענבל", role: "singer", heading: "מוזיקה", character: "ניהול מוזיקלי", year: 2013 },
    ],
  },
  {
    id: "ht-tak-jvjv",
    title: "טאק וכוח הג'וג'ו",
    originalTitle: "Tak and the Power of Juju",
    year: 2008,
    endYear: 2009,
    kind: "series_dubbed_foreign",
    summary: "עלילתיו של טאק, שאמן צעיר בעל כוחות שמגן על השבט פופונונו מפני אירועים מוזרים ושונים",
    genres: ["אנימציה", "ילדים", "מדובב - זר", "פנטזיה", "קומדיה"],
    channel: "ניקולודיאון",
    runtimeMinutes: 21,
    episodeCount: 26,
    sourceUrl: page(
      "%D7%98%D7%90%D7%A7-%D7%95%D7%9B%D7%95%D7%97-%D7%94%D7%92%D7%95%D7%92%D7%95-2008-2009-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "נינה אמיר", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "יונית עוזרי מנחם", role: "producer", heading: "הפקת דיבוב", year: 2009 },
      { name: "מיכל בשירי", role: "producer", heading: "הפקת דיבוב", year: 2008 },
      { name: "אסף אבידן", role: "dubber", heading: "מדבבים", character: "טאק", year: 2008 },
      { name: "דורון בן עמי", role: "dubber", heading: "מדבבים", character: "טאק", year: 2009 },
      { name: "שירה נאור", role: "dubber", heading: "מדבבים", character: "ג'ירה" },
      { name: "מיכאל עינב", role: "dubber", heading: "מדבבים", character: "קיקו / חושכי-ג'וג'ו / מאמן-ג'וג'ו / זוגסנוב / דמויות שונות" },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "הצ'יף / מואי אבן / עכביש-ג'וג'ו / דמויות שונות" },
      { name: "שמחה ברבירו", role: "dubber", heading: "מדבבים", character: "ג'יבולבה / מסיבה-ג'וג'ו / דמויות שונות" },
      { name: "אייל נחמיאס", role: "dubber", heading: "מדבבים", character: "לוק" },
      { name: "אתי קסטרו", role: "dubber", heading: "מדבבים", character: "זאריה / דוריס / באסה-ג'וג'ו / דמויות שונות" },
      { name: "אורנה כץ", role: "dubber", heading: "מדבבים", character: "סלוג / דמויות שונות" },
      { name: "שי זורניצר", role: "dubber", heading: "מדבבים", character: "נזיר עץ / ג'וג'ו-מכשף / מגעיל-ג'וג'ו / דמויות שונות" },
      { name: "יובל סגל", role: "dubber", heading: "מדבבים", character: "בלוד / לוחמני-ג'וג'ו / הנרי / דמויות שונות", year: 2008 },
      { name: "דניאל מגון", role: "dubber", heading: "מדבבים", character: "בלוד", year: 2009 },
      { name: "עדי קוזלובסקי", role: "dubber", heading: "מדבבים", character: "בליטה / דוריס / שלי-ג'וג'ו / דמויות שונות", year: 2009 },
      { name: "ענת ארליך", role: "dubber", heading: "מדבבים", character: "בליטה", year: 2008 },
      { name: "הדר שחף-מעיין", role: "dubber", heading: "מדבבים", character: "שופטת-ג'וג'ו / גילברט / לב ג'וג'ו / דמויות שונות" },
      { name: "נינה אמיר", role: "dubber", heading: "מדבבים אורחים", character: "טינה-טינה", year: 2008 },
      { name: "עפרון אטקין", role: "dubber", heading: "מדבבים אורחים", character: "לוחמני-ג'וג'ו / פוביה-ג'וג'ו", year: 2009 },
      { name: "אסף אבידן", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
    ],
  },
  {
    id: "ht-mrtyn-al-hbvkr",
    title: "מרטין על הבוקר",
    year: 2007,
    endYear: 2008,
    kind: "series_dubbed_foreign",
    summary: "בכל בוקר מרטין הילד מתעורר ומוצא את עצמו כמישהו אחר",
    genres: ["אנימציה", "ילדים", "מדובב - זר", "פנטזיה", "קומדיה"],
    channel: "ערוץ הילדים",
    runtimeMinutes: 10,
    episodeCount: 104,
    ishimKeys: ["בית ספר", "חילופי זהויות"],
    sourceUrl: page(
      "%D7%9E%D7%A8%D7%98%D7%99%D7%9F-%D7%A2%D7%9C-%D7%94%D7%91%D7%95%D7%A7%D7%A8-2007-2008-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "עפרון אטקין", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "מיכל בשירי", role: "producer", heading: "הפקת דיבוב" },
      { name: "גיא קשפיצקי", role: "dubber", heading: "מדבבים", character: "מרטין מורנינג" },
      { name: "תומר פרי", role: "dubber", heading: "מדבבים", character: "גרומו" },
      { name: "נעמה אוזן", role: "dubber", heading: "מדבבים", character: "רוקסן" },
      { name: "יונית ישעיהו", role: "dubber", heading: "מדבבים", character: "אלכסנדרה" },
      { name: "יפעת זנדני צפריר", role: "dubber", heading: "מדבבים", character: "גברת בזבי / דמויות שונות" },
      { name: "אבי חדש", role: "dubber", heading: "מדבבים", character: "מר פיקל / דמויות שונות" },
      { name: "גיורא קנת", role: "dubber", heading: "מדבבים", character: "מר פיקל / דמויות שונות", year: 2007 },
      { name: "עפרון אטקין", role: "dubber", heading: "מדבבים", character: "מר גרינסל / דמויות שונות" },
      { name: "אורלי קטן", role: "dubber", heading: "מדבבים אורחים", character: "גברת ויניגר / דמויות שונות" },
      { name: "טליה ברקאי", role: "dubber", heading: "מדבבים אורחים", character: "אמא / דמויות שונות" },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות" },
      { name: "יורם יוספסברג", role: "dubber", heading: "מדבבים אורחים", character: "אבא / דמויות שונות" },
      { name: "לירון ברנס", role: "dubber", heading: "מדבבים אורחים", character: "שגריר", year: 2007 },
      { name: "שמחה ברבירו", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2007 },
      { name: "אורנה כץ", role: "dubber", heading: "מדבבים אורחים", character: "ג'מאל", year: 2008 },
      { name: "איתי ג'רופי", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2007 },
      { name: "גדי לוי", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2008 },
      { name: "אמנון וולף", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2008 },
      { name: "דדי זהר", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות", year: 2008 },
      { name: "אלעד סמוכה", role: "dubber", heading: "מדבבים אורחים", character: "דמויות שונות" },
      { name: "בניהו שיר", role: "dubber", heading: "מדבבים אורחים", character: "רומיאו / דמויות שונות" },
      { name: "איתי ג'רופי", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
      { name: "טליה ברקאי", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
    ],
  },
  {
    id: "ht-nsykh-svpyh",
    title: "הנסיכה סופיה הראשונה",
    originalTitle: "Sofia the First",
    year: 2013,
    endYear: 2018,
    kind: "series_dubbed_foreign",
    summary: "אמא של סופיה התחתנה עם המלך רולנד, וכעת סופיה הקטנה צריכה להתרגל לחייה החדשים כנסיכה",
    genres: ["אנימציה", "ילדים", "מדובב - זר"],
    channel: "דיסני ג'וניור",
    runtimeMinutes: 23,
    ishimKeys: ["קסמים"],
    ishimNotes: [
      {
        heading: "כללי",
        items: [
          "ראה גם הנסיכה סופיה הראשונה - היה היתה נסיכה",
          "ראה גם הנסיכה סופיה הראשונה - הארמון הצף",
          "ראה גם הנסיכה סופיה הראשונה - קללת הנסיכה אייבי",
        ],
      },
    ],
    sourceUrl: page(
      "%D7%94%D7%A0%D7%A1%D7%99%D7%9B%D7%94-%D7%A1%D7%95%D7%A4%D7%99%D7%94-%D7%94%D7%A8%D7%90%D7%A9%D7%95%D7%A0%D7%94-2013-2018-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "תמי ברק", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "ליאור סול", role: "dub_director", heading: "בימוי דיבוב", year: 2017 },
      { name: "אסנת סדן", role: "producer", heading: "הפקת דיבוב", year: 2013, endYear: 2014 },
      { name: "גלי נשר", role: "producer", heading: "הפקת דיבוב", year: 2013, endYear: 2014 },
      { name: "מעיין שניידר-משה", role: "producer", heading: "הפקת דיבוב", year: 2014, endYear: 2017 },
      { name: "עדי וולוצקי", role: "producer", heading: "הפקת דיבוב", year: 2017, endYear: 2018 },
      { name: "מייה קדוש", role: "dubber", heading: "מדבבים", character: "סופיה" },
      { name: "משי קלינשטיין", role: "dubber", heading: "מדבבים", character: "סופיה", year: 2013 },
      { name: "לורן סביר", role: "dubber", heading: "מדבבים", character: "אמבר" },
      { name: "שקד פרסי", role: "dubber", heading: "מדבבים", character: "ג'יימס", year: 2013, endYear: 2014 },
      { name: "נדב ירושלמי", role: "dubber", heading: "מדבבים", character: "ג'יימס", year: 2014, endYear: 2018 },
      { name: "טליה ברקאי", role: "dubber", heading: "מדבבים", character: "מירנדה / מיה / הילדגרד / דמויות שונות" },
      { name: "מולי שולמן", role: "dubber", heading: "מדבבים", character: "רולנד / דמויות שונות" },
      { name: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "בייליוויק / מינימוס / וורמהוד / דמויות שונות" },
      { name: "הדר שחף-מעיין", role: "dubber", heading: "מדבבים", character: "פלורה / טיזי / קליאו / דמויות שונות" },
      { name: "עדי ארד", role: "dubber", heading: "מדבבים", character: "מריוותר / וור" },
      { name: "הילה מערבי", role: "dubber", heading: "מדבבים", character: "פאונה / דמויות שונות" },
      { name: "גילן שחף", role: "dubber", heading: "מדבבים", character: "קלובר / דמויות שונות" },
      { name: "כנרת לימוני", role: "dubber", heading: "מדבבים", character: "רובין / מיס נטל / לוסינדה / דמויות שונות" },
      { name: "עדן גמליאל", role: "dubber", heading: "מדבבים", character: "רובי / קרקל / ג'ון", year: 2013, endYear: 2016 },
      { name: "נויה דאון", role: "dubber", heading: "מדבבים", character: "רובי", year: 2018 },
      { name: "אלונה אלכסנדר", role: "dubber", heading: "מדבבים", character: "קרקל / קריסטה / דמויות שונות", year: 2017, endYear: 2018 },
      { name: "שחר קדוש", role: "dubber", heading: "מדבבים", character: "ג'ייד / ויויאן / מאיה / דמויות שונות" },
      { name: "דולב סלע", role: "dubber", heading: "מדבבים", character: "זנדר / דמויות שונות", year: 2013, endYear: 2015 },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "סדריק / דמויות שונות" },
      { name: "עמית רייס", role: "dubber", heading: "מדבבים", character: "סקיי", year: 2017, endYear: 2018 },
      { name: "עינת אזולאי", role: "dubber", heading: "מדבבים", character: "גאליאל", year: 2017, endYear: 2018 },
      { name: "אמנון וולף", role: "dubber", heading: "מדבבים", character: "גאריש / דמויות שונות", year: 2017, endYear: 2018 },
      { name: "גדי לוי", role: "dubber", heading: "מדבבים", character: "אוריון / דמויות שונות" },
      { name: "איילה פלדמן", role: "dubber", heading: "מדבבים", character: "אונה / דמויות שונות", year: 2013, endYear: 2016 },
      { name: "תמי ברק", role: "dubber", heading: "מדבבים", character: "וגה / דמויות שונות" },
      { name: "ערן מור", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2016, endYear: 2017 },
      { name: "גיא זיידמן", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2016 },
      { name: "סער בדישי", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2017, endYear: 2018 },
      { name: "נעמה שטרית", role: "dubber", heading: "מדבבים", character: "דמויות שונות", year: 2017, endYear: 2018 },
      { name: "איל כהן", role: "dubber", heading: "מדבבים אורחים", character: "אקסל", year: 2014 },
      { name: "בר סביר", role: "dubber", heading: "מדבבים אורחים", character: "לאני", year: 2014, endYear: 2016 },
      { name: "גיא רייפמן", role: "dubber", heading: "מדבבים אורחים", character: "פלוק", year: 2016 },
      { name: "אילנית גרשון", role: "dubber", heading: "מדבבים אורחים", character: "מרידה", year: 2016 },
      { name: "עידו רוזנברג", role: "dubber", heading: "מדבבים אורחים", character: "אולף", year: 2016 },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים אורחים", character: "עומאר", year: 2017 },
      { name: "יורם יוספסברג", role: "dubber", heading: "מדבבים אורחים", character: "קריין ספר", year: 2017 },
      { name: "אלברט כהן", role: "dubber", heading: "מדבבים אורחים", character: "שומר הסיפור הראשון", year: 2018 },
      { name: "משי קלינשטיין", role: "singer", heading: "מוזיקה", character: "ביצוע שיר פתיחה" },
      { name: "לירון לב", role: "singer", heading: "מוזיקה", character: "ג'יימס (שירה)" },
      { name: "תמי ברק", role: "singer", heading: "מוזיקה", character: "ניהול מוזיקלי" },
      { name: "ליאור סול", role: "singer", heading: "מוזיקה", character: "ניהול מוזיקלי", year: 2017 },
    ],
  },
  {
    id: "ht-sbrynh-svdvt",
    title: "סברינה: סודות של מכשפה בתיכון",
    originalTitle: "Sabrina: Secrets of a Teenage Witch",
    year: 2014,
    endYear: 2015,
    kind: "series_dubbed_foreign",
    summary: "מכשפה טירונית מנסה להתמודד עם השייכות שלה לשני העולמות בחיי היומיום",
    genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר", "מדע בדיוני", "פנטזיה", "קומדיה"],
    channel: "ערוץ דיסני",
    runtimeMinutes: 23,
    episodeCount: 26,
    ishimKeys: ["חתול", "קסמים"],
    sourceUrl: page(
      "%D7%A1%D7%91%D7%A8%D7%99%D7%A0%D7%94-%D7%A1%D7%95%D7%93%D7%95%D7%AA-%D7%A9%D7%9C-%D7%9E%D7%9B%D7%A9%D7%A4%D7%94-%D7%91%D7%AA%D7%99%D7%9B%D7%95%D7%9F-2014-2015-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "שפי מלק-בן יוסף", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "גלי נשר", role: "producer", heading: "הפקת דיבוב" },
      { name: "אלונה אלכסנדר", role: "dubber", heading: "מדבבים", character: "סברינה ספלמן" },
      { name: "חובי סקולץ", role: "dubber", heading: "מדבבים", character: "סיילם" },
      { name: "הדר שחף-מעיין", role: "dubber", heading: "מדבבים", character: "זלדה ספלמן / איימי / גברת טייטן / קוסמה" },
      { name: "שיר פרג", role: "dubber", heading: "מדבבים", character: "הילדה ספלמן / ג'סי / מקס" },
      { name: "עמית יוסוביץ'", role: "dubber", heading: "מדבבים", character: "הארווי" },
      { name: "מתי אטלס", role: "dubber", heading: "מדבבים", character: "ג'ים / לשגארג / דמויות שונות" },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "אמברוז / לשגארג / דמויות שונות" },
      { name: "משי קלינשטיין", role: "dubber", heading: "מדבבים", character: "ורה לופה / לונדה" },
      { name: "רונה בקרמן", role: "dubber", heading: "מדבבים", character: "אנצ'נטרה / זנדה / אמא טרולית / דמויות שונות" },
      { name: "סער בדישי", role: "dubber", heading: "מדבבים", character: "שינג'י / דמויות שונות" },
      { name: "יואב זיסקרוט", role: "dubber", heading: "מדבבים", character: "פרופסור גייץ / לשגארג / דמויות שונות" },
      { name: "אלונה אלכסנדר", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ביצוע)" },
      { name: "סער בדישי", role: "singer", heading: "מוזיקה", character: "שיר פתיחה (ליווי)" },
    ],
  },
  {
    id: "ht-kvkb-hmtmvn",
    title: "כוכב המטמון",
    originalTitle: "Treasure Planet",
    year: 2002,
    kind: "film_dubbed_foreign",
    summary:
      "הסיפור שמבוסס על «אי המטמון» מתרחש בחלל החיצון שנמצאים בו עולמות של חייזרים ופלאי גלקסיה נוספים",
    genres: ["אנימציה", "דרמה", "מדובב - זר", "נוער", "פנטזיה"],
    runtimeMinutes: 95,
    sourceUrl: page(
      "%D7%9B%D7%95%D7%9B%D7%91-%D7%94%D7%9E%D7%98%D7%9E%D7%95%D7%9F-2002-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "שפרירה זכאי", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "שפרירה זכאי", role: "producer", heading: "הפקת דיבוב" },
      { name: "עידו מוסרי", role: "dubber", heading: "מדבבים", character: "ג'ים הוקינס" },
      { name: "אלון ברנד", role: "dubber", heading: "מדבבים", character: "ג'ים הוקינס הצעיר" },
      { name: "אריאל פורמן", role: "dubber", heading: "מדבבים", character: "ג'ון סילבר" },
      { name: "ליליאן ברטו", role: "dubber", heading: "מדבבים", character: "קפטן אמיליה" },
      { name: "אוהד שחר", role: "dubber", heading: "מדבבים", character: "דוקטור דלברט דופלר" },
      { name: "תומר שרון", role: "dubber", heading: "מדבבים", character: "בן" },
      { name: "אורנה כץ", role: "dubber", heading: "מדבבים", character: "שרה" },
      { name: "אלי גורנשטיין", role: "dubber", heading: "מדבבים", character: "מיסטר ארו" },
      { name: "מיכה אוזין סליאן", role: "dubber", heading: "מדבבים", character: "סקרופ / קריין" },
      { name: "יורם יוספסברג", role: "dubber", heading: "מדבבים", character: "בילי בונס / פיראט" },
      { name: "אבי חדש", role: "dubber", heading: "מדבבים", character: "אונוס" },
      { name: "שפרירה זכאי", role: "dubber", heading: "מדבבים", character: "גברת דנהודי" },
      { name: "עומר ברנד", role: "dubber", heading: "מדבבים", character: "ילד צפרדע" },
      { name: "דור צויגנבום", role: "dubber", heading: "מדבבים", character: "שוטר רובוט 2" },
      { name: "שמעון כהן", role: "dubber", heading: "מדבבים", character: "שוטר רובוט 1 / פיראט" },
      { name: "שמוליק טנא", role: "dubber", heading: "מדבבים", character: "פיראט" },
      { name: "גיל זמק", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
      { name: "מיכל צפיר", role: "dubber", heading: "מדבבים", character: "קולות רקע" },
      { name: "שי זורניצר", role: "singer", heading: "מוזיקה", character: "שירה" },
    ],
  },
  {
    id: "ht-alnh-mavlvr",
    title: "אלנה מאוולור",
    originalTitle: "Elena of Avalor",
    year: 2016,
    endYear: 2021,
    kind: "series_dubbed_foreign",
    summary:
      "לאחר שהצילה את הממלכה מידי שאריקי, הנסיכה אלנה עוברת הרפתקאות, ולומדת שיעורים חשובים בתור יורשת הכתר של אוולור",
    genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר", "מוזיקלי"],
    channel: "ערוץ דיסני / דיסני ג'וניור",
    runtimeMinutes: 22,
    sourceUrl: page("%D7%90%D7%9C%D7%A0%D7%94-%D7%9E%D7%90%D7%95%D7%95%D7%9C%D7%95%D7%A8-2016-2021"),
    credits: [
      { name: "תמי ברק", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "מעיין שניידר-משה", role: "producer", heading: "הפקת דיבוב", year: 2016 },
      { name: "עדי וולוצקי", role: "producer", heading: "הפקת דיבוב", year: 2017, endYear: 2021 },
      { name: "משי קלינשטיין", role: "dubber", heading: "מדבבים", character: "אלנה" },
      { name: "אליענה מגון", role: "dubber", heading: "מדבבים", character: "איזבל" },
      { name: "עינת אזולאי", role: "dubber", heading: "מדבבים", character: "נעמי טרנר / קרלה" },
      { name: "יהונתן מגון", role: "dubber", heading: "מדבבים", character: "מתיאו" },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "גייב" },
      { name: "גולן גרוס", role: "dubber", heading: "מדבבים", character: "גייב", year: 2017, endYear: 2018 },
      { name: "ערן מור", role: "dubber", heading: "מדבבים", character: "סקיילר / איגינס / זופילוט / דמויות שונות" },
      { name: "רונה בקרמן", role: "dubber", heading: "מדבבים", character: "לונה / לואיזה / דונה פאלומה / ראפה / שוריקי / דמויות שונות" },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "מיגס / ויקטור / פילי" },
      { name: "אורי זלצמן", role: "dubber", heading: "מדבבים", character: "זוזו" },
      { name: "אלי לולאי", role: "dubber", heading: "מדבבים", character: "פרנסיסקו / פיירו / וראגו" },
      { name: "גדי לוי", role: "dubber", heading: "מדבבים", character: "אסטבן" },
      { name: "אמנון וולף", role: "dubber", heading: "מדבבים", character: "קפטן טרנר" },
      { name: "דן קיזלר", role: "dubber", heading: "מדבבים", character: "ארמנדו" },
      { name: "סער בדישי", role: "dubber", heading: "מדבבים", character: "חוליו / דמויות שונות" },
      { name: "מונה מור", role: "dubber", heading: "מדבבים", character: "כרמן / פרופסור מנדוזה", year: 2017, endYear: 2021 },
      { name: "ענת ניב", role: "dubber", heading: "מדבבים", character: "טורנדו / דוניה אנחליקה / דמויות שונות", year: 2017, endYear: 2021 },
      { name: "אלונה אלכסנדר", role: "dubber", heading: "מדבבים", character: "מריסה / פלו / דמויות שונות", year: 2017, endYear: 2021 },
      { name: "יובל קלו", role: "dubber", heading: "מדבבים", character: "רבקה", year: 2020, endYear: 2021 },
      { name: "מאיה מיטלפונקט", role: "dubber", heading: "מדבבים", character: "אש דלגאדו / קלואי", year: 2020, endYear: 2021 },
      { name: "שירלי לילו", role: "dubber", heading: "מדבבים", character: "צ'אטאנה", year: 2020, endYear: 2021 },
      { name: "ספיר דרמון", role: "dubber", heading: "מדבבים", year: 2020, endYear: 2021 },
      { name: "תומר שביט", role: "dubber", heading: "מדבבים", year: 2020, endYear: 2021 },
      { name: "ליאור חקון", role: "dubber", heading: "מדבבים אורחים", character: "יולו", year: 2021 },
      { name: "מייה קדוש", role: "dubber", heading: "מדבבים אורחים", character: "סופיה", year: 2021 },
      { name: "לורן סביר", role: "dubber", heading: "מדבבים אורחים", character: "אמבר", year: 2021 },
      { name: "משי קלינשטיין", role: "singer", heading: "מוזיקה", character: "ביצוע שיר הפתיחה" },
    ],
  },
  {
    id: "ht-alnh-svd-avlvr",
    title: "אלנה והסוד של אוולור",
    originalTitle: "Elena and the Secret of Avalor",
    year: 2017,
    kind: "film_dubbed_foreign",
    summary:
      "סופיה מגלה את עברו של התליון שלה, ויוצאת לאוולור לשחרר את הנסיכה אלנה, שתקועה בתוך התליון במשך 41 שנה",
    genres: ["אנימציה", "הרפתקאות", "חינוכי", "ילדים", "מדובב - זר", "מוזיקלי", "פנטזיה"],
    channel: "דיסני ג'וניור",
    runtimeMinutes: 60,
    sourceUrl: page(
      "%D7%90%D7%9C%D7%A0%D7%94-%D7%95%D7%94%D7%A1%D7%95%D7%93-%D7%A9%D7%9C-%D7%90%D7%95%D7%95%D7%9C%D7%95%D7%A8-2017-%D7%90%D7%99%D7%A9%D7%99%D7%9D"
    ),
    credits: [
      { name: "תמי ברק", role: "dub_director", heading: "בימוי דיבוב" },
      { name: "מעיין שניידר-משה", role: "producer", heading: "הפקת דיבוב" },
      { name: "מייה קדוש", role: "dubber", heading: "מדבבים", character: "סופיה" },
      { name: "משי קלינשטיין", role: "dubber", heading: "מדבבים", character: "אלנה" },
      { name: "רונה בקרמן", role: "dubber", heading: "מדבבים", character: "שאריקי / לונה / לואיזה" },
      { name: "טליה ברקאי", role: "dubber", heading: "מדבבים", character: "מירנדה" },
      { name: "מולי שולמן", role: "dubber", heading: "מדבבים", character: "רולנד" },
      { name: "לורן סביר", role: "dubber", heading: "מדבבים", character: "אמבר" },
      { name: "נדב ירושלמי", role: "dubber", heading: "מדבבים", character: "ג'יימס" },
      { name: "יהונתן מגון", role: "dubber", heading: "מדבבים", character: "מתיאו" },
      { name: "ערן מור", role: "dubber", heading: "מדבבים", character: "סקיילר" },
      { name: "גלעד קלטר", role: "dubber", heading: "מדבבים", character: "מיגס / דמויות שונות" },
      { name: "אורי זלצמן", role: "dubber", heading: "מדבבים", character: "זוזו" },
      { name: "אליענה מגון", role: "dubber", heading: "מדבבים", character: "איזבל" },
      { name: "אלי לולאי", role: "dubber", heading: "מדבבים", character: "פרנסיסקו / דמויות שונות" },
      { name: "דן קיזלר", role: "dubber", heading: "מדבבים", character: "ארמנדו" },
      { name: "גדי לוי", role: "dubber", heading: "מדבבים", character: "אסטבן / אלאקאזאר / דמויות שונות" },
      { name: "הדר שחף-מעיין", role: "dubber", heading: "מדבבים", character: "פלורה" },
      { name: "עינת אזולאי", role: "dubber", heading: "מדבבים", character: "נעמי טרנר" },
      { name: "תמי ברק", role: "dubber", heading: "מדבבים", character: "ראפה / דמויות שונות" },
      { name: "שחר קדוש", role: "dubber", heading: "מדבבים", character: "ילד" },
      { name: "דולב סלע", role: "dubber", heading: "מדבבים", character: "ילד" },
      { name: "לירון לב", role: "dubber", heading: "מדבבים", character: "דמויות שונות" },
      { name: "תמי ברק", role: "singer", heading: "מוזיקה", character: "ניהול מוזיקלי" },
    ],
  },
  {
    id: "ht-game-hatr-shl-alpy",
    title: "האתר של אלפי",
    year: 2004,
    kind: "website",
    summary: "אתר אינטרנט ישראלי",
    genres: ["אנימציה", "ילדים", "מדובב - זר", "פנטזיה"],
    channel: "אינטרנט",
    ishimKeys: ["ישראלי מדובב לעברית"],
    sourceUrl: page(
      "%D7%94%D7%90%D7%AA%D7%A8-%D7%A9%D7%9C-%D7%90%D7%9C%D7%A4%D7%99-2004-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91"
    ),
    credits: [
      { name: "שמחה ברבירו", role: "actor", heading: "שחקנים", character: "קול" },
    ],
  },
];

function normName(name: string): string {
  return canonicalPersonName(name)
    .trim()
    .replace(/[\u05BE\u2013\u2014\-־]+/g, " ")
    .replace(/['׳״"]/g, "")
    .replace(/\s+/g, " ");
}

function yearsOverlap(show: Show, production: Production): boolean {
  if (production.title !== show.title) return false;
  const showEnd = show.endYear ?? show.year;
  const prodEnd = production.endYear ?? production.year;
  return show.year <= prodEnd && production.year <= showEnd;
}

function productionRecord(show: Show, imageUrl?: string, createdAt?: string): Production {
  return {
    id: show.id,
    title: show.title,
    originalTitle: show.originalTitle,
    year: show.year,
    endYear: show.endYear,
    kind: show.kind,
    summary: show.summary,
    genres: show.genres,
    channel: show.channel,
    runtimeMinutes: show.runtimeMinutes,
    episodeCount: show.episodeCount,
    ishimKeys: show.ishimKeys,
    ishimNotes: show.ishimNotes,
    ishimClassic: true,
    imageUrl: imageUrl || portrait(show.title, show.originalTitle),
    sourceNote: SOURCE,
    sourceUrl: show.sourceUrl,
    createdAt: createdAt || NOW,
    updatedAt: NOW,
  };
}

function applyShow(data: ArchiveData, show: Show): ArchiveData {
  const people = [...data.people];
  const byNorm = new Map(people.map((person) => [normName(person.name), person]));

  const names = [...new Set(show.credits.map((row) => row.name))];
  for (const name of names) {
    if (byNorm.has(normName(name))) continue;
    let id = `ht-${slugify(name)}`;
    if (people.some((person) => person.id === id)) id = `${show.id}-${slugify(name)}`;
    const person: Person = {
      id,
      name,
      nicknames: [],
      bio: `מדבב/ת ישראלי/ת — «${show.title}», לפי ערוץ הופ תמיר.`,
      tags: ["דיבוב", "הופ תמיר"],
      activities: ["dubbing", show.kind === "film_dubbed_foreign" ? "film" : "series"],
      sourceNote: SOURCE,
      sourceUrl: show.sourceUrl,
      imageUrl: portrait(name),
      createdAt: NOW,
      updatedAt: NOW,
    };
    people.push(person);
    byNorm.set(normName(name), person);
  }

  const personIdFor = (name: string) => {
    const found = byNorm.get(normName(name));
    if (!found) throw new Error(`Missing person for ${show.title}: ${name}`);
    return found.id;
  };

  const productions = [...data.productions];
  const matchIndexes = productions
    .map((production, index) =>
      production.id === show.id || yearsOverlap(show, production) ? index : -1
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

  const keptProductions = productions.filter((production) => !droppedIds.has(production.id));
  const credits: Credit[] = assignBillingOrders(
    show.credits.map((row) => ({
      personId: personIdFor(row.name),
      productionId: show.id,
      role: row.role,
      heading: row.heading,
      characterName: row.character,
      year: row.year,
      endYear: row.endYear,
    }))
  );
  const replacedIds = new Set([show.id, ...droppedIds]);

  return {
    ...data,
    people,
    productions: keptProductions,
    credits: [
      ...data.credits.filter((credit) => !replacedIds.has(credit.productionId)),
      ...credits,
    ],
  };
}

/** הפקות מערוץ הופ תמיר, אוקטובר 2026. השם בעמודה הימנית והדמות בשמאלית. */
export function applyIshimHopTamirOct(data: ArchiveData): ArchiveData {
  return SHOWS.reduce(applyShow, data);
}
