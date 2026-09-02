import type { Credit, Production } from "./types";
import { portrait } from "./portrait";

/** משחקי מחשב מארכיון ערוץ הופ תמיר — https://sites.google.com/view/hoptamir */
const now = "2026-08-21T12:00:00.000Z";

function game(
  id: string,
  title: string,
  year: number,
  summary: string,
  extra: Partial<Production> = {}
): Production {
  return {
    id,
    title,
    year,
    kind: extra.kind || "game_israeli",
    summary,
    genres: extra.genres || ["משחק מחשב", "ילדים", "חינוכי"],
    originalTitle: extra.originalTitle,
    endYear: extra.endYear,
    channel: extra.channel || "הופ תמיר",
    studio: extra.studio,
    imageUrl: extra.imageUrl || portrait(title),
    createdAt: now,
    updatedAt: now,
  };
}

export const HOP_TAMIR_GAMES: Production[] = [
  game("ht-game-aytmr-mtyyl-al-hkyrvt", "איתמר מטייל על הקירות", 1992, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1992)."),
  game("ht-game-gvrdy-bgn-hplaym", "גורדי בגן הפלאים", 1993, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1993)."),
  game("ht-game-mshchk-havnvt", "משחק העונות", 1994, "הצטרפו למשחק העונות של מולי הילדה ולמדו על עונות השנה ומה יש בהן. משחק מחשב חינוכי ישראלי מארכיון הופ תמיר.", { genres: ["משחק מחשב","ילדים","חינוכי"] }),
  game("ht-game-ba-bchshbvn", "בא בחשבון", 1995, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1995)."),
  game("ht-game-ysh-ly-svd-any-lvmd-chshbvn", "יש לי סוד - אני לומד חשבון", 1996, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1996)."),
  game("ht-game-bastr-vapvn-hpla", "באסטר ואפון הפלא", 1997, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1997)."),
  game("ht-game-gvrdy-bhrptkh-mhsrtym", "גורדי בהרפתקה מהסרטים", 1997, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1997)."),
  game("ht-game-hpntr-hvvrvd-mshymh-bynlavmyt", "הפנתר הוורוד - משימה בינלאומית", 1997, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1997)."),
  game("ht-game-aytmr-tzyyd-hchlvmvt", "איתמר צייד החלומות", 1998, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1998)."),
  game("ht-game-bakbvt-hmylym-habvdvt", "בעקבות המילים האבודות", 1998, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1998)."),
  game("ht-game-hpntr-hvvrvd-hvkvs-pvkvs", "הפנתר הוורוד - הוקוס פוקוס", 1998, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1998)."),
  game("ht-game-krb-bchshbvn", "קרב בחשבון", 1998, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1998)."),
  game("ht-game-g-vlyh-gvlsht-bzmn-talvmh-bpryz", "ג'וליה גולשת בזמן - תעלומה בפריז", 1999, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1999)."),
  game("ht-game-g-vlyh-yldy-hprchym", "ג'וליה ילדי הפרחים", 1999, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1999)."),
  game("ht-game-chshybh-hmtzatyt-lkl-hmshpchh", "חשיבה המצאתית - לכל המשפחה", 1999, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1999)."),
  game("ht-game-ysh-ly-svd-any-kvra-chlk-1", "יש לי סוד - אני קורא - חלק 1", 1999, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1999)."),
  game("ht-game-pypvsh", "פיפוש", 1999, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (1999)."),
  game("ht-game-ysh-ly-svd-any-kvra-chlk-2", "יש לי סוד - אני קורא - חלק 2", 2000, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2000)."),
  game("ht-game-ysh-ly-svd-any-kvra-chlk-3", "יש לי סוד - אני קורא - חלק 3", 2000, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2000)."),
  game("ht-game-pypvsh-2", "פיפוש 2", 2000, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2000)."),
  game("ht-game-gvgv-pchvt-av-yvtr", "גוגו - פחות או יותר", 2002, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2002)."),
  game("ht-game-gvgv-mchpsh-at-shlvmpy", "גוגו מחפש את שלומפי", 2002, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2002)."),
  game("ht-game-aytmr-mtzyl-at-hym", "איתמר מציל את הים", 2003, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2003)."),
  game("ht-game-atr-hyldym-hagvdh-lmlchmh-bsrtn", "אתר הילדים - האגודה למלחמה בסרטן", 2003, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2003)."),
  game("ht-game-gvrdy-vaytmr-bavlm-hmda", "גורדי ואיתמר בעולם המדע", 2004, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2004)."),
  game("ht-game-hatr-shl-alpy", "האתר של אלפי", 2004, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2004)."),
  game("ht-game-chvshbym-bgdvl", "חושבים בגדול", 2004, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2004)."),
  game("ht-game-yvm-hvldt-laytmr", "יום הולדת לאיתמר", 2004, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2004)."),
  game("ht-game-msahvp", "מסעהופ", 2004, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2004)."),
  game("ht-game-mshly-ayzvpvs-htzb-vharnb", "משלי איזופוס - הצב והארנב", 2004, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2004)."),
  game("ht-game-hvp-shlmh-hmlk-vhdbvrh-agdvt-yshral", "הופ - שלמה המלך והדבורה - אגדות ישראל", 2005, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2005)."),
  game("ht-game-hrptkavt-aytmr-bspary", "הרפתקאות איתמר בספארי", 2005, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2005)."),
  game("ht-game-hsvd-shl-myh", "הסוד של מיה", 2006, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2006)."),
  game("ht-game-avmr-vhblshym", "עומר והבלשים", 2007, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2007)."),
  game("ht-game-aytmr-vsvdvt-hkvsmym", "איתמר וסודות הקוסמים", 2008, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2008)."),
  game("ht-game-chshybh-hmtzatyt-lyldym", "חשיבה המצאתית - לילדים", 2008, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2008)."),
  game("ht-game-hrptkavt-bmbh-bmmlkh-hksvmh", "הרפתקאות במבה בממלכה הקסומה", 2009, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2009)."),
  game("ht-game-artvr", "ארתור", 2010, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2010)."),
  game("ht-game-msa-byn-msprym", "מסע בין מספרים", 2013, "משחק מחשב ישראלי מארכיון ערוץ הופ תמיר (2013)."),
];

/** קרדיטים מדפי הופ תמיר (כשיש במקור) */
export const HOP_TAMIR_GAME_CREDITS: Credit[] = [
  { personId: "ayryt-anby", productionId: "ht-game-mshchk-havnvt", role: "dubber", characterName: "מולי (קול)" },
  { personId: "avhd-shchr", productionId: "ht-game-mshchk-havnvt", role: "dubber", characterName: "קריין" },
];
