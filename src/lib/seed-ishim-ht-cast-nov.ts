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

const NOW = "2026-11-08T00:00:00.000Z";
const HOP = "ערוץ הופ תמיר";
const ISHIM = "אישים";

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
  /** כשהשנים כבר כתובות בתפקיד — לא להוסיף שנת הפקה לכל שורה */
  stampYear?: boolean;
};

function show(
  production: Production,
  credits: Row[],
  matches: (production: Production) => boolean,
  stampYear = true
): Show {
  return { production, credits, matches, stampYear };
}

function hopFilm(
  id: string,
  title: string,
  year: number,
  summary: string,
  sourceUrl: string,
  extra: Partial<Production> = {}
): Production {
  return {
    id,
    title,
    year,
    kind: "film_dubbed_foreign",
    summary,
    genres: extra.genres || ["אנימציה", "ילדים", "מדובב - זר"],
    originalTitle: extra.originalTitle,
    channel: extra.channel,
    runtimeMinutes: extra.runtimeMinutes,
    episodeCount: extra.episodeCount,
    endYear: extra.endYear,
    ishimKeys: extra.ishimKeys,
    ishimNotes: extra.ishimNotes,
    ishimClassic: true,
    imageUrl: portrait(title, extra.originalTitle),
    sourceNote: HOP,
    sourceUrl,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function hopSeries(
  id: string,
  title: string,
  year: number,
  summary: string,
  sourceUrl: string,
  extra: Partial<Production> = {}
): Production {
  return {
    ...hopFilm(id, title, year, summary, sourceUrl, extra),
    kind: "series_dubbed_foreign",
  };
}

const d = (
  personName: string,
  character?: string,
  heading = "מדבבים"
): Row => ({
  personName,
  role: "dubber",
  heading,
  character,
});

const LILY_URL =
  "https://web.archive.org/web/20200627011446/https://www.ishim.co.il/m.php?s=%D7%9C%D7%99%D7%9C%D7%99+%D7%94%D7%9E%D7%9B%D7%A9%D7%A4%D7%94";
const FELIX2_URL =
  "https://sites.google.com/view/hoptamir/%D7%A4%D7%9C%D7%99%D7%A7%D7%A1-2-%D7%90%D7%A8%D7%A0%D7%91-%D7%94%D7%A6%D7%A2%D7%A6%D7%95%D7%A2-%D7%95%D7%9E%D7%9B%D7%95%D7%A0%D7%AA-%D7%94%D7%96%D7%9E%D7%9F-2007-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const WONDER_URL =
  "https://sites.google.com/view/hoptamir/%D7%95%D7%95%D7%A0%D7%93%D7%A8-%D7%A4%D7%98%D7%A1-2007-2010-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const STREAM_URL =
  "https://sites.google.com/view/hoptamir/%D7%97%D7%99%D7%99%D7%9D-%D7%91%D7%96%D7%A8%D7%9D-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const ONE_URL =
  "https://sites.google.com/view/hoptamir/%D7%95%D7%95%D7%90%D7%9F-%D7%A4%D7%99%D7%A1-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const HOWL_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%98%D7%99%D7%A8%D7%94-%D7%94%D7%A0%D7%A2%D7%94-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SPIES_URL =
  "https://sites.google.com/view/hoptamir/%D7%98%D7%95%D7%98%D7%9C%D7%99-%D7%A1%D7%A4%D7%99%D7%99%D7%A1-2003-2014";
const FELIX1_URL =
  "https://sites.google.com/view/hoptamir/%D7%9E%D7%A1%D7%91%D7%99%D7%91-%D7%9C%D7%A2%D7%95%D7%9C%D7%9D-%D7%A2%D7%9D-%D7%A4%D7%9C%D7%99%D7%A7%D7%A1-2005-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const BARN_URL =
  "https://sites.google.com/view/hoptamir/%D7%91%D7%9C%D7%90%D7%92%D7%9F-%D7%91%D7%97%D7%95%D7%95%D7%94-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D";

const SHOWS: Show[] = [
  show(
    {
      ...hopSeries(
        "ishim-lyly-hmkshph",
        "לילי המכשפה",
        2005,
        "לילי הנערה, יוצאת בזמן עם חברה הדרקון במסע לימודי ופוגשים אנשים שהיו אחראים להשראה גדולה בהיסטוריה של העולם",
        LILY_URL,
        {
          originalTitle: "Lilly the Witch",
          endYear: 2006,
          channel: "לוגי",
          runtimeMinutes: 24,
          episodeCount: 26,
          genres: ["אנימציה", "חינוכי", "ילדים", "מדובב - זר", "פנטזיה"],
        }
      ),
      sourceNote: ISHIM,
    },
    [
      { personName: "אפי בן ישראל", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
      d("מאי יעקובסון", "לילי"),
      d("ניר רון", "הקטור"),
      d("עידו דנקנר", "ליאון [ 2005 ]"),
      d("שיר הדר", "ליאון [ 2006 ]"),
      d("אלי לולאי", "דמויות שונות", "מדבבים אורחים"),
      d("עמי מנדלמן", "דמויות שונות", "מדבבים אורחים"),
      d("שרית סרי", "דמויות שונות", "מדבבים אורחים"),
      d("תום שוורצברג", "דמויות שונות", "מדבבים אורחים"),
      d("אפי בן ישראל", "דמויות שונות [ 2005 ]", "מדבבים אורחים"),
      d("יהונתן מגון", "דמויות שונות [ 2005 ]", "מדבבים אורחים"),
      d("ירון לוי סבג", "דמויות שונות [ 2005 ]", "מדבבים אורחים"),
      d("קובי פרג'", "דמויות שונות [ 2006 ]", "מדבבים אורחים"),
      d("מירון אהרונוביץ'", "דמויות שונות [ 2006 ]", "מדבבים אורחים"),
      {
        personName: "אלי לולאי",
        role: "singer",
        heading: "מוזיקה",
        character: "שיר פתיחה (ביצוע)",
      },
    ],
    (production) =>
      production.id === "ishim-lyly-hmkshph" || production.title === "לילי המכשפה",
    false
  ),
  show(
    hopFilm(
      "ht-plks-2",
      "פליקס 2 - ארנב הצעצוע ומכונת הזמן",
      2007,
      "במהלך ביקור במוזיאון, פליקס מגלה מכונת זמן ובטעות שולח את עצמו ואת חבריו לתקופות שונות",
      FELIX2_URL,
      {
        originalTitle: "Felix 2 – Der Hase und die verflixte Zeitmaschine",
        runtimeMinutes: 78,
        genres: [
          "אנימציה",
          "חינוכי",
          "ילדים",
          "מדובב - זר",
          "מדע בדיוני",
          "מוזיקלי",
          "פנטזיה",
        ],
      }
    ),
    [
      { personName: "הדס מוזס", role: "dub_director", heading: "בימוי דיבוב" },
      d("עדי קוזלובסקי", "פליקס"),
      d("שירי גדני", "סופי"),
      d("אסתי ברעד פורים", "ג'וליוס / אמא של אומה"),
      d("תמיר גינזבורג", "ניקולאס"),
      d("אניה בוקשטיין", "לנה / אוליביסי"),
      d("אמנון וולף", "אבא / ויקינג / הרברט / ביזון / חמור"),
      d("הילה מערבי", "אמא"),
      d("דביר אילן", "וולי"),
      d("הדר שחף-מעיין", "גרטרוד"),
      d("רון כלף", "ליפ"),
      d("אלברט כהן"),
      d("אסף פריינטא", "אריק האדום"),
      d("רועי רביב", "שאפי"),
      d("איתי רוזנר", "כלב צהוב"),
      d("עמית טולדנו", "עורב שחור"),
      d("אסף קורמן", "בונה / שומר מוזיאון / תמנון / סוס שחור"),
      d("אביגיל אריאלי", "נפרטיטי"),
      d("גלעד קלטר", "דוור / סרטן / מרבו"),
      d("שמחה ברבירו", "ראש שבט אינדיאני / כריש / אבא של מטילדה"),
      d("מיכה אוזין סליאן", "ליוויתן / שומר מצרי / מלך"),
      d("יורם יוספסברג", "אבא של אומה / חתול ים / סרטן / סרגי ושפל"),
      d("נוף נתנזון", "אומה / ילדה במוזיאון"),
      d("ענת ארליך", "מטילדה"),
      d("דביר בנדק", "קנוט / אינדיאני / היפו / נפח"),
      {
        personName: "אסתי ברעד פורים",
        role: "singer",
        heading: "מוזיקה",
        character: "שיר נושא (ביצוע)",
      },
      {
        personName: "הדר שחף-מעיין",
        role: "composer",
        heading: "ניהול מוזיקלי",
      },
    ],
    (production) =>
      production.id === "ht-plks-2" ||
      production.title === "פליקס 2 - ארנב הצעצוע ומכונת הזמן"
  ),
  show(
    hopSeries(
      "ht-vvndr-pts",
      "וונדר פטס",
      2007,
      "אוגר, צב וברווזונת קטנים מטיילים מסביב לעולם במבצע הצלת החיות שצריכים עזרה",
      WONDER_URL,
      {
        originalTitle: "Wonder Pets",
        endYear: 2010,
        channel: "ניקולודיאון / ניק ג'וניור",
        runtimeMinutes: 30,
        episodeCount: 62,
        genres: ["אנימציה", "חינוכי", "ילדים", "מדובב - זר"],
      }
    ),
    [
      { personName: "אורנה כץ", role: "dub_director", heading: "בימוי דיבוב" },
      {
        personName: "יונית עוזרי מנחם",
        role: "producer",
        heading: "הפקת דיבוב",
        character: "[2007-2009]",
      },
      {
        personName: "יעל אללוף",
        role: "producer",
        heading: "הפקת דיבוב",
        character: "[2010]",
      },
      d("גיא קשפיצקי", "ליני השרקן [2007-2008]"),
      d("רועי ניב", "ליני השרקן [2009-2010]"),
      d("עידו דנקנר", "טאק הצב [2007-2009]"),
      d("עדי בר לב", "טאק הצב [2010]"),
      d("ליאנה עיון", "מינג-מינג הברווזונת"),
      d("אור אלטמן", "אולי הארנב / דמויות שונות"),
      d("אורנה כץ", "גננת / דמויות שונות"),
      d("אלי לולאי", "דמויות שונות"),
      d("עלמא היבש", "דמויות שונות"),
      d("איתי ג'רופי", "דמויות שונות [2007-2009]"),
      d("נוי הדס", "דמויות שונות [2007]"),
      d("הללי היבש", "דמויות שונות [2009-2010]"),
      d("איתי תורן", "דמויות שונות [2009]"),
      d("עפרון אטקין", "דמויות שונות [2009]"),
      d("מיקה צור", "דמויות שונות [2009]"),
      d("קובי סנדהאוס", "דמויות שונות [2009]"),
      d("נורית בנאי קורן", "דמויות שונות [2009]"),
      d("דיוויד לרנר", "דמויות שונות [2010]"),
      d("לורה שופוב", "דמויות שונות [2010]"),
      d("דדי זהר", "דמויות שונות [2010]"),
      d("עמי מנדלמן", "דמויות שונות [2010]"),
    ],
    (production) =>
      production.id === "ht-vvndr-pts" || production.title === "וונדר פטס"
  ),
  show(
    hopFilm(
      "ht-chyym-bzrm",
      "חיים בזרם",
      2006,
      "סיפורו של עכבר עיר שנשטף באסלה מהפנטהאוז שלו לביבים של לונדון, שם הוא לומד דרך חיים חדשה ושונה",
      STREAM_URL,
      {
        originalTitle: "Flushed Away",
        runtimeMinutes: 85,
        ishimKeys: ["פשע"],
        genres: ["אנימציה", "מדובב - זר", "קומדיה"],
      }
    ),
    [
      { personName: "שרון כהן", role: "dub_director", heading: "בימוי דיבוב" },
      d("יחזקאל לזרוב", "רודי"),
      d("שירי גדני", "ריטה"),
      d("אלי גורנשטיין", "הקרפד"),
      d("אלברט אילוז", "לה פרוג"),
      d("גלעד קלטר", "ספייק"),
      d("יגאל שדה", "וייטי"),
      d("דביר בנדק", "סיד"),
      d("אריה צ'רנר", "השוטר קולין / עכבר סוכן רזה"),
      d("דב רייזר", "עכבר שודד ים / עכבר כומר / עכבר עיתונאי"),
      d("אוהד שחר", "אבא של קפיטה / סיני מדבר בטלפון"),
      d("אסף קורמן", "ליעם"),
      d("אלברט כהן", "אבא של ריטה / צפרדע"),
      d("יעל עמית", "אמא של ריטה"),
      d("לירון ברנס", "הארולד"),
      d("יואב יפת", "שדרן כדורגל בטלוויזיה / צפרדע"),
      d("מיכל רובין", "עכברה תולה כבישה / ראשנית"),
      d("עמרי ענבי", "שוקי"),
      d("פולי סלונים", "עכברה תושבת רזה / ראשנית"),
      d("לני כהן", "קפיטה"),
      d("מורן סופר", "דג מדבר"),
      d("אמנון וולף", "סמל צעצוע / עכבר רגזן / צפרדע"),
      d("הדר שחף-מעיין", "עכברה אמריקאית / ראשנית"),
      d("עדי קוזלובסקי", "אמא של קפיטה / סבתא של ריטה / עכברה מוכרת"),
      d("יורם יוספסברג", "עכבר שמן / תיקן מדבר"),
      d("שמחה ברבירו", "האני / עכבר צייר / צלופח סגול עצבני"),
      d("יובל ענבי", "עכברים ילדים"),
      d("גל ענבי", "עכברים ילדים"),
      d("שרון כהן", "דג מדבר / זבוב / עכברים נוספים"),
      {
        personName: "יגאל מזרחי",
        role: "singer",
        heading: "מוזיקה",
        character: "רודי (שירה)",
      },
    ],
    (production) =>
      production.id === "ht-chyym-bzrm" || production.title === "חיים בזרם"
  ),
  show(
    hopSeries(
      "ht-vvan-pys",
      "וואן פיס",
      2006,
      "נער צעיר עם כוחות גומי, אוסף חבורה של לוחמים אמיצים במסע אל האוצר הגדול בכדי להגשים את כל משאלותיהם",
      ONE_URL,
      {
        originalTitle: "ワンピース / One Piece",
        channel: "ג'טיקס",
        runtimeMinutes: 24,
        episodeCount: 52,
        genres: ["אנימציה", "דרמה", "מדובב - זר", "נוער", "פעולה"],
        ishimNotes: [
          { heading: "מוזיקה", items: ["תרגום שירי פתיחה ושירי סיום"] },
        ],
      }
    ),
    [
      { personName: "עמיחי בר טוב", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "אסנת סדן", role: "producer", heading: "הפקת דיבוב" },
      d("יגאל מזרחי", "מונקי די לופי"),
      d(
        "יורם יוספסברג",
        "רורונואה זורו / רוג'ר המוזהב / בוצ'י ניבן / זאף / צ'ו / אל האי השומר / דמויות שונות"
      ),
      d("נטלי פיק", "נאמי"),
      d("גלעד קלטר", "יוזופה / דמויות שונות"),
      d("מולי שולמן", "סאנג'י / מוג'י / קבאג'י / דמויות שונות"),
      d("דן קיזלר", "קובי / דמויות שונות"),
      d("מתי אטלס", "שאנקס / מורי / דמויות שונות"),
      d(
        "מיכה אוזין סליאן",
        "באגי הליצן / דון קריג / ארלון / קריינות / מורגן / דמויות שונות"
      ),
      d("דנה סמו", "ריקה / טאמנג'י / דמויות שונות"),
      d("עדי קוזלובסקי", "אלבידה / קאיה / בלמר / דינג'ין / דמויות שונות"),
      d("סאמי קורן", "קווינה / פימאן / אמא של ריקה / דמויות שונות"),
      d(
        "עפרון אטקין",
        "קפטן קורו / שמאה ניבן / נוסקו / פנינת הפלדה / דוקטור / דמויות שונות"
      ),
      d(
        "שמחה ברבירו",
        "ג'אנגו / קפטן סמוקר / הלמופו / ראש העיר הזקן / נזומי / ג'וני / פאטי / דמויות שונות"
      ),
      d("אמנון וולף", "פולבודי / קארנה / גנזו / עין הנץ מיהוק / דמויות שונות"),
      d("הילה מערבי", "נוג'יקו / דמויות שונות"),
      d("יואב יפת", "ג'ין / קורובי / דמויות שונות"),
      d("אסף קורמן", "נוני / דמויות שונות"),
      d("שירי גדני", "טאשיגי"),
      d("אלברט כהן", "ראול", "מדבבים אורחים"),
      d("איריס זינגר", "קארול", "מדבבים אורחים"),
      d("דביר בנדק", "דדי / דמויות שונות", "מדבבים אורחים"),
      d("שרון כהן", "דמויות שונות", "מדבבים אורחים"),
      { personName: "שרון כהן", role: "composer", heading: "מוזיקה" },
      {
        personName: "הדר שחף-מעיין",
        role: "singer",
        heading: "מוזיקה",
        character: "שיר פתיחה ראשון (ביצוע) / ניהול מוזיקלי",
      },
      {
        personName: "זיו מאיר",
        role: "singer",
        heading: "מוזיקה",
        character: "שיר הפתיחה שני ושיר סיום (ביצוע) / ניהול מוזיקלי",
      },
    ],
    (production) =>
      production.id === "ht-vvan-pys" || production.title === "וואן פיס"
  ),
  show(
    hopFilm(
      "ht-htyra-hnh",
      "הטירה הנעה",
      2006,
      "מכשפה הופכת את סופי, נערה חסרת ביטחון, לזקנה. סופי מוצאת עבודה בטירת החידות והמיסתורין של הקוסם האוול",
      HOWL_URL,
      {
        originalTitle: "ハウルの動く城 / Howl's Moving Castle",
        runtimeMinutes: 118,
        ishimKeys: ["מבוסס על ספר קסמים"],
        genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר", "פנטזיה", "רומנטיקה"],
      }
    ),
    [
      { personName: "סיון שביט", role: "dub_director", heading: "בימוי דיבוב" },
      d("אניה בוקשטיין", "סופי הצעירה"),
      d("סיון שביט", "סופי הזקנה"),
      d("אסף פריינטא", "האוול"),
      d("גל ענבי", "מרקל"),
      d("עידו מוסרי", "קליציפר"),
      d("יעל עמית", "מכשפת הביצות"),
      d("עדי קוזלובסקי", "לטי"),
      d("עינת גליקסמן", "אמא פאני"),
      d("אסף קורמן", "הנסיך לפת"),
      d("עדנה גורן", "מאדאם סאלימן"),
      d("דב רייזר", "ראש העיר"),
      d("אלברט כהן", "איש זקן"),
      d("אורי אומנותי", "משרת"),
      d("ג'וי וינו אלעד", "ילדה קטנה"),
      d("יעל פרימר"),
      d("גלעד קלטר"),
      d("הדר שחף-מעיין"),
      d("יגאל מזרחי"),
      d("מולי שולמן"),
      d("מיכה אוזין סליאן"),
      d("שמחה ברבירו"),
      d("שרון כהן"),
    ],
    (production) =>
      production.id === "ht-htyra-hnh" || production.title === "הטירה הנעה"
  ),
  show(
    hopSeries(
      "ht-tvtly-spyys",
      "טוטלי ספייס",
      2003,
      "שלוש תיכוניסטיות צעירות ורגילות הן מרגלות של סוכנות חשאית שמצילות את העולם",
      SPIES_URL,
      {
        originalTitle: "Totally Spies!",
        endYear: 2014,
        channel: "ג'טיקס / ערוץ דיסני",
        runtimeMinutes: 23,
        episodeCount: 156,
        ishimKeys: ["ספין אוף"],
        genres: [
          "אנימציה",
          "מדובב - זר",
          "מדע בדיוני",
          "נוער",
          "פנטזיה",
          "פעולה",
          "קומדיה",
        ],
        ishimNotes: [{ heading: "קישורים", items: ["ראה גם ספין אוף סוכני העל"] }],
      }
    ),
    [
      {
        personName: "הדס מוזס",
        role: "dub_director",
        heading: "בימוי דיבוב",
        character: "[2003-2007]",
      },
      {
        personName: "הדר שחף-מעיין",
        role: "dub_director",
        heading: "בימוי דיבוב",
        character: "[2005]",
      },
      {
        personName: "אפרת קרצמן",
        role: "dub_director",
        heading: "בימוי דיבוב",
        character: "[2008-2014]",
      },
      {
        personName: "נטע בן צבי",
        role: "producer",
        heading: "הפקת דיבוב",
        character: "[2003-2004]",
      },
      {
        personName: "אסנת סדן",
        role: "producer",
        heading: "הפקת דיבוב",
        character: "[2005-2014]",
      },
      {
        personName: "גלי נשר",
        role: "producer",
        heading: "הפקת דיבוב",
        character: "[2014]",
      },
      d("סיון שביט", "סאם [2003-2008]"),
      d("נועה גורן", "סאם [2014]"),
      d("אניה בוקשטיין", "קלובר [2003-2005]"),
      d("שירי גדני", "קלובר [2007-2014]"),
      d("הדר שחף-מעיין", "אלכס"),
      d("דב רייזר", "ג'רי"),
      d("הילה מערבי", "גלאדיס [2005-2014]"),
      d("דנה סמו", "בריטני [2005-2014]"),
      d("אתי קסטרו", "מנדי"),
      d("אביטל פסטרנק", "דמויות אורחות [2003]", "מדבבים אורחים"),
      d("אריה צ'רנר", "דמויות אורחות [2003]", "מדבבים אורחים"),
      d("איריס זינגר", "דמויות אורחות [2003-2005]", "מדבבים אורחים"),
      d("אלברט כהן", "דמויות אורחות [2004]", "מדבבים אורחים"),
      d("אלי לולאי", "דמויות אורחות [2003-2004]", "מדבבים אורחים"),
      d("אמנון וולף", "דמויות אורחות [2005-2014]", "מדבבים אורחים"),
      d("אסף קורמן", "דמויות אורחות [2003-2008]", "מדבבים אורחים"),
      d("גילן שחף", "דמויות אורחות [2008-2014]", "מדבבים אורחים"),
      d("גלעד קלטר", "דמויות אורחות [2007-2014]", "מדבבים אורחים"),
      d("דביר בנדק", "דמויות אורחות [2003-2004]", "מדבבים אורחים"),
      d("דור סרוגו", "ג'ייסון - זוני [2004]", "מדבבים אורחים"),
      d("דורון אורן", "דמויות אורחות [2005-2008]", "מדבבים אורחים"),
      d("זיו מאיר", "דמויות אורחות [2003-2008]", "מדבבים אורחים"),
      d("יגאל מזרחי", "דמויות אורחות [2003-2008]", "מדבבים אורחים"),
      d("יהונתן מגון", "דמויות אורחות [2007-2014]", "מדבבים אורחים"),
      d("יואב יפת", "דמויות אורחות [2007-2008]", "מדבבים אורחים"),
      d("יורם יוספסברג", "דמויות אורחות", "מדבבים אורחים"),
      d("יעל בן ארי", "דמויות אורחות [2008]", "מדבבים אורחים"),
      d("יעל עמית", "דמויות אורחות [2005-2008]", "מדבבים אורחים"),
      d("מולי שולמן", "דמויות אורחות [2005-2008]", "מדבבים אורחים"),
      d("מיכל מוכתר", "דמויות אורחות [2005-2008]", "מדבבים אורחים"),
      d("נורית כהן", "דמויות אורחות [2004]", "מדבבים אורחים"),
      d("נטלי פיק", "דמויות אורחות [2007-2008]", "מדבבים אורחים"),
      d("ניב קייקוב", "דמויות אורחות [2008]", "מדבבים אורחים"),
      d("סער בדישי", "דמויות אורחות [2003]", "מדבבים אורחים"),
      d("עדי קוזלובסקי", "דמויות אורחות [2005-2014]", "מדבבים אורחים"),
      d("עינת גליקסמן", "דמויות אורחות [2007-2008]", "מדבבים אורחים"),
      d("ענת ארליך", "דמויות אורחות [2007-2014]", "מדבבים אורחים"),
      d("עפרון אטקין", "דמויות אורחות [2004-2007]", "מדבבים אורחים"),
      d("צביקה שוורצברג", "דמויות אורחות [2003-2005]", "מדבבים אורחים"),
      d("שמחה ברבירו", "דמויות אורחות", "מדבבים אורחים"),
      d("שרון כהן", "דמויות אורחות [2003-2004]", "מדבבים אורחים"),
      d("תום שוורצברג", "דמויות אורחות [2008]", "מדבבים אורחים"),
      {
        personName: "עינת אזולאי",
        role: "singer",
        heading: "מוזיקה",
        character: "ביצוע שיר הפתיחה [2014]",
      },
    ],
    (production) =>
      production.id === "ht-tvtly-spyys" || production.title === "טוטלי ספייס"
  ),
  show(
    hopFilm(
      "ht-msbyb-plks",
      "מסביב לעולם עם פליקס",
      2005,
      "לאחר שפליקס מאבד את עקבותיהם של סופי ומשפחתה במהלך חופשת הקיץ, הוא יוצא מסביב לעולם בכדי לחזור הביתה",
      FELIX1_URL,
      {
        originalTitle: "Felix – Ein Hase auf Weltreise",
        runtimeMinutes: 84,
        genres: ["אנימציה", "הרפתקאות", "חינוכי", "ילדים", "מדובב - זר"],
      }
    ),
    [
      { personName: "הדס מוזס", role: "dub_director", heading: "בימוי דיבוב" },
      d("עדי קוזלובסקי", "פליקס"),
      d("שירי גדני", "סופי"),
      d("אסתי ברעד פורים", "ג'וליוס / דרקולה הקטן"),
      d("אניה בוקשטיין", "לנה / פייה"),
      d("תמיר גינזבורג", "ניקולאס"),
      d("אמנון וולף", "אבא / דודו"),
      d("הילה מערבי", "אמא"),
      d("עפרון אטקין", "מלך הפיות / מטפס הרים / דייג"),
      d("יורם יוספסברג", "טרול ענקי / משרת"),
      d("איריס זינגר", "ינשופה"),
      d("עידו מוסרי", "המקקים המזמרים"),
      d("זיו מאיר", "רוקי מלך הניוקי"),
      d("דביר בנדק", "יטי"),
      d("דנה סמו", "סאלי"),
      d("מולי שולמן", "קפטן ברונו הדוב / מטפס הרים"),
      d("מתי אטלס", "סקוטי / מטפס הרים / שחף ירוק"),
      d("צביקה שוורצברג", "קפטן נמו / שחף ירוק"),
      d("סיון שביט", "עטלפית"),
      d("יגאל מזרחי", "דרקולה הצעיר"),
      d("נטלי פיק", "הרוזנת דרקולה"),
      d("הדר שחף-מעיין", "דוור / פייה / דודואית / שחפית ירוקה"),
      { personName: "גלעד קלטר", role: "composer", heading: "מוזיקה" },
      {
        personName: "הדר שחף-מעיין",
        role: "singer",
        heading: "מוזיקה",
        character: "שיר נושא (ביצוע) / ביצוע שירים",
      },
      {
        personName: "עידו מוסרי",
        role: "singer",
        heading: "מוזיקה",
        character: "שיר סיום (ביצוע)",
      },
    ],
    (production) =>
      production.id === "ht-msbyb-plks" ||
      production.title === "מסביב לעולם עם פליקס"
  ),
  show(
    hopFilm(
      "ht-blgn-bchvh",
      "בלאגן בחווה",
      2006,
      "מאחורי הגב של בני האדם, חיות החווה חוגגות, שרות ורוקדות. המצב כמעט יוצא משליטה עד שאוטיס הפר עושה סדר",
      BARN_URL,
      {
        originalTitle: "Barnyard",
        runtimeMinutes: 90,
        genres: ["אנימציה", "ילדים", "מדובב - זר", "קומדיה"],
        ishimNotes: [
          { heading: "קישורים", items: ["ראה סדרת המשך חברים בחווה"] },
          { heading: "ציטוטים", items: ['"תחלבו לי!" - אוטיס בתסכול'] },
        ],
      }
    ),
    [
      { personName: "שרון כהן", role: "dub_director", heading: "בימוי דיבוב" },
      d("יחזקאל לזרוב", "אוטיס"),
      d("אריה צ'רנר", "בן"),
      d("אפרת בן צור", "דייזי"),
      d("שמחה ברבירו", "פיפ / כתב חדשות"),
      d("אוהד שחר", "חזיר / האיכר"),
      d("גלעד קלטר", "פרדי / כבשה"),
      d("עידו מוסרי", "פק / תייש"),
      d("גל ענבי", "מאדי"),
      d("יורם יוספסברג", "מיילס / שדרן בטלוויזיה"),
      d("אודליה מורה מטלון", "בסי / מנהלת קפיטריה"),
      d("דביר בנדק", "דוק"),
      d("מיכה אוזין סליאן", "רוט"),
      d("מולי שולמן", "איג"),
      d("אסף פריינטא", "באט"),
      d("ענת וקסמן", "גברת בידי / תרנגולת"),
      d("דב רייזר", "נתן בידי"),
      d("מורן סופר", "יוג'ין"),
      d("יגאל מזרחי", "אח תאום 1#"),
      d("שרון כהן", "אח תאום 2# / מאט / גופר"),
      d("ששי סעד", "דאג"),
      d(
        "הילה מערבי",
        "שוטר / אבא של יוג'ין / אמא של יוג'ין / אישה בקפיטריה"
      ),
      { personName: "אמנון וולף", role: "composer", heading: "ניהול מוזיקלי" },
    ],
    (production) =>
      production.id === "ht-blgn-bchvh" || production.title === "בלאגן בחווה"
  ),
];

function activitiesFor(role: CreditRole, kind: Production["kind"]): ActivityCategory[] {
  const activity = roleToActivity(role);
  const surface: ActivityCategory =
    kind === "series_dubbed_foreign" || kind === "series" ? "series" : "film";
  return activity === surface ? [surface] : [activity, surface];
}

function stubPerson(name: string, role: CreditRole, production: Production): Person {
  const canonical = canonicalPersonName(name);
  return {
    id: `ht-${slugify(canonical) || "person"}`,
    name: canonical,
    nicknames: [],
    bio: "",
    tags: ["דיבוב", "הופ תמיר"],
    activities: activitiesFor(role, production.kind),
    sourceNote: production.sourceNote,
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

/** ליהוקי הופ תמיר ואישים: לילי המכשפה, פליקס, וונדר פטס, חיים בזרם, וואן פיס, הטירה הנעה, טוטלי ספייס, בלאגן בחווה. */
export function applyIshimHopCastNov(data: ArchiveData): ArchiveData {
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
    const previous =
      found.find((production) => production.id === item.production.id) || found[0];
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
          year: item.stampYear === false ? undefined : item.production.year,
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
