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

const NOW = "2026-11-11T00:00:00.000Z";
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
const act = (personName: string, character?: string): Row => ({
  personName,
  role: "actor",
  heading: "שחקנים",
  character,
});
const sing = (personName: string, character?: string): Row => ({
  personName,
  role: "singer",
  heading: "מוזיקה",
  character,
});

const ZAK_URL =
  "https://sites.google.com/view/hoptamir/%D7%96%D7%90%D7%A7-%D7%A1%D7%98%D7%95%D7%A8%D7%9D-2018-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const WOLVES_URL =
  "https://sites.google.com/view/hoptamir/%D7%96%D7%90%D7%91%D7%99%D7%9D-%D7%9E%D7%9B%D7%A9%D7%A4%D7%95%D7%AA-%D7%95%D7%A2%D7%A0%D7%A7%D7%99%D7%9D-2002-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const TOM_URL =
  "https://sites.google.com/view/hoptamir/%D7%98%D7%95%D7%9D-%D7%94%D7%98%D7%A8%D7%A7%D7%98%D7%95%D7%A8-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const FAM_URL =
  "https://sites.google.com/view/hoptamir/%D7%97%D7%A9%D7%99%D7%91%D7%94-%D7%94%D7%9E%D7%A6%D7%90%D7%AA%D7%99%D7%AA-%D7%9C%D7%9B%D7%9C-%D7%94%D7%9E%D7%A9%D7%A4%D7%97%D7%94-1999-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91";
const OMER_URL =
  "https://sites.google.com/view/hoptamir/%D7%A2%D7%95%D7%9E%D7%A8-%D7%95%D7%94%D7%91%D7%9C%D7%A9%D7%99%D7%9D-2007-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91";
const KIDS_URL =
  "https://sites.google.com/view/hoptamir/%D7%97%D7%A9%D7%99%D7%91%D7%94-%D7%94%D7%9E%D7%A6%D7%90%D7%AA%D7%99%D7%AA-%D7%9C%D7%99%D7%9C%D7%93%D7%99%D7%9D-2008-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91";
const FLUTE_URL =
  "https://sites.google.com/view/hoptamir/%D7%97%D7%9C%D7%99%D7%9C-%D7%94%D7%A7%D7%A1%D7%9D-1994-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const GFORCE_URL =
  "https://sites.google.com/view/hoptamir/%D7%9B%D7%95%D7%97-%D7%92%D7%99-2009-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const READ3_URL =
  "https://sites.google.com/view/hoptamir/%D7%99%D7%A9-%D7%9C%D7%99-%D7%A1%D7%95%D7%93-%D7%90%D7%A0%D7%99-%D7%A7%D7%95%D7%A8%D7%90-%D7%97%D7%9C%D7%A7-3-2000-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91";
const READ2_URL =
  "https://sites.google.com/view/hoptamir/%D7%99%D7%A9-%D7%9C%D7%99-%D7%A1%D7%95%D7%93-%D7%90%D7%A0%D7%99-%D7%A7%D7%95%D7%A8%D7%90-%D7%97%D7%9C%D7%A7-2-2000-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91";
const READ1_URL =
  "https://sites.google.com/view/hoptamir/%D7%99%D7%A9-%D7%9C%D7%99-%D7%A1%D7%95%D7%93-%D7%90%D7%A0%D7%99-%D7%A7%D7%95%D7%A8%D7%90-%D7%97%D7%9C%D7%A7-1-1999-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91";
const MATH_URL =
  "https://sites.google.com/view/hoptamir/%D7%99%D7%A9-%D7%9C%D7%99-%D7%A1%D7%95%D7%93-%D7%90%D7%A0%D7%99-%D7%9C%D7%95%D7%9E%D7%93-%D7%97%D7%A9%D7%91%D7%95%D7%9F-1996-%D7%90%D7%99%D7%A9%D7%99%D7%9D-%D7%9E%D7%A9%D7%97%D7%A7-%D7%9E%D7%97%D7%A9%D7%91";
const YOGI_URL =
  "https://sites.google.com/view/hoptamir/%D7%99%D7%95%D7%92%D7%99-%D7%93%D7%91-2011-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const STREET_URL =
  "https://sites.google.com/view/hoptamir/%D7%A8%D7%97%D7%95%D7%91-%D7%A7%D7%A1%D7%9D-2003-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const RAIN_URL =
  "https://sites.google.com/view/hoptamir/%D7%98%D7%99%D7%A4%D7%AA-%D7%92%D7%A9%D7%9D-2006-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const MONSTERS_URL =
  "https://sites.google.com/view/hoptamir/%D7%92%D7%9F-%D7%94%D7%9E%D7%A4%D7%9C%D7%A6%D7%95%D7%AA-2017-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const SPIES_URL =
  "https://sites.google.com/view/hoptamir/%D7%9C%D7%94%D7%A7%D7%AA-%D7%94%D7%9E%D7%A8%D7%92%D7%9C%D7%99%D7%9D-2026-%D7%90%D7%99%D7%A9%D7%99%D7%9D";
const BANANAS_URL =
  "https://sites.google.com/view/hoptamir/%D7%91%D7%A0%D7%A0%D7%95%D7%AA-%D7%91%D7%A4%D7%99%D7%92%D7%9E%D7%95%D7%AA-1994-2000-%D7%90%D7%99%D7%A9%D7%99%D7%9D";

const DUB_GENRES = ["אנימציה", "ילדים", "מדובב - זר", "פנטזיה"];
const GAME_KEYS = ["ישראלי מדובב לעברית"];

function sameTitle(production: Production, title: string, year: number): boolean {
  return production.year === year && production.title.replace(/\s+/g, " ").trim() === title;
}

const SHOWS: Show[] = [
  show(
    hop(
      "ht-zak-stvrm",
      "זאק סטורם",
      2018,
      "series_dubbed_foreign",
      "גולש צעיר נסחף לשבעת הימים של משולש ברמודה, שם הוא נהייה קפטן של שודדי ים",
      ZAK_URL,
      {
        originalTitle: "Zak Storm",
        channel: "ZOOM",
        runtimeMinutes: 23,
        episodeCount: 39,
        genres: ["אנימציה", "הרפתקאות", "ילדים", "מדובב - זר", "מדע בדיוני", "קומדיה"],
      }
    ),
    [
      { personName: "ראיה מנור", role: "dub_director", heading: "בימוי דיבוב" },
      dub("אורי זלצמן", "זאק סטורם"),
      dub("גדי לוי", "קלברס / אבא של זאק / דמויות שונות"),
      dub("לורן סביר", "קלוביס"),
      dub("עינת אזולאי", "סיסי"),
      dub("עמית רייס", "קרמבה"),
      dub("סער בדישי", "קרוגר"),
      dub("צביקה פורמן", "סקאליבר / גולדן בונז"),
      dub("ראיה מנור"),
      sing("דור סרוגו", "ביצוע שיר פתיחה"),
    ],
    (production) =>
      production.id === "ht-zak-stvrm" || sameTitle(production, "זאק סטורם", 2018)
  ),
  show(
    hop(
      "ht-zabym-mkshphvt",
      "זאבים מכשפות וענקים",
      2002,
      "series_dubbed_foreign",
      "בכל פרק שלושה נבלים שהם מכשפה ענק וזאב מסופרים בכל פעם באגדה אחרת",
      WOLVES_URL,
      {
        episodeCount: 26,
        genres: ["מדובב - זר", "אנימציה", "קומדיה"],
        ishimKeys: ["מבוסס על ספר"],
      }
    ),
    [],
    (production) =>
      production.id === "ht-zabym-mkshphvt" ||
      sameTitle(production, "זאבים מכשפות וענקים", 2002)
  ),
  show(
    hop(
      "ht-tvm-htrktyr",
      "טום הטרקטור",
      2006,
      "series_dubbed_foreign",
      "הפקה מארכיון ערוץ הופ תמיר (2006).",
      TOM_URL,
      { genres: ["ילדים", "מדובב - זר"] }
    ),
    [dub("שרי גדני", "טום")],
    (production) =>
      production.id === "ht-tvm-htrktyr" || sameTitle(production, "טום הטרקטור", 2006)
  ),
  show(
    hop(
      "ht-game-chshybh-hmtzatyt-lkl-hmshpchh",
      "חשיבה המצאתית - לכל המשפחה",
      1999,
      "game_dubbed_foreign",
      "משחק של קומפדיה לפתירת בעיות בשיאות חשיבה המצאתית בהנחייתו של הפרופסור",
      FAM_URL,
      { genres: [...DUB_GENRES, "קומדיה"] }
    ),
    [dub("צביקה פורמן", "הפרופסור / דמויות שונות")],
    (production) => production.id === "ht-game-chshybh-hmtzatyt-lkl-hmshpchh"
  ),
  show(
    hop(
      "ht-game-avmr-vhblshym",
      "עומר והבלשים",
      2007,
      "game_israeli",
      "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2007).",
      OMER_URL,
      { genres: ["משחק מחשב", "ילדים", "חינוכי"] }
    ),
    [],
    (production) => production.id === "ht-game-avmr-vhblshym"
  ),
  show(
    hop(
      "ht-game-chshybh-hmtzatyt-lyldym",
      "חשיבה המצאתית - לילדים",
      2008,
      "game_dubbed_foreign",
      "משחק של קומפדיה לפתירת בעיות בשיאות חשיבה המצאתית בהנחייתו של הפרופסור במסע בזמן אחרי הפושע מיקו",
      KIDS_URL,
      { genres: [...DUB_GENRES, "קומדיה"] }
    ),
    [
      { personName: "אפי בן ישראל", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "ענבר שטגר עזרא", role: "producer", heading: "הפקת דיבוב" },
      dub("צביקה פורמן", "הפרופסור / מלך"),
      dub("עמי מנדלמן", "שוטר / מיקו"),
      dub("לילך עין הבר", "הנסיכה"),
    ],
    (production) => production.id === "ht-game-chshybh-hmtzatyt-lyldym"
  ),
  show(
    hop(
      "ht-chlyl-hksm",
      "חליל הקסם",
      1994,
      "film_dubbed_foreign",
      "סרט זר מדובב מארכיון ערוץ הופ תמיר (1994).",
      FLUTE_URL,
      {
        runtimeMinutes: 52,
        genres: ["אימה", "אנימציה", "הרפתקאות", "ילדים", "מדובב - זר", "מוזיקלי", "פנטזיה"],
      }
    ),
    [
      { personName: "יעקב שם טוב", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "יעקב שם טוב", role: "producer", heading: "הפקת דיבוב" },
      dub("אברי גלעד", "הנסיך תמינו"),
      dub("שירלי שטרן", "הנסיכה פמינה / פיה"),
      dub("שירה גרא", "מלכת הלילה / פיה / דמויות שונות"),
      dub("רונית כץ", "גבירת האגם / פיה / פפגינה"),
      dub("שמחה ברבירו", "גרמבל / מונסטרדוס"),
      dub("שמעון כהן", "פפגינו / סלטרו / דמויות שונות"),
      sing("רונית כץ", "שירה"),
      sing("עמי מנדלמן", "שירה"),
    ],
    (production) =>
      production.id === "ht-chlyl-hksm" || sameTitle(production, "חליל הקסם", 1994)
  ),
  show(
    hop(
      "ht-kvch-gy",
      "כוח ג'י",
      2009,
      "film_dubbed_foreign",
      "שרקנים מיומנים נשלחים למנוע מביליונר מרושע מלהשתלט על העולם",
      GFORCE_URL,
      {
        runtimeMinutes: 90,
        genres: ["אנימציה", "ילדים", "מדובב - זר", "מדע בדיוני", "פנטזיה", "קומדיה"],
      }
    ),
    [
      { personName: "שרון כהן", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "עמיחי בר טוב", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "הדס מוזס", role: "producer", heading: "הפקת דיבוב" },
      dub("עמוס שוב", "דארווין"),
      dub("אמנון וולף", "הארלי"),
      dub("אסף פריינטא", "בלאסטר"),
      dub("הילה מערבי", "חוארז"),
      dub("רובי מוסקוביץ", "ספקלס"),
      dub("צביקה פורמן", "בן"),
      dub("ליז רביאן", "מרסי"),
      dub("שרון כהן", "באקי"),
      dub("אוהד שחר", "לאונרד סייבר"),
      dub("גולן אזולאי", "קיליאן"),
      dub("צביקה שוורצברג", "טריגסטאד"),
      dub("מיכה אוזין סליאן", "קרטר"),
      dub("אוולין הגואל", "רוזליטה"),
      dub("אסף קורמן", "טרל"),
      dub("גל שמי", "קונור גודמן"),
      dub("יהלי מרגלית טופול", "פני גודמן"),
      dub("אברהם סלקטר", "סבא גודמן"),
      dub("יואב לוי", "אבא של ספקלס"),
      dub("מיכל מוכתר", "עכבר לבן"),
      dub("עדי קוזלובסקי", "עכבר שחור / אוול גודמן"),
      dub("יעל בן ארי", "עכבר חום"),
      dub("גדי לוי", "סוכן"),
      dub("שמיל בן ארי", "מנהל ביטחון"),
      dub("מאי רוזנר", "ילדה"),
      dub("ג'קי שרגא", "קולות רקע"),
      dub("יובל ינאי", "קולות רקע"),
    ],
    (production) =>
      production.id === "ht-kvch-gy" || sameTitle(production, "כוח ג'י", 2009)
  ),
  show(
    hop(
      "ht-game-ysh-ly-svd-any-kvra-chlk-3",
      "יש לי סוד - אני קורא - חלק 3",
      2000,
      "game_israeli",
      "אלפי ציפי ושוואנא מלמדים את הילדים לקרוא",
      READ3_URL,
      { genres: DUB_GENRES, ishimKeys: GAME_KEYS }
    ),
    [
      act("לונה יקר", "ציפי / קריינית (קול)"),
      act("חנוך רעים", "אלפי / שוואנא / קריין / רובי (קול)"),
      sing("רותי הולצמן", "זשיר פתיחה (ביצוע)"),
    ],
    (production) => production.id === "ht-game-ysh-ly-svd-any-kvra-chlk-3"
  ),
  show(
    hop(
      "ht-game-ysh-ly-svd-any-kvra-chlk-2",
      "יש לי סוד - אני קורא - חלק 2",
      2000,
      "game_israeli",
      "אלפי ציפי ושוואנא מלמדים את הילדים לקרוא",
      READ2_URL,
      { genres: DUB_GENRES, ishimKeys: GAME_KEYS }
    ),
    [
      act("לונה יקר", "ציפי / קריינית (קול)"),
      act("חנוך רעים", "אלפי / שוואנא / קריין / רובי (קול)"),
      sing("רותי הולצמן", "זשיר פתיחה (ביצוע)"),
    ],
    (production) => production.id === "ht-game-ysh-ly-svd-any-kvra-chlk-2"
  ),
  show(
    hop(
      "ht-game-ysh-ly-svd-any-kvra-chlk-1",
      "יש לי סוד - אני קורא - חלק 1",
      1999,
      "game_israeli",
      "אלפי ציפי ושוואנא מלמדים את הילדים לקרוא",
      READ1_URL,
      { genres: DUB_GENRES, ishimKeys: GAME_KEYS }
    ),
    [
      act("יואב בר לב", "אלפי (קול)"),
      act("לונה יקר", "ציפי / קריינית (קול)"),
      act("חנוך רעים", "שוואנא / קריין / רובי (קול)"),
      sing("רותי הולצמן", "זשיר פתיחה (ביצוע)"),
    ],
    (production) => production.id === "ht-game-ysh-ly-svd-any-kvra-chlk-1"
  ),
  show(
    hop(
      "ht-game-ysh-ly-svd-any-lvmd-chshbvn",
      "יש לי סוד - אני לומד חשבון",
      1996,
      "game_israeli",
      "מרלין הקוסם מלמד חשבון בעולם האגדות",
      MATH_URL,
      { genres: DUB_GENRES, ishimKeys: GAME_KEYS }
    ),
    [
      act("איציק סיידוף", "מרלין הקוסם / גמד / קריינות (קול)"),
      act("סיון שביט", "זהבה / מכשפה / גורדולינה / דובון / תרנגולות / ארנבת (קול)"),
      act("עירית ענבי", "כיפה אדומה / אמא דובה / גמד / סבתא / ציפור טרילולה (קול)"),
      act("גיל אלון", "אבא דב / צייד / זאב / גמד / דמויות שונות (קול)"),
    ],
    (production) => production.id === "ht-game-ysh-ly-svd-any-lvmd-chshbvn"
  ),
  show(
    hop(
      "ht-yvgy-db-2011",
      "יוגי דב",
      2011,
      "film_dubbed_foreign",
      "יוגי הדב ועוזרו בובו משתפים פעולה עם יריבם השומר סמית' וצלמת כדי להציל את פארק ג'ליסטון מסכנת סגירה",
      YOGI_URL,
      {
        runtimeMinutes: 82,
        genres: [
          "אנימציה",
          "הרפתקאות",
          "ילדים",
          "מדובב - זר",
          "מדע בדיוני",
          "פנטזיה",
          "פעולה",
          "קומדיה",
        ],
        ishimNotes: [
          {
            heading: "מאחורי הקלעים",
            items: [
              "בטריילר המדובב, דיבבו עמי מנדלמן את יוגי דב, לירון לב את בובו גדי לוי את השומר סמית' ו צביקה שוורצברג את הקריינות, הטריילר דובב באולפני וידאופילם אינרנשיונל, בעוד אולפני אלרום נבחרו לדבב את הסרט",
            ],
          },
        ],
      }
    ),
    [
      { personName: "עמיחי בר טוב", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "הדס מוזס", role: "producer", heading: "הפקת דיבוב" },
      dub("אוהד שחר", "יוגי דב"),
      dub("אסף קורמן", "בובו"),
      dub("מולי שולמן", "השומר סמית'"),
      dub("דקלה הדר", "רייצ'ל"),
      dub("אמנון וולף", "השומר ג'ונס"),
      dub("צביקה פורמן", "ראש העיר בראון"),
      dub("ערן מור", "עוזר ראש העיר"),
      dub("יורם יוספסברג", "קריינות"),
      dub("אלברט כהן", "קולות רקע"),
      dub("אביטל אברג'ל", "קולות רקע"),
      dub("יובל ינאי", "קולות רקע"),
      dub("מייה קדוש", "קולות רקע"),
    ],
    (production) =>
      production.id === "ht-yvgy-db-2011" || sameTitle(production, "יוגי דב", 2011)
  ),
  show(
    hop(
      "ht-rchvb-ksm",
      "רחוב קסם",
      2003,
      "series_dubbed_foreign",
      "סדרה להקניית ערכים חברתיים בה הרמזורים והמכוניות מואנשים",
      STREET_URL,
      {
        originalTitle: "Dream Street",
        channel: "הופ!",
        runtimeMinutes: 10,
        genres: ["חינוכי", "ילדים", "מדובב - זר"],
      }
    ),
    [
      { personName: "ניקו בר", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "ניקו בר", role: "producer", heading: "הפקת דיבוב" },
      dub("ניקו בר", "ג'ק המתקתק / שוטר מנמנם / מספר"),
      dub("יעקב בוך", "רובוט / רודני / שוטר מנמנם"),
      dub("טליה גיחון", "גררי"),
      dub("הילה זינגר נאור", "השוטרת דייזי / חלבני"),
    ],
    (production) =>
      production.id === "ht-rchvb-ksm" || sameTitle(production, "רחוב קסם", 2003)
  ),
  show(
    hop(
      "ht-typt-gshm",
      "טיפת גשם",
      2006,
      "series_dubbed_foreign",
      "תוכנית ללימוד שמירה על המים",
      RAIN_URL,
      {
        originalTitle: "Raindrop, Water is Adventure / Narigota, la aventura del agua",
        channel: "חינוכית",
        runtimeMinutes: 24,
        genres: ["אנימציה", "הרפתקאות", "חינוכי", "ילדים", "מדובב - זר", "מוזיקלי", "פנטזיה"],
        ishimNotes: [{ heading: "כללי", items: ["קיים עוד טיפת גשם"] }],
      }
    ),
    [
      { personName: "ניקו בר", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "אורית יואלי סנה", role: "producer", heading: "הפקת דיבוב" },
      dub("עידו מוסרי", "טל"),
      dub("יעקב בוך", "נימבוס / דמויות שונות"),
      dub("שרון שחל", "קרחוני"),
      dub("ניקו בר", "שפעת / קריין / דמויות שונות"),
      dub("שמעון כהן", "שטותי / דמויות שונות"),
      dub("שמוליק טנא", "דמויות שונות"),
      dub("שירי נדב", "דמויות שונות"),
      sing("קלייר בן דוד בלכר", "ביצוע שיר פתיחה"),
      sing("שרון שחל", "ביצוע שיר פתיחה"),
      {
        personName: "עידו מוסרי",
        role: "composer",
        heading: "מוזיקה",
        character: "ליווי וניהול מוזיקלי לשיר פתיחה",
      },
      sing("שמוליק טנא", "ליווי לשיר פתיחה"),
      sing("ניקו בר"),
    ],
    (production) =>
      production.id === "ht-typt-gshm" || sameTitle(production, "טיפת גשם", 2006)
  ),
  show(
    hop(
      "ht-gn-hmpltsvvt",
      "גן המפלצות",
      2017,
      "tv_series",
      "כל מפלצת בגן שרה את האופי שלה.",
      MONSTERS_URL,
      {
        channel: "הופ!",
        runtimeMinutes: 1,
        episodeCount: 6,
        genres: ["אנימציה", "ילדים", "קומדיה"],
        ishimKeys: GAME_KEYS,
      }
    ),
    [
      {
        personName: "לאה ברקוביץ-יושע",
        role: "director",
        heading: "בימוי",
        character: "בימוי אנימציה",
      },
      {
        personName: "שרון כהן",
        role: "dub_director",
        heading: "בימוי",
        character: "בימוי קולות ושירים",
      },
      sing("שמעון סמיט", "שנאני (שירה)"),
      sing("שרון כהן", "חייכני (שירה)"),
      sing("אסף פריינטא", "קדמוני (שירה)"),
      sing("גלעד קלטר", "מוג לבי (שירה)"),
      sing("דן קיזלר", "אף על פי (שירה)"),
      sing("אורית שלום", "מפלצת הבוץ (שירה)"),
      { personName: "אפרים סידון", role: "writer", heading: "מוזיקה", character: "מילים לשירים" },
      { personName: "אורי קליאן", role: "composer", heading: "מוזיקה", character: "לחן לשירים" },
    ],
    (production) =>
      production.id === "ht-gn-hmpltsvvt" || sameTitle(production, "גן המפלצות", 2017)
  ),
  show(
    hop(
      "ht-lhqt-hmrglym",
      "להקת המרגלים",
      2026,
      "series_dubbed_foreign",
      "להקה מפורסמת בעלת כלי נגינה שהופכים לכלי רכב מנסים לפתור תעלומות.",
      SPIES_URL,
      {
        originalTitle: "Fresh Beat Band of Spies",
        airStatus: "upcoming",
        channel: "ניק ג'וניור",
        runtimeMinutes: 23,
        genres: [
          "אנימציה",
          "הרפתקאות",
          "חינוכי",
          "ילדים",
          "מדובב - זר",
          "מוזיקלי",
          "פנטזיה",
          "קומדיה",
        ],
      }
    ),
    [
      { personName: "תמיר סופר", role: "dub_director", heading: "בימוי דיבוב" },
      { personName: "תומר קאופמן", role: "producer", heading: "הפקת דיבוב" },
      { personName: "ספיר רון ארגמן", role: "producer", heading: "הפקת דיבוב" },
      dub("דניאל מגון", "טוויסט"),
      dub("יהונתן מגון", "שאווד"),
      dub("ספיר דרמון", "קיקי"),
      dub("נעמה אוזן", "מרינה"),
      dub("סער בן יוסף", "הנציב גולדסטאר"),
      dub("דורון בן עמי", "ריד"),
      dub("מני צוקרל", "דמויות שונות"),
      dub("יובל שם טוב", "דמויות שונות"),
      dub("טליה ברקאי", "דמויות שונות"),
      dub("מאי יעקובסון", "דמויות שונות"),
      dub("חיים אוסדון", "דמויות שונות"),
      dub("פאר דנוך", "דמויות שונות"),
      dub("מיכל ויצמן", "דמויות שונות"),
      dub("לירון לב", "דמויות שונות"),
      dub("דן שצברג", "דמויות שונות"),
      dub("רועי עוז", "דמויות שונות"),
      dub("דור סרוגו", "דמויות שונות"),
      dub("נאיה פדרמן", "דמויות שונות"),
      dub("אליענה מגון", "דמויות שונות"),
      dub("בר סביר", "דמויות שונות"),
      dub("קובי ליקורמן", "דמויות שונות"),
      dub("דנה פרידר", "דמויות שונות"),
      dub("אורנה כץ", "דמויות שונות"),
      dub("שראל פיטרמן", "דמויות שונות"),
      dub("שרון שחל", "דמויות שונות"),
      dub("נועה קשפיצקי", "דמויות שונות"),
      dub("גיא קשפיצקי", "דמויות שונות"),
      dub("שירה נאור", "דמויות שונות"),
      dub("תמיר סופר", "דמויות שונות"),
    ],
    (production) =>
      production.id === "ht-lhqt-hmrglym" || sameTitle(production, "להקת המרגלים", 2026)
  ),
  show(
    hop(
      "ht-bnnvt-bpygmvvt",
      "בננות בפיג'מות",
      1994,
      "series_dubbed_foreign",
      "צמד בננות אנושיות הלבושות בפיג'מות, שלושה דובי צעצוע וחולדה בתוכנית חינוכית לילדי הגן והכיתות הנמוכות",
      BANANAS_URL,
      {
        originalTitle: "Bananas in Pyjamas",
        endYear: 2000,
        channel: "חינוכית",
        runtimeMinutes: 10,
        episodeCount: 299,
        genres: ["חינוכי", "ילדים", "מדובב - זר"],
        ishimKeys: ["בובות"],
        ishimNotes: [{ heading: "כללי", items: ["קיים עוד בננות בפיג'מות"] }],
      }
    ),
    [
      { personName: "חנה דרורי קשי", role: "dub_director", heading: "בימוי דיבוב" },
      {
        personName: "אורית יואלי סנה",
        role: "producer",
        heading: "הפקת דיבוב",
        character: "[1995-2000]",
      },
      dub("חסיה ורטהיים", "בנני [1994]"),
      dub("ירון דגן", "בנני [1995-1998]"),
      dub("דורון בן עמי", "בנני [2000]"),
      dub("יונתן השילוני", "בנון [1994-1998]"),
      dub("עמרי דגן", "בנון [2000]"),
      dub("לירון זייד", "בנון [2000]"),
      dub("דניאל מגון", "מולי / לילי"),
      dub("אורלי קטן", "אפי"),
      dub("אור אזולאי", "קריינית / מר עכברוש"),
      dub("רותי הולצמן", "קריין (פרק 1) [1994]", "מדבבים אורחים"),
      sing("קובי ליבר", "שיר פתיחה (ביצוע)"),
      { personName: "חני נחמיאס", role: "writer", heading: "מוזיקה", character: "שיר פתיחה (תרגום)" },
      {
        personName: "שמרית אור",
        role: "composer",
        heading: "מוזיקה",
        character: "שיר פתיחה (ניהול מוזיקלי)",
      },
      sing("אהרון פררה"),
    ],
    (production) =>
      production.id === "ht-bnnvt-bpygmvvt" ||
      sameTitle(production, "בננות בפיג'מות", 1994)
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

/** ליהוקי הופ תמיר מנובמבר 2026: סדרות, סרטים ומשחקים. מעדכן ערך קיים או מוסיף חדש. */
export function applyIshimHopCastNov11(data: ArchiveData): ArchiveData {
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
