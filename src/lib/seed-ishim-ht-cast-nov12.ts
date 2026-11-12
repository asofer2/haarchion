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

const NOW = "2026-11-12T00:00:00.000Z";
const HOP = "ערוץ הופ תמיר";

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

function hop(
  id: string,
  title: string,
  year: number,
  kind: Production["kind"],
  summary: string,
  sourceUrl: string,
  extra: Partial<Production> = {}
): Production {
  return {
    id,
    title,
    year,
    kind,
    summary,
    genres: extra.genres || [],
    originalTitle: extra.originalTitle,
    endYear: extra.endYear,
    airStatus: extra.airStatus,
    channel: extra.channel,
    runtimeMinutes: extra.runtimeMinutes,
    episodeCount: extra.episodeCount,
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

const dub = (personName: string, character?: string, heading = "מדבבים"): Row => ({
  personName,
  role: "dubber",
  heading,
  character,
});
const sing = (personName: string, character?: string): Row => ({
  personName,
  role: "singer",
  heading: "מוזיקה",
  character,
});
const tune = (personName: string, character?: string): Row => ({
  personName,
  role: "composer",
  heading: "מוזיקה",
  character,
});
const lead = (
  personName: string,
  role: CreditRole,
  heading: string,
  character?: string
): Row => ({ personName, role, heading, character });

const SPIRIT_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A8%D7%95%D7%97-%D7%94%D7%A2%D7%95%D7%9C%D7%94-2014-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const ELLA_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A7%D7%A1%D7%9D-%D7%A9%D7%9C-%D7%90%D7%9C%D7%94-2004-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const EMPEROR_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A7%D7%99%D7%A1%D7%A8-%D7%A0%D7%A4%D7%9C-%D7%A2%D7%9C-%D7%94%D7%A8%D7%90%D7%A9-2001-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const PINK1_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A4%D7%A0%D7%AA%D7%A8-%D7%94%D7%95%D7%95%D7%A8%D7%95%D7%93-%D7%9E%D7%A9%D7%99%D7%9E%D7%94-%D7%91%D7%99%D7%A0%D7%9C%D7%90%D7%95%D7%9E%D7%99%D7%AA-1997-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91";
const PINK2_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A4%D7%A0%D7%AA%D7%A8-%D7%94%D7%95%D7%95%D7%A8%D7%95%D7%93-%D7%94%D7%95%D7%A7%D7%95%D7%A1-%D7%A4%D7%95%D7%A7%D7%95%D7%A1-1998-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91";
const PIRATE_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A4%D7%99%D7%A8%D7%90%D7%98-%D7%94%D7%9E%D7%94%D7%99%D7%A8-2015-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const PENGUINS_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A4%D7%99%D7%A0%D7%92%D7%95%D7%95%D7%99%D7%A0%D7%99%D7%9D-%D7%9E%D7%9E%D7%93%D7%92%D7%A1%D7%A7%D7%A8-2010-2013-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const LILY2013_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A4%D7%99%D7%94-%D7%9C%D7%99%D7%9C%D7%99-2013-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const LILY2009_URL =
  "https://sites.google.com/view/hoptamir/%D7%94%D7%A4%D7%99%D7%94-%D7%9C%D7%99%D7%9C%D7%99-2009-%D7%90%D7%99%D7%A9%D7%99%D7%9D";

const PINK_GENRES = ["אנימציה", "ילדים", "מדובב - זר", "פנטזיה", "קומדיה"];

function sameTitle(production: Production, title: string, year: number): boolean {
  return production.year === year && production.title.replace(/\s+/g, " ").trim() === title;
}

function titleIs(production: Production, title: string): boolean {
  return production.title.replace(/\s+/g, " ").trim() === title;
}

const SHOWS: Show[] = [
  show(
    hop(
      "ht-hrvch-havlh",
      "הרוח העולה",
      2014,
      "film_dubbed_foreign",
      "סיפורו של ג'ירו הוריקושי, אדם צעיר האחראי לעיצוב מטוסי קרב יפניים במהלך מלחמת העולם השנייה",
      SPIRIT_URL,
      {
        originalTitle: "The Wind Rises / 風立ちぬ",
        channel: "HOT yes",
        runtimeMinutes: 126,
        genres: ["אנימציה", "דרמה", "מדובב - זר", "מלחמה", "פנטזיה"],
        ishimNotes: [
          {
            heading: "כללי",
            items: [
              "הסרט הוקרן ביפן לראשונה בשנת 2013",
              "הסרט הוקרן בקולנוע בתרגום בלבד, בעוד הוא שודר ב-YES VOD ו-HOT VOD בדיבוב לעברית",
            ],
          },
        ],
      }
    ),
    [
      lead("אורנה כץ", "dub_director", "בימוי דיבוב"),
      lead("יעל אללוף", "producer", "הפקת דיבוב"),
      lead("אמי בכר", "producer", "הפקת דיבוב"),
      dub("דניאל מגון", "ג'ירו הוריקושי"),
      dub("ליאנה עיון", "נאוקו סאטומי"),
      dub("יהונתן מגון", "הונג'ו"),
      dub("רום מילשטיין", "קאיו הוריקושי"),
      dub("סער בדישי", "קורוקאווה / דמויות שונות"),
      dub("עמי מנדלמן", "האטורי"),
      dub("אלי לולאי", "קסטורפ / דמויות שונות"),
      dub("אמנון וולף", "סאטומי"),
      dub("רונה בקרמן", "גברת סאטומי / רופאה"),
      dub("גדי לוי", "קפרוני"),
      dub("אורנה כץ", "אמא של ג'ירו / גברת קורוקאווה"),
      dub("דולב סלע", "ג'ירו הצעיר"),
      dub("הללי היבש", "קאיו הצעירה"),
      dub("דן שצברג", "דמויות שונות"),
    ],
    (production) =>
      production.id === "ht-hrvch-havlh" || sameTitle(production, "הרוח העולה", 2014)
  ),
  show(
    hop(
      "ht-hksm-shl-alh",
      "הקסם של אלה",
      2004,
      "film_dubbed_foreign",
      "אלה המקוללת בכישוף שגורם לה לציית לכל דבר מאז הולדתה, יוצאת למסע עם חבריה האלף והנסיך בניסיון לשבור את הכישוף",
      ELLA_URL,
      {
        runtimeMinutes: 96,
        genres: ["מדובב - זר", "נוער", "פנטזיה", "קומדיה", "רומנטיקה"],
      }
    ),
    [
      lead("שרון כהן", "dub_director", "בימוי דיבוב"),
      dub("סופי צדקה", "אלה מפרל"),
      dub("טל מוסרי", "הנסיך שרמנט"),
      dub("גלעד קלטר", "סלנן"),
      dub("רמה מסינגר", "מנדי"),
      dub("יואב יפת", "בני"),
      dub("יגאל שדה", "סר פיטר"),
      dub("אניה בוקשטיין", "ארידה"),
      dub("אריה צ'רנר", "ניש"),
      dub("יורם יוספסברג", "קופדוק / דמויות שונות"),
      dub("סיון שביט", "ברומהילדה / מדריכה בארמון"),
      dub("איריס זינגר", "אמא של אלה"),
      dub("לני כהן", "אלה הצעירה"),
      dub("אורנה בנאי", "לוסינדה פריוות'ר"),
      dub("יעל עמית", "אולגה"),
      dub("שירי גדני", "הטי"),
      dub("הדר שחף-מעיין", "אוליב"),
      dub("אושרי בן דור", "סר אדגר"),
      dub("אמנון וולף", "הסטון"),
      dub("אוהד שחר", "המספר"),
      dub("מאי רוזנר", "ילדה"),
      dub("מור הרפזי", "ילדה"),
      dub("אלברט כהן", "מנצ'רונרר / כומר"),
      dub("שמחה ברבירו", "ענק"),
      dub("אתי קסטרו", "ענקית"),
      dub("פולי סלונים", "מעריצה"),
      dub("פנינה רינצלר", "מעריצה"),
      dub("יגאל מזרחי", "מעצב"),
      dub("אודליה מורה מטלון", "דמויות שונות"),
      dub("שרון כהן", "דמויות שונות"),
      tune("שרון כהן", "ניהול מוזיקלי"),
    ],
    (production) =>
      production.id === "ht-hksm-shl-alh" || sameTitle(production, "הקסם של אלה", 2004)
  ),
  show(
    hop(
      "emperor-new-groove-he",
      "הקיסר נפל על הראש",
      2001,
      "film_dubbed_foreign",
      "קיסר אנוכי הופך ללאמה על ידי המזכירה שלו, ועכשיו הוא חייב להחזיר את המלוכה שלו בעזרת רועה לאמות נדיב",
      EMPEROR_URL,
      {
        originalTitle: "The Emperor's New Groove",
        runtimeMinutes: 95,
        genres: ["אנימציה", "ילדים", "מדובב - זר", "פנטזיה", "קומדיה"],
        ishimKeys: ["סדרת סרטים", "ספין אוף"],
        ishimNotes: [
          {
            heading: "קישורים",
            items: [
              "ראה גם ספין אוף בית ספר לקיסר המתחיל",
              "ראה גם סרט המשך הקיסר נפל על הראש 2",
            ],
          },
        ],
      }
    ),
    [
      lead("שפרירה זכאי", "dub_director", "בימוי דיבוב"),
      lead("שפרירה זכאי", "producer", "הפקת דיבוב"),
      dub("עידו מוסרי", "קוזקו"),
      dub("נתן דטנר", "פאצ'ה"),
      dub("יעל עמית", "איזמה"),
      dub("משה בקר", "קרונק"),
      dub("יעל פרל בקר", "צ'יצ'ה"),
      dub("שירלי ורטהיימר", "צ'אקה"),
      dub("אלון ברנד", "טיפו"),
      dub("ליליאן ברטו", "מלצרית / גננת"),
      dub("אוהד שחר", "טבח / שומר"),
      dub("מומי לוי", "קולות רקע"),
      dub("שמוליק טנא", "רודי / קולות רקע"),
      dub("אילן ליבוביץ", "קולות רקע"),
      dub("דורון אורן", "קולות רקע"),
      dub("יסמין עיון", "קולות רקע"),
      dub("עפרון אטקין", "קולות רקע"),
      dub("שרונה נסטוביץ'", "קולות רקע"),
      sing("גבי שושן", "שירה"),
      tune("רוני וייס", "ניהול מוזיקלי"),
    ],
    (production) =>
      production.id === "emperor-new-groove-he" || titleIs(production, "הקיסר נפל על הראש")
  ),
  show(
    hop(
      "ht-game-hpntr-hvvrvd-mshymh-bynlavmyt",
      "הפנתר הוורוד - משימה בינלאומית",
      1997,
      "game_dubbed_foreign",
      "הפנתר הורוד יוצא למשימה חשאית מסביב לעולם להציל את מחנה צ'ילי וא וא מהכלבים",
      PINK1_URL,
      {
        originalTitle: "Pink Panther's Passport to Peril",
        genres: PINK_GENRES,
      }
    ),
    [
      lead("ענת ניב", "dub_director", "בימוי דיבוב"),
      lead("עוזי פוקס", "producer", "הפקת דיבוב"),
      dub("חנן גולדבלט", "הפנתר הוורוד"),
      dub("דני בסן", "פרופסור פון שמארטי / פה / מחביר / דמויות שונות"),
      dub("עמי מנדלמן", "הכלב / ג'קסון / דמויות שונות"),
      dub("גיורא קנת", "פאג / לואי / הבוס אף גדול / המפקח / דמויות שונות"),
      dub("ענת ניב", "יונה / ג'ון / דראני / דיילת / דמויות שונות"),
      dub("יובל סגל", "נייג'ל / קומוקן / דמויות שונות"),
      dub("יהויכין פרידלנדר", "דמויות שונות"),
      sing("עוזי פוקס", "שירה"),
      tune("עוזי פוקס", "ניהול מוזיקלי"),
      sing("ענת ניב", "שירה"),
      sing("דני בסן", "שירה"),
      sing("יסמין גמליאל", "ביצוע שיר סיום"),
    ],
    (production) =>
      production.id === "ht-game-hpntr-hvvrvd-mshymh-bynlavmyt" ||
      sameTitle(production, "הפנתר הוורוד - משימה בינלאומית", 1997)
  ),
  show(
    hop(
      "ht-game-hpntr-hvvrvd-hvkvs-pvkvs",
      "הפנתר הוורוד - הוקוס פוקוס",
      1998,
      "game_dubbed_foreign",
      "הפנתר הורוד יוצא למשימה מסביב לעולם לעזור לנתן בנם של רופאי שיניים להחזיר ילדה שהפכה למפלצת לקדמותה",
      PINK2_URL,
      {
        originalTitle: "Pink Panther in Hokus Pokus Pink",
        genres: PINK_GENRES,
      }
    ),
    [
      dub("חנן גולדבלט", "הפנתר הוורוד"),
      dub("נתן דטנר", "דמוזר / דמויות שונות"),
      dub("שרון דטנר", "נתן"),
      dub("ברוך פרידלנד"),
      dub("אלברט סופר"),
      dub("גילה קפלן"),
      dub("אפי דמארי"),
      dub("שרון קרלן"),
      dub("ענת שן"),
      dub("דגנית לוי"),
      dub("אדי סומרין"),
      dub("דודי רוזנטל"),
    ],
    (production) =>
      production.id === "ht-game-hpntr-hvvrvd-hvkvs-pvkvs" ||
      sameTitle(production, "הפנתר הוורוד - הוקוס פוקוס", 1998)
  ),
  show(
    hop(
      "ht-hpyrat-hmhyr",
      "הפיראט המהיר",
      2015,
      "series_dubbed_foreign",
      "בנו של פוסידון מנהיג חבורה של פיראטים לא יוצלחים, בשלל הרפתקאות מאוד מוזרות ברחבי הים",
      PIRATE_URL,
      {
        originalTitle: "Pirate Express",
        channel: "ערוץ ג'וניור",
        runtimeMinutes: 10,
        episodeCount: 52,
        genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר", "קומדיה"],
      }
    ),
    [
      lead("גדי לוי", "dub_director", "בימוי דיבוב"),
      lead("מעיין שניידר-משה", "producer", "הפקת דיבוב"),
      dub("דניאל מגון", "נוט"),
      dub("גדי לוי", "לאפוטין / לאפוטין הצעיר / טד / דמויות שונות"),
      dub("גילן שחף", "ארמנדו"),
      dub("דדי זהר", "בורט / דמויות שונות"),
      dub("סער בדישי", "בולי / דמויות שונות"),
      dub("ניר רון", "פוסידון / דמויות שונות"),
      dub("דן קיזלר", "גורדון"),
      dub("מתי אטלס", "דמויות שונות"),
      dub("אורי זלצמן", "זאוס / דמויות שונות"),
      dub("תמי ברק", "דמויות נשיות"),
      sing("גילן שחף", "ביצוע שיר הפתיחה"),
    ],
    (production) =>
      production.id === "ht-hpyrat-hmhyr" || sameTitle(production, "הפיראט המהיר", 2015)
  ),
  show(
    hop(
      "ht-hpyngvynym-mdgskr",
      "הפינגווינים ממדגסקר",
      2010,
      "series_dubbed_foreign",
      "הרפתקאותיהם היומיומיות של הפינגווינים מסרטי מדגסקר שחיים בגן החיות של ניו יורק",
      PENGUINS_URL,
      {
        endYear: 2013,
        channel: "ניקולודיאון",
        runtimeMinutes: 24,
        genres: ["אנימציה", "מדובב - זר", "נוער", "פעולה", "קומדיה"],
        ishimKeys: ["ספין אוף"],
        ishimNotes: [
          {
            heading: "כללי",
            items: ["קיים עוד הפינגווינים ממדגסקר", "ספין אוף של מדגסקר ומדגסקר 2"],
          },
          { heading: "קישורים", items: ["הפינגווינים ממדגסקר: הסרט"] },
          { heading: "ציטוטים", items: ['"עברו למצב חמוד" - סקיפר בפתיח'] },
        ],
      }
    ),
    [
      lead("עמיחי בר טוב", "dub_director", "בימוי דיבוב", "[2010-2012]"),
      lead("מתי אטלס", "dub_director", "בימוי דיבוב", "[2013]"),
      lead("אסנת סדן", "producer", "הפקת דיבוב"),
      lead("גלי נשר", "producer", "הפקת דיבוב", "[2013]"),
      dub("רובי מוסקוביץ", "סקיפר"),
      dub("גלעד קלטר", "קובלסקי / דמויות שונות"),
      dub("ליאור זוהר", "פרייבט"),
      dub("אסף קורמן", "ריקו / פרד / דמויות שונות"),
      dub("חיים זנאתי", "ג'וליאן"),
      dub("מיכה אוזין סליאן", "מוריס / דמויות שונות"),
      dub("שמחה ברבירו", "מורט / ברט / סוכן איקס / דמויות שונות"),
      dub("עדי קוזלובסקי", "מרלין / דמויות שונות [2010]"),
      dub("מיכל רשף", "מרלין [2011]"),
      dub("מונה מור", "מרלין [2012-2013]"),
      dub("יהויכין פרידלנדר", "מייסון"),
      dub("הדר שחף-מעיין", "אליס / דמויות שונות"),
      dub("יורם יוספסברג", "באדה / מלך העכברושים / מקס / ג'ואי / ברט / פרד / דמויות שונות"),
      dub("מולי שולמן", 'בינג / רוג\'ר / ד"ר חור-בו / דמויות שונות'),
      dub("ליאת הר לב", "דמויות שונות [2011]"),
      dub("מתי אטלס", "דמויות שונות [2013]"),
      dub("אסף פריינטא", "אלכס [2012]", "מדבבים אורחים"),
    ],
    (production) =>
      production.id === "ht-hpyngvynym-mdgskr" ||
      sameTitle(production, "הפינגווינים ממדגסקר", 2010)
  ),
  show(
    hop(
      "ht-hpyh-lyly-2013",
      "הפיה לילי",
      2013,
      "series_dubbed_foreign",
      "סיפורה של לילי הפיה שמטרתה לשלוט בקסם וליצור רק יופי וטוב לב בממלכה המכושפת של ורודיה",
      LILY2013_URL,
      {
        channel: "הופ!",
        runtimeMinutes: 12,
        genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר", "מוזיקלי"],
        ishimNotes: [{ heading: "כללי", items: ["קיים עוד הפיה לילי"] }],
      }
    ),
    [
      lead("אפרת ענבל", "dub_director", "בימוי דיבוב"),
      lead("אסנת סדן", "producer", "הפקת דיבוב"),
      lead("גלי נשר", "producer", "הפקת דיבוב"),
      dub("ספיר דרמון", "הפיה לילי"),
      dub("דור סרוגו", "טיני החזיר / להב"),
      dub("מיכאל עינב", "חזי הקיפוד"),
      dub("טליה ברקאי", "כלנית / דמויות שונות"),
      dub("לין כהן", "ורדית"),
      dub("עמי מנדלמן", "קרלוס הצפרדע / דמויות שונות"),
      dub("יהונתן מגון", "אוסקר החיפושית / דמויות שונות"),
      dub("דן קיזלר", "נוני הארנב / דמויות שונות"),
      dub("עודד מנסטר", "דובל'ה הדוב"),
      dub("אלונה אלכסנדר", "עננה / דמויות שונות"),
      sing("מונה מור", "ביצוע שיר הפתיחה"),
    ],
    (production) =>
      production.id === "ht-hpyh-lyly-2013" || sameTitle(production, "הפיה לילי", 2013)
  ),
  show(
    hop(
      "ht-hpyh-lyly-2009",
      "הפיה לילי",
      2009,
      "film_dubbed_foreign",
      "סיפורה של לילי הפיה שמטרתה לשלוט בקסם וליצור רק יופי וטוב לב בממלכה המכושפת של ורודיה",
      LILY2009_URL,
      {
        runtimeMinutes: 70,
        genres: ["אנימציה", "חינוכי", "ילדים", "מדובב - זר"],
        ishimNotes: [
          { heading: "כללי", items: ["קיים עוד הפיה לילי"] },
          { heading: "קישורים", items: ["הפיה לילי וחד הקרן"] },
          { heading: "מאחורי הקלעים", items: ["בטריילר עפרון אטקין דיבב את בני"] },
        ],
      }
    ),
    [
      lead("עמי מנדלמן", "dub_director", "בימוי דיבוב"),
      lead("מיכל בשירי", "producer", "הפקת דיבוב"),
      lead("אמי בכר", "producer", "הפקת דיבוב"),
      lead("גילי בכר", "producer", "הפקת דיבוב"),
      dub("ספיר דרמון", "הפיה לילי"),
      dub("אסף אבידן", "פיני החזיר"),
      dub("מיכאל עינב", "חזי הקיפוד"),
      dub("טליה ברקאי", "כלנית"),
      dub("לין כהן", "ורדית"),
      dub("אלונה אלכסנדר", "עננה"),
      dub("אלעד סמוכה", "סופה"),
      dub("דור סרוגו", "להב"),
      dub("מירון אהרונוביץ'", "פיון המזל הרע"),
      dub("לירי אור", "פתית שלג"),
      dub("נועה קשפיצקי", "תלתן"),
      dub("עמי מנדלמן", "קרלוס הצפרדע / גמדים"),
      dub("אורלי קטן", "קוקי"),
      dub("אורנה כץ", "אמא בתולת ים"),
      dub("דדי זהר", "בני"),
      dub("עפרון אטקין", "גובלין איכר"),
      dub("רועי מנדלמן", "גמד"),
    ],
    (production) =>
      production.id === "ht-hpyh-lyly-2009" || sameTitle(production, "הפיה לילי", 2009)
  ),
];

function surfaceFor(kind: Production["kind"]): ActivityCategory {
  if (kind === "game_israeli" || kind === "game_dubbed_foreign") return "game";
  if (
    kind === "series_dubbed_foreign" ||
    kind === "tv_series" ||
    kind === "series" ||
    kind === "tv_program"
  ) {
    return "series";
  }
  return "film";
}

function activitiesFor(role: CreditRole, kind: Production["kind"]): ActivityCategory[] {
  const activity = roleToActivity(role);
  const surface = surfaceFor(kind);
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

/** ליהוקי הופ תמיר מ-12 בנובמבר 2026. מעדכן ערך קיים או מוסיף חדש. */
export function applyIshimHopCastNov12(data: ArchiveData): ArchiveData {
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
