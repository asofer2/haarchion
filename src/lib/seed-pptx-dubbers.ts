import type { Credit, Person, Production } from "./types";
import { portrait } from "./portrait";

/**
 * Import from מצגת «מדבבים ישראלים.pptx» (Desktop):
 * - names missing from archive (slides 1–7)
 * - משטרת האגדות cast (slide 8) + character credits from Hebrew Wikipedia
 * Deceased list (slides 9–10) is in seed-deceased-dubbers.ts
 */
const now = "2026-07-28T22:00:00.000Z";

function p(
  id: string,
  name: string,
  bio = "מדבב/ת ישראלי/ת — לפי מצגת «מדבבים ישראלים»."
): Person {
  return {
    id,
    name,
    nicknames: [],
    tags: ["דיבוב", "מצגת מדבבים"],
    activities: ["dubbing", "series", "film"],
    bio,
    imageUrl: portrait(name),
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
  return characterName
    ? { personId, productionId, role, characterName }
    : { personId, productionId, role };
}

/** People named in the PPTX (or Wikipedia cast for משטרת האגדות) who were missing */
export const PPTX_DUBBERS_PEOPLE: Person[] = [
  p("tmyr-svpr", "תמיר סופר"),
  p("avrly-tgr", "אורלי תגר"),
  p("namh-avzn", "נעמה אוזן"),
  p("yakb-bvk", "יעקב בוך"),
  p("chnn-rvzn", "חנן רוזן"),
  p("chyym-avsdvn", "חיים אוסדון"),
  p("mny-tsvkrl", "מני צוקרל"),
  p("yvbl-shm-tvb", "יובל שם טוב"),
  p("ynvn-khn", "ינון כהן"),
  p("myrvn-ahrvnvbyts", "מירון אהרונוביץ'"),
  p("ypat-zndny-tspryr", "יפעת זנדני צפריר"),
  p("sar-bn-yvsf", "סער בן יוסף"),
  // Wikipedia Hebrew cast for משטרת האגדות (not named on PPTX slide 8, but reliable cast)
  p("ady-vyys", "עדי וייס", "מדבב/ת ישראלי/ת — לפי דיבוב «משטרת האגדות» בוויקיפדיה."),
  p("aytmr-nmrvd", "איתמר נמרוד", "מדבב/ת ישראלי/ת — לפי דיבוב «משטרת האגדות» בוויקיפדיה."),
  p("abyad-bntvb", "אביעד בנטוב", "מדבב/ת ישראלי/ת — לפי דיבוב «משטרת האגדות» בוויקיפדיה."),
  p("ygal-zks", "יגאל זקס", "מדבב/ת ישראלי/ת — לפי דיבוב «משטרת האגדות» בוויקיפדיה."),
  p("yvab-namn", "יואב נאמן", "מדבב/ת ישראלי/ת — לפי דיבוב «משטרת האגדות» בוויקיפדיה."),
  p("namh-lys", "נעמה ליס", "מפיקת דיבוב — לפי דיבוב «משטרת האגדות» בוויקיפדיה."),
];

export const PPTX_DUBBERS_PRODUCTIONS: Production[] = [
  {
    id: "mshtrt-hagdvt",
    title: "משטרת האגדות",
    year: 2005,
    kind: "series",
    summary:
      "סדרת אנימציה אוסטרלית־ישראלית לילדים (Fairy Tale Police Department). שודרה בישראל בערוץ הילדים / ג׳וניור החל מ־2005. ערך לפי מצגת «מדבבים ישראלים» וויקיפדיה.",
    genres: ["אנימציה", "ילדים", "דיבוב", "קומדיה"],
    originalTitle: "Fairy Tale Police Department",
    channel: "ערוץ הילדים / ג'וניור",
    studio: "Yoram Gross / E.M.TV",
    imageUrl: portrait("משטרת האגדות", "Fairy Tale Police Department"),
    createdAt: now,
    updatedAt: now,
  },
];

/**
 * Credits for משטרת האגדות.
 * Character names from Hebrew Wikipedia where available;
 * other names from PPTX slide «מדבבים של משטרת האגדות» as guest dubbers.
 */
export const PPTX_DUBBERS_CREDITS: Credit[] = [
  // Staff (Wikipedia)
  c("amvs-shvb", "mshtrt-hagdvt", "dub_director", "בימוי דיבוב"),
  c("namh-lys", "mshtrt-hagdvt", "producer", "הפקת דיבוב"),
  c("tsvika-furman", "mshtrt-hagdvt", "singer", "ביצוע שיר פתיחה"),

  // Main cast (Wikipedia characters)
  c("amvs-shvb", "mshtrt-hagdvt", "dubber", "ג'וני פנטזיה"),
  c("shrvn-shchl", "mshtrt-hagdvt", "dubber", "כריס אנדרסון"),
  c("ady-vyys", "mshtrt-hagdvt", "dubber", "הצ'יף / המספר"),
  c("gavlh-nvny", "mshtrt-hagdvt", "dubber", "וונדה הפיה"),
  c("sar-bn-yvsf", "mshtrt-hagdvt", "dubber", "פינוקיו"),
  c("aytmr-nmrvd", "mshtrt-hagdvt", "dubber", "קלוד הצפרדע"),

  // Wikipedia guest list
  c("orna-katz", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("abyad-bntvb", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("ygal-zks", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("dudu-zar", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("lymvr-shpyra", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("yvab-namn", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("yael-ben-aryeh", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("tsvika-furman", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("aprvn-atkyn", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("shryt-sry", "mshtrt-hagdvt", "dubber", "דמויות שונות"),

  // Additional names from PPTX slide 8 (no character specified)
  c("ddy-zhr", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("gilad-kelter", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("tmyr-svpr", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("orly-katan", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("ami-mandelman", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("liron-lev", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("aly-lvlay", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("gyvra-knt", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("ido-mosseri", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("rvbrt-hnyg", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("lyrvn-brns", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("shy-zvrnytsr", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("ypat-zndny-tspryr", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
  c("chyym-adn", "mshtrt-hagdvt", "dubber", "דמויות שונות"),
];
