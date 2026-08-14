import type { ActivityCategory, Person } from "./types";
import { portrait } from "./portrait";

const now = "2026-07-28T21:00:00.000Z";

function wikiImage(title: string) {
  return portrait(title);
}

function p(
  id: string,
  name: string,
  activities: ActivityCategory[],
  extra: Partial<Person> & { bio: string } = { bio: "" }
): Person {
  const displayName = extra.name || name;
  return {
    id,
    name: displayName,
    nicknames: extra.nicknames || [],
    tags: extra.tags || ["דיבוב"],
    activities,
    bio: extra.bio,
    nameOriginal: extra.nameOriginal,
    birthDate: extra.birthDate,
    deathDate: extra.deathDate,
    wikipediaUrl: extra.wikipediaUrl,
    imageUrl: extra.imageUrl ?? wikiImage(displayName),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * מדבבים ישראלים שנפטרו — שקפים 9–10 במצגת «מדבבים ישראלים.pptx»
 * רק אישים שלא היו בארכיון; השאר מועשרים ב־PERSON_DATES / PERSON_WIKI_ENRICHMENT.
 */
export const DECEASED_DUBBERS_PEOPLE: Person[] = [
  p("shlmh-br-shbyt", "שלמה בר שביט", ["dubbing", "film", "series", "stage"], {
    bio: "שלמה (שלוימל'ה) בר-שביט (במקור: פרידמן; 7 בדצמבר 1928 – 8 בספטמבר 2019) היה שחקן תיאטרון וקולנוע, מדבב, במאי ומנהל ישראלי, מגדולי השחקנים של תיאטרון הבימה, זוכה פרס התיאטרון הישראלי על מפעל חיים.",
    nicknames: ["שלמה בר-שביט", "שלוימל'ה"],
    birthDate: "1928-12-07",
    deathDate: "2019-09-08",
    wikipediaUrl: "https://he.wikipedia.org/wiki/שלמה_בר-שביט",
    imageUrl: wikiImage("שלמה בר-שביט"),
  }),
  p("yvsy-ydyn", "יוסי ידין", ["dubbing", "film", "series", "stage"], {
    bio: "יוסף (יוסי) ידין היה שחקן תיאטרון וקולנוע ומדבב ישראלי, מבכירי השחקנים של התיאטרון הקאמרי. חתן פרס ישראל לתיאטרון (1991) וחתן פרס התיאטרון הישראלי על מפעל חיים (1996).",
    nicknames: ["יוסף ידין"],
    birthDate: "1920-06-01",
    deathDate: "2001-05-17",
    wikipediaUrl: "https://he.wikipedia.org/wiki/יוסף_ידין",
    imageUrl: wikiImage("יוסף ידין"),
  }),
  p("shrvn-bvrgavkr", "שרון בורגאוקר", ["dubbing", "film", "series"], {
    bio: "שרון בורגאוקר הייתה מדבבת ישראלית (ז״ל). מופיעה ברשימת «מדבבים ישראלים שנפטרו» במצגת «מדבבים ישראלים».",
  }),
  p("rvzynh-kmbvs", "רוזינה קמבוס", ["dubbing", "film", "series", "stage"], {
    bio: "רוזינה קמבוס הייתה שחקנית תיאטרון, קולנוע וטלוויזיה ישראלית, זוכת פרס אופיר ופרס התיאטרון הישראלי.",
    birthDate: "1951-12-17",
    deathDate: "2012-12-04",
    wikipediaUrl: "https://he.wikipedia.org/wiki/רוזינה_קמבוס",
  }),
  p("dydy-gt", "דידי גת", ["dubbing", "film", "series", "stage", "musical"], {
    bio: "דידי גת היה שחקן, מדבב וזמר ישראלי, שיחק בתפקידים שונים בתיאטרון, בקולנוע, בסדרות טלוויזיה ובפרסומות.",
    birthDate: "1950-09-29",
    deathDate: "2021-03-21",
    wikipediaUrl: "https://he.wikipedia.org/wiki/דידי_גת",
  }),
  p("glad-vytl", "גלעד ויטל", ["dubbing", "musical", "cassette"], {
    bio: "גלעד ויטל שמעון היה זמר, פזמונאי, מלחין ומפיק מוזיקלי ישראלי ממקימי להקת «שוטי הנבואה» וחבר ההרכבים «פשוטי העם» ו«שמעון ולוי».",
    nicknames: ["גלעד ויטל שמעון"],
    birthDate: "1970-01-24",
    deathDate: "2024-12-13",
    wikipediaUrl: "https://he.wikipedia.org/wiki/גלעד_ויטל_שמעון",
    imageUrl: wikiImage("גלעד ויטל שמעון"),
  }),
  p("rvt-prchy", "רות פרחי", ["dubbing", "film", "series", "stage"], {
    bio: "רות פרחי הייתה שחקנית ומדבבת ישראלית (ז״ל).",
    birthDate: "1927-08-13",
    deathDate: "2021-04-19",
    wikipediaUrl: "https://he.wikipedia.org/wiki/רות_פרחי",
  }),
];
