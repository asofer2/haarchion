/**
 * Patch PERSON_DATES + PERSON_WIKI_ENRICHMENT for deceased PPTX dubbers
 * using curated Wikipedia extracts (no live fetch — avoids rate limits).
 */
import fs from "fs";
import path from "path";
import { PERSON_DATES } from "../src/lib/seed-dates";
import { PERSON_WIKI_ENRICHMENT } from "../src/lib/seed-wiki-enrichment";

type Dates = { birthDate?: string; deathDate?: string };
type Enrich = { bio?: string; wikipediaUrl?: string };

const DATES: Record<string, Dates> = {
  "shlmh-br-shbyt": { birthDate: "1928-12-07", deathDate: "2019-09-08" },
  "yvsy-ydyn": { birthDate: "1920-06-01", deathDate: "2001-05-17" },
  "rvzynh-kmbvs": { birthDate: "1951-12-17", deathDate: "2012-12-04" },
  "gavlh-nvny": { birthDate: "1942-06-09", deathDate: "2014-11-10" },
  "gdavn-shmr": { birthDate: "1928-05-24", deathDate: "2008-02-21" },
  "amnvn-mskyn": { birthDate: "1934-10-05", deathDate: "2015-03-22" },
  "nchmh-hndl": { birthDate: "1936-08-22", deathDate: "1998-09-30" },
  "dn-tvrn": { birthDate: "1960-10-17", deathDate: "2024-05-29" },
  "azra-hs": { birthDate: "1933-11-04", deathDate: "2010-10-03" },
  // דידי גת / גלעד ויטל / רות פרחי — dates filled if known from existing or left for wiki later
};

const BIOS: Record<string, Enrich> = {
  "shlmh-br-shbyt": {
    bio: "שלמה (שלוימל'ה) בר-שביט (במקור: פרידמן; 7 בדצמבר 1928 – 8 בספטמבר 2019) היה שחקן תיאטרון וקולנוע, מדבב, במאי ומנהל ישראלי, מגדולי השחקנים של תיאטרון הבימה.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/שלמה_בר-שביט",
  },
  "yvsy-ydyn": {
    bio: "יוסף (יוסי) ידין היה שחקן תיאטרון וקולנוע ומדבב ישראלי, מבכירי השחקנים של התיאטרון הקאמרי. חתן פרס ישראל לתיאטרון (1991) וחתן פרס התיאטרון הישראלי על מפעל חיים (1996).",
    wikipediaUrl: "https://he.wikipedia.org/wiki/יוסף_ידין",
  },
  "rvzynh-kmbvs": {
    bio: "רוזינה קמבוס הייתה שחקנית תיאטרון, קולנוע וטלוויזיה ישראלית, זוכת פרס אופיר ופרס התיאטרון הישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/רוזינה_קמבוס",
  },
  "gavlh-nvny": {
    bio: "גאולה נוני הייתה שחקנית, מדבבת וזמרת ישראלית. שימשה חברת הוועד של האקדמיה הישראלית לקולנוע ונציגת אגודת אמני ישראל.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/גאולה_נוני",
  },
  "gdavn-shmr": {
    bio: "גדעון שמר היה שחקן, במאי, מפיק, מדבב וקריין ישראלי. חתן פרס מסקין ופרס שייבר לתיאטרון.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/גדעון_שמר",
  },
  "amnvn-mskyn": {
    bio: "אמנון מסקין היה שחקן, במאי תיאטרון, מורה למשחק ומדבב ישראלי. מנהלו האמנותי של תיאטרון חיפה בשנים 1977–1981.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/אמנון_מסקין",
  },
  "nchmh-hndl": {
    bio: "נחמה (הלנה) הנדל הייתה זמרת, גיטריסטית, מלחינה, שחקנית ובדרנית ישראלית. מהזמרות הידועות בזמר העברי בשנות החמישים והשישים.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/נחמה_הנדל",
  },
  "dn-tvrn": {
    bio: "דן תורן היה זמר-יוצר, פזמונאי, מדבב, מנחה טלוויזיה, שדרן רדיו, קריין ושחקן ישראלי. זוכה «פרס אקו״ם».",
    wikipediaUrl: "https://he.wikipedia.org/wiki/דן_תורן",
  },
  "azra-hs": {
    bio: "עזרא הס היה קריין ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/עזרא_הס",
  },
  "dydy-gt": {
    bio: "דידי גת היה שחקן, מדבב וזמר ישראלי, שיחק בתפקידים שונים בתיאטרון, בקולנוע, בסדרות טלוויזיה ובפרסומות.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/דידי_גת",
  },
  "glad-vytl": {
    bio: "גלעד ויטל שמעון היה זמר, פזמונאי, מלחין ומפיק מוזיקלי ישראלי ממקימי להקת «שוטי הנבואה» וחבר ההרכבים «פשוטי העם» ו«שמעון ולוי».",
    wikipediaUrl: "https://he.wikipedia.org/wiki/גלעד_ויטל_שמעון",
  },
  "rvt-prchy": {
    bio: "רות פרחי הייתה שחקנית ומדבבת ישראלית.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/רות_פרחי",
  },
  "shrvn-bvrgavkr": {
    bio: "שרון בורגאוקר הייתה מדבבת ישראלית (ז״ל). מופיעה ברשימת «מדבבים ישראלים שנפטרו».",
  },
  "avraham-mor": {
    bio: "אברהם מור היה שחקן ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/אברהם_מור",
  },
  "aryal-pvrmn": {
    bio: "אריאל פורמן היה שחקן ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/אריאל_פורמן",
  },
  "chyym-tvpvl": {
    bio: "חיים טופול היה שחקן תיאטרון וקולנוע ישראלי בעל שם עולמי, זוכה פרס ישראל ומועמד לאוסקר. דיבב גם בהפקות עבריות.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/חיים_טופול",
  },
  "sefi-rivlin": {
    bio: "יוסף (ספי) ריבלין (1947–2013) היה שחקן וקומיקאי ישראלי, מדבב וכוכב במה וטלוויזיה.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/ספי_ריבלין",
  },
  "yoni-chen": {
    bio: "יוני חן (נולד יונתן חנונו; 1953–1995) היה שחקן, במאי ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/יוני_חן",
  },
  "rama-messinger": {
    bio: "רמה מסינגר הייתה שחקנית, זמרת ומדבבת ישראלית. כיכבה במחזמרים ובדיבוב עברי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/רמה_מסינגר",
  },
  "yvbl-zmyr": {
    bio: "יובל זמיר (1963–2011) היה שחקן תיאטרון וקולנוע, מדבב, במאי וזמר אופרה ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/יובל_זמיר",
  },
  "debi-beserglik": {
    bio: "דבורה (דבי) בסרגליק הייתה שחקנית, מחזאית ומדבבת ישראלית.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/דבי_בסרגליק",
  },
  "dvdyk-smdr": {
    bio: "דודיק סמדר היה שחקן ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/דודיק_סמדר",
  },
  "ravbn-shpr": {
    bio: "ראובן (רובק'ה) שפר היה שחקן ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/ראובן_שפר",
  },
  "yvsy-grbr": {
    bio: "יוסי גרבר היה שחקן תיאטרון וקולנוע ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/יוסי_גרבר",
  },
  "yhvdh-aprvny": {
    bio: "יהודה אפרוני היה שחקן ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/יהודה_אפרוני",
  },
  "ady-lb": {
    bio: "עדי לב הייתה שחקנית ומדבבת ישראלית.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/עדי_לב",
  },
  "amvs-shvb": {
    bio: "עמוס שוב היה שחקן ומדבב ישראלי, בין השאר ביים ודיבב ב«משטרת האגדות».",
    wikipediaUrl: "https://he.wikipedia.org/wiki/עמוס_שוב",
  },
  "nvryt-khn": {
    bio: "נורית כהן הייתה שחקנית ומדבבת ישראלית.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/נורית_כהן",
  },
  "rchl-atas": {
    bio: "רחל אטאס הייתה שחקנית ומדבבת ישראלית.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/רחל_אטאס",
  },
  "avry-lvy-shchkn": {
    bio: "אורי לוי היה שחקן תיאטרון וקולנוע ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/אורי_לוי_(שחקן)",
  },
  "aryh-mvskvnh": {
    bio: "אריה מוסקונה היה שחקן ומדבב ישראלי.",
    wikipediaUrl: "https://he.wikipedia.org/wiki/אריה_מוסקונה",
  },
};

function formatDates(map: Record<string, Dates>): string {
  const lines = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, d]) => d.birthDate || d.deathDate)
    .map(([id, d]) => {
      const parts = [
        d.birthDate ? `birthDate: "${d.birthDate}"` : null,
        d.deathDate ? `deathDate: "${d.deathDate}"` : null,
      ].filter(Boolean);
      return `  "${id}": { ${parts.join(", ")} },`;
    })
    .join("\n");
  return `/** Birth/death dates from Wikidata/Wikipedia (+ curated fills) */
export const PERSON_DATES: Record<
  string,
  { birthDate?: string; deathDate?: string }
> = {
${lines}
};
`;
}

function formatBios(map: Record<string, Enrich>): string {
  const lines = Object.entries(map)
    .filter(([, e]) => e.bio || e.wikipediaUrl)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, e]) => {
      const parts = [
        e.bio ? `bio: ${JSON.stringify(e.bio)}` : null,
        e.wikipediaUrl ? `wikipediaUrl: ${JSON.stringify(e.wikipediaUrl)}` : null,
      ].filter(Boolean);
      return `  "${id}": { ${parts.join(", ")} },`;
    })
    .join("\n");
  return `/** Wikipedia extracts for people (bios + links) */
export const PERSON_WIKI_ENRICHMENT: Record<
  string,
  { bio?: string; wikipediaUrl?: string }
> = {
${lines}
};
`;
}

const dates = { ...PERSON_DATES };
for (const [id, d] of Object.entries(DATES)) {
  dates[id] = {
    birthDate: d.birthDate || dates[id]?.birthDate,
    deathDate: d.deathDate || dates[id]?.deathDate,
  };
}

const enrich = { ...PERSON_WIKI_ENRICHMENT };
for (const [id, e] of Object.entries(BIOS)) {
  const prev = enrich[id];
  const preferNew =
    !prev?.bio ||
    /לפי קטגוריית מדבבים|לפי רשימת|היה\/הייתה מדבב/.test(prev.bio) ||
    (e.bio && e.bio.length >= (prev.bio?.length || 0));
  enrich[id] = {
    bio: preferNew ? e.bio || prev?.bio : prev?.bio || e.bio,
    wikipediaUrl: e.wikipediaUrl || prev?.wikipediaUrl,
  };
}

fs.writeFileSync(path.join(__dirname, "../src/lib/seed-dates.ts"), formatDates(dates), "utf8");
fs.writeFileSync(path.join(__dirname, "../src/lib/seed-wiki-enrichment.ts"), formatBios(enrich), "utf8");
console.log("patched dates+bios for deceased dubbers");
