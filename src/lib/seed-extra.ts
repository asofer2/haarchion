import type { ActivityCategory, Person } from "./types";
import { portrait } from "./portrait";

const now = "2026-07-23T12:00:00.000Z";

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
    tags: extra.tags || [],
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

/** הרחבת מאגר: מדבבים, מחזמר, פסטיגל ושחקני ילדים/נוער */
export const EXTRA_PEOPLE: Person[] = [
  p("yuval-segal", "יובל סגל", ["dubbing", "film", "series", "stage"], {
    bio: "שחקן ומדבב ישראלי. פעיל בקולנוע, טלוויזיה ודיבוב.",
    tags: ["דיבוב", "משחק"],
  }),
  p("michael-moshonov", "מיכאל מושונוב", ["film", "series", "stage", "dubbing"], {
    bio: "שחקן ישראלי. קולנוע, טלוויזיה ותיאטרון.",
    tags: ["משחק"],
  }),
  p("yangal-glazer", "ינגל גלזר־ז׳אן", ["dubbing", "series", "film"], {
    name: "ינגל גלזר־ז׳אן",
    bio: "מדבבת ישראלית בהפקות ילדים ואנימציה.",
    tags: ["דיבוב"],
    imageUrl: wikiImage("ינגל גלזר"),
  }),
  p("alon-sharr", "אלון שר", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי בהפקות עכשוויות.",
    tags: ["דיבוב"],
  }),
  p("tami-barak", "תמי ברק", ["dubbing", "film", "series"], {
    bio: "מדבבת ובמאית/מפקחת דיבוב ישראלית. לפי ויקיפדיה — פיקוח דיבוב באולפני אלרום (בין היתר שלושת החזירונים בדיסני+).",
    tags: ["דיבוב"],
    nameOriginal: "Tami Barak",
  }),
  p("einat-azoulay", "עינת אזולאי", ["dubbing", "film", "series"], {
    bio: "מדבבת ישראלית בהפקות אנימציה ודיבוב עברי.",
    tags: ["דיבוב"],
  }),
  p("barak-brinksman", "ברק בריקמן", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי באנימציה ובדיבוב עברי.",
    tags: ["דיבוב"],
  }),
  p("maya-bar-shalom", "מאיה בר שלום", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית בהפקות ילדים.",
    tags: ["דיבוב"],
  }),
  p("doron-ben-ami", "דורון בן־עמי", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי ותיק בהפקות ילדים ומבוגרים.",
    tags: ["דיבוב"],
  }),
  p("sharon-bles", "שרון בלס", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית.",
    tags: ["דיבוב"],
  }),
  p("rona-bakerman", "רונה בקרמן", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית בהפקות אנימציה.",
    tags: ["דיבוב"],
  }),
  p("orly-katan", "אורלי קטן", ["dubbing", "series", "cassette", "film"], {
    bio: "מדבבת ישראלית. קולה מופיע בסדרות וקלטות ילדים.",
    tags: ["דיבוב", "קלטות"],
  }),
  p("shi-zenzuri", "שי זנזורי", ["dubbing", "film", "series", "stage"], {
    bio: "שחקן ומדבב ישראלי.",
    tags: ["דיבוב", "משחק"],
  }),
  p("eldad-privs", "אלדד פריבס", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי בהפקות עכשוויות.",
    tags: ["דיבוב"],
  }),
  p("gilad-malek", "גלעד מאלך", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי בהפקות אנימציה ודיבוב עברי.",
    tags: ["דיבוב"],
    nameOriginal: "Gilad Malek",
    imageUrl: portrait("גלעד מאלך", "Gilad Malek"),
  }),
  p("michal-tzafir", "מיכל צפיר", ["dubbing", "series", "film", "hosting"], {
    bio: "שחקנית, מדבבת ומנחה.",
    tags: ["דיבוב", "הנחיה"],
  }),
  p("dan-shatzberg", "דן שצברג", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי באנימציה.",
    tags: ["דיבוב"],
  }),
  p("avi-grinik", "אבי גריניק", ["dubbing", "film", "series", "stage"], {
    bio: "שחקן ומדבב ישראלי.",
    tags: ["דיבוב", "משחק"],
  }),
  p("alon-ofir", "אלון אופיר", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי.",
    tags: ["דיבוב"],
  }),
  p("yael-nurit", "יעל נוריט", ["dubbing", "series", "film"], {
    name: "יעל טל",
    bio: "מדבבת ושחקנית ישראלית.",
    tags: ["דיבוב"],
    imageUrl: wikiImage("יעל טל"),
  }),
  p("adi-kozlovsky", "עדי קוזלובסקי", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית בהפקות ילדים ונוער.",
    tags: ["דיבוב"],
  }),
  p("noa-kashpitzky", "נועה קשפיצקי", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית.",
    tags: ["דיבוב"],
  }),
  p("jonathan-ptishi", "יונתן פטישי", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי בהפקות אנימציה.",
    tags: ["דיבוב"],
  }),
  p("ortal-zamir", "אורטל זמיר", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית.",
    tags: ["דיבוב"],
  }),
  p("ido-mosseri", "עידו מוסרי", ["dubbing", "film", "series", "stage", "festival"], {
    bio: "שחקן, מדבב וכוכב ילדים. אחיו של טל מוסרי.",
    tags: ["דיבוב", "ילדים", "פסטיגל"],
  }),
  p("shaul-amos", "שאול עמוסי", ["dubbing", "film", "series"], {
    name: "שאול עמי",
    bio: "מדבב ישראלי.",
    tags: ["דיבוב"],
    imageUrl: wikiImage("שאול עמי"),
  }),
  p("anat-waschitz", "ענת ושלץ", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית.",
    tags: ["דיבוב"],
  }),
  p("roy-steinberg", "רועי שטיינברג", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי.",
    tags: ["דיבוב"],
  }),
  p("maya-mizrahi", "מאיה מזרחי", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית בהפקות ילדים.",
    tags: ["דיבוב"],
  }),
  p("omri-rosenkrantz", "עומרי רוזנקרנץ", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי.",
    tags: ["דיבוב"],
  }),
  p("lihi-barbour", "ליהי ברבור", ["dubbing", "series", "film", "musical"], {
    bio: "מדבבת וזמרת ישראלית.",
    tags: ["דיבוב", "שירה"],
  }),
  p("yoram-yosefsberg-extra", "גדי לוי", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי בהפקות אנימציה.",
    tags: ["דיבוב"],
    imageUrl: wikiImage("גדי לוי"),
  }),
  p("ziv-meir", "זיו מאיר", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי.",
    tags: ["דיבוב"],
  }),
  p("shira-naor", "שירה נאור", ["dubbing", "series", "film", "stage"], {
    bio: "שחקנית ומדבבת ישראלית.",
    tags: ["דיבוב", "משחק"],
  }),
  p("amit-yosovich", "עמית יוסוביץ׳", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית.",
    tags: ["דיבוב"],
  }),
  p("noam-tal", "נועם טל", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי.",
    tags: ["דיבוב"],
  }),
  p("yahel-sherman", "יהל שרמן", ["dubbing", "series", "film"], {
    bio: "מדבב/ת ישראלי/ת בהפקות ילדים.",
    tags: ["דיבוב"],
  }),
  p("chen-cohen", "חן כהן", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית.",
    tags: ["דיבוב"],
  }),
  p("itay-shinman", "איתי שינמן", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי.",
    tags: ["דיבוב"],
  }),
  p("maya-goldstein", "מאיה גולדשטיין", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית.",
    tags: ["דיבוב"],
  }),
  // מחזמר / במה / פסטיגל
  p("rita", "ריטה", ["musical", "performance", "stage", "film"], {
    bio: "זמרת ישראלית. מחזמרים, הופעות וקולנוע.",
    tags: ["מחזמר", "זמרת"],
  }),
  p("shlomi-shabat", "שלומי שבת", ["musical", "performance"], {
    bio: "זמר ישראלי. הופעות ומחזות זמר.",
    tags: ["זמר"],
  }),
  p("yardena-arazi", "ירדנה ארזי", ["musical", "performance", "hosting", "festival"], {
    bio: "זמרת ומנחה. אייקון ישראלי בהופעות ומופעי ילדים.",
    tags: ["זמרת", "הנחיה"],
  }),
  p("svika-pick", "צביקה פיק", ["musical", "performance", "festival"], {
    bio: "זמר ויוצר. השפיע על מופעי ילדים ומחזמר ישראלי.",
    tags: ["זמר", "יוצר"],
    deathDate: "2022-08-14",
  }),
  p("tzipi-shavit", "ציפי שביט", ["festival", "performance", "cassette", "film", "series"], {
    bio: "כוכבת ילדים ישראלית. קלטות, מופעים וטלוויזיה.",
    tags: ["ילדים", "קלטות", "פסטיגל"],
  }),
  p("mariko", "מריקו", ["festival", "performance", "cassette", "series"], {
    name: "מרים אביגל־סגל",
    nicknames: ["מריקו"],
    bio: "כוכבת ילדים ישראלית. מופעים וקלטות.",
    tags: ["ילדים"],
    imageUrl: wikiImage("מריקו"),
  }),
  p("uchi", "אוחי", ["festival", "performance", "cassette"], {
    bio: "כוכבת ילדים ישראלית. מופעים וקלטות קלאסיות.",
    tags: ["ילדים"],
    imageUrl: wikiImage("אוחי"),
  }),
  p("yuval-hamevulbal", "יובל המבולבל", ["festival", "performance", "cassette", "series", "hosting"], {
    bio: "יוצר וכוכב ילדים. מופעים חיים, סדרות וקלטות.",
    tags: ["ילדים", "מופעים"],
    nameOriginal: "Yuval HaMebulbal",
  }),
  p("michal-haiktanit", "מיכל הקטנה", ["festival", "performance", "cassette", "series"], {
    name: "מיכל הקטנה",
    bio: "כוכבת ילדים ישראלית. מופעים וסדרות.",
    tags: ["ילדים"],
    imageUrl: wikiImage("מיכל הקטנה"),
  }),
  p("natalie-atiya", "נטעלי עטייה", ["festival", "performance", "series", "musical"], {
    name: "נטעלי עטייה",
    bio: "שחקנית וכוכבת ילדים/נוער. פסטיגל והפקות במה.",
    tags: ["פסטיגל", "נוער"],
    imageUrl: wikiImage("נטלי עטייה"),
  }),
  p("agam-rodberg", "אגם רודברג", ["series", "film", "stage", "festival", "performance"], {
    bio: "שחקנית ישראלית (נודעה גם כאגם גולדברג). טלוויזיה, קולנוע, במה ומופעי ילדים/נוער.",
    tags: ["משחק", "נוער"],
    nicknames: ["אגם גולדברג", "Agam Goldberg", "Agam Rudberg"],
    nameOriginal: "Agam Rodberg",
    imageUrl: portrait("אגם רודברג", "Agam Rudberg"),
  }),
  p("liam-giini", "ליאם ג׳יני", ["festival", "series", "performance"], {
    bio: "שחקן ילדים ונוער בהפקות ישראליות ומופעים.",
    tags: ["ילדים", "נוער"],
  }),
  p("noam-ben-gur", "נועם בן גור", ["festival", "series", "performance", "dubbing"], {
    bio: "שחקן ילדים/נוער ומדבב בהפקות ישראליות.",
    tags: ["ילדים", "דיבוב"],
  }),
  p("shira-levi", "שירה לוי", ["festival", "series", "performance", "dubbing"], {
    bio: "שחקנית ילדים/נוער ומדבבת.",
    tags: ["ילדים", "דיבוב"],
  }),
  p("ido-rosenblum", "עידו רוזנבלום", ["hosting", "series", "performance", "festival"], {
    bio: "מנחה ושחקן. טלוויזיה ומופעים.",
    tags: ["הנחיה"],
  }),
  p("eden-hason", "עדן חסון", ["musical", "performance", "festival"], {
    bio: "זמר ישראלי. הופעות ומופעי ילדים/משפחה.",
    tags: ["זמר"],
  }),
  p("static-ben-el", "סטטיק ובן אל", ["performance", "festival", "musical"], {
    name: "סטטיק",
    bio: "אמן במה ישראלי. הופעות ומופעי ענק.",
    tags: ["הופעות"],
    imageUrl: wikiImage("סטטיק"),
  }),
  p("ben-el-tavori", "בן אל תבורי", ["performance", "festival", "musical"], {
    bio: "זמר ואמן במה ישראלי.",
    tags: ["זמר", "הופעות"],
  }),
  p("anna-zak", "אנה זק", ["performance", "series", "festival", "film"], {
    bio: "זמרת, שחקנית וכוכבת רשת ישראלית. מופעים והפקות נוער.",
    tags: ["נוער", "הופעות"],
  }),
  p("noa-kirel", "נועה קירל", ["performance", "musical", "festival", "film", "series"], {
    bio: "זמרת, שחקנית וכוכבת במה ישראלית.",
    tags: ["זמרת", "נוער"],
  }),
  p("yon-tumarkin", "יון תומרקין", ["series", "film", "stage", "dubbing"], {
    bio: "שחקן ישראלי. גדל כשחקן ילדים/נוער והמשיך לקולנוע וטלוויזיה.",
    tags: ["נוער", "משחק"],
  }),
  p("adi-himelbloy", "עדי הימלבלוי", ["series", "film", "stage"], {
    bio: "שחקנית ישראלית. החלה כשחקנית ילדים/נוער.",
    tags: ["נוער", "משחק"],
  }),
  p("ninet-tayeb", "נינט טייב", ["musical", "performance", "film", "series"], {
    bio: "זמרת ושחקנית ישראלית. במה ומחזמר.",
    tags: ["זמרת", "משחק"],
  }),
  p("harel-skaat", "הראל סקעת", ["musical", "performance", "stage"], {
    bio: "זמר ושחקן מחזמר ישראלי.",
    tags: ["מחזמר", "זמר"],
  }),
  p("shiri-mimon", "שירי מימון", ["musical", "performance", "stage"], {
    bio: "זמרת ושחקנית. מחזמרים והופעות.",
    tags: ["מחזמר", "זמרת"],
  }),
  p("ozi-fux", "עוזי פוקס", ["dubbing", "cassette", "series", "film"], {
    bio: "מדבב ויוצר בהפקות ילדים וקלטות קלאסיות.",
    tags: ["דיבוב", "קלטות"],
  }),
  p("eli-gorenstein", "אלי גורנשטיין", ["dubbing", "film", "series", "stage", "musical"], {
    bio: "שחקן, זמר ומדבב ישראלי.",
    tags: ["דיבוב", "מחזמר"],
  }),
  p("dov-reiber", "דב רייזר", ["dubbing", "film", "series", "stage"], {
    bio: "שחקן ומדבב ישראלי ותיק.",
    tags: ["דיבוב", "תיאטרון"],
  }),
  p("yehezkel-lazarov", "יחזקאל לזרוב", ["film", "series", "stage", "dubbing", "musical"], {
    bio: "שחקן, רקדן ויוצר. קולנוע, במה ודיבוב.",
    tags: ["משחק", "מחזמר"],
  }),
  p("ania-bukstein", "אניה בוקשטיין", ["film", "series", "stage", "dubbing"], {
    bio: "שחקנית ישראלית. קולנוע, טלוויזיה ודיבוב.",
    tags: ["משחק"],
  }),
  p("liraz-charhi", "לירז צ׳רכי", ["film", "series", "stage", "musical", "performance"], {
    bio: "שחקנית וזמרת ישראלית.",
    tags: ["משחק", "שירה"],
  }),
  p("israel-katorza", "ישראל קטורזה", ["series", "stage", "performance", "film"], {
    bio: "קומיקאי ושחקן ישראלי. במה וטלוויזיה.",
    tags: ["קומדיה"],
  }),
  p("shalom-asherov", "שלום אסייג", ["series", "stage", "performance", "film"], {
    bio: "קומיקאי ושחקן ישראלי.",
    tags: ["קומדיה"],
    imageUrl: wikiImage("שלום אסייג"),
  }),
  p("eli-finish", "אלי פיניש", ["series", "stage", "performance", "film"], {
    bio: "קומיקאי ושחקן ישראלי.",
    tags: ["קומדיה"],
  }),
  p("tuvia-tsafir", "טוביה צפיר", ["dubbing", "series", "film", "stage", "cassette"], {
    bio: "שחקן, קומיקאי ומדבב. מהקולות והפנים המוכרים בישראל.",
    tags: ["דיבוב", "קומדיה"],
  }),
  p("gidi-gov", "גידי גוב", ["musical", "performance", "series", "hosting", "film"], {
    bio: "זמר, שחקן ומנחה. אייקון ישראלי.",
    tags: ["זמר", "הנחיה"],
  }),
  p("matti-caspi", "מתי כספי", ["musical", "performance"], {
    bio: "זמר ויוצר ישראלי.",
    tags: ["זמר"],
  }),
  p("ehud-banai", "אהוד בנאי", ["musical", "performance", "film"], {
    bio: "זמר ויוצר ישראלי.",
    tags: ["זמר"],
  }),
  p("shaanan-street", "שאנן סטריט", ["musical", "performance", "festival"], {
    bio: "ראפר וזמר. הופעות ובמה.",
    tags: ["הופעות"],
  }),
  p("hadag-nahash-shanan", "מיכה רבינוביץ׳", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי בהפקות ילדים.",
    tags: ["דיבוב"],
    imageUrl: wikiImage("מיכה רבינוביץ"),
  }),
  p("talya-cohen", "טליה כהן", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית בהפקות ילדים ונוער.",
    tags: ["דיבוב"],
  }),
  p("romi-parkhomovsky", "רומי פרחומובסקי", ["series", "festival", "performance", "dubbing"], {
    bio: "שחקנית ילדים/נוער בהפקות ישראליות.",
    tags: ["ילדים", "נוער"],
  }),
  p("amit-farkash", "עמית פרקש", ["series", "film", "musical", "performance"], {
    bio: "שחקנית וזמרת. החלה כשחקנית נוער והמשיכה למחזמר וקולנוע.",
    tags: ["נוער", "מחזמר"],
  }),
  p("yonatan-bass", "יונתן בס", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי.",
    tags: ["דיבוב"],
  }),
  p("maayan-turjeman", "מעין תורג׳מן", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית.",
    tags: ["דיבוב"],
  }),
  p("ofek-pati", "אופק פטי", ["festival", "series", "performance", "dubbing"], {
    bio: "שחקן ילדים/נוער ומדבב בהפקות חדשות.",
    tags: ["ילדים", "נוער"],
  }),
  p("halleli-avi", "הללי אבי", ["festival", "series", "performance"], {
    bio: "שחקנית ילדים/נוער בהפקות ישראליות עכשוויות.",
    tags: ["ילדים", "נוער"],
  }),
  p("yoav-hayun", "יואב חיון", ["dubbing", "film", "series"], {
    bio: "מדבב ישראלי.",
    tags: ["דיבוב"],
  }),
  p("sivan-sharon", "סיון שרון", ["dubbing", "series", "film"], {
    bio: "מדבבת ישראלית.",
    tags: ["דיבוב"],
  }),
  p("dalik-wolinitz", "דליק ווליניץ", ["film", "series", "stage", "hosting", "radio"], {
    nameOriginal: "Dalik Wolinitz",
    nicknames: ["דליק", "גדליהו ווליניץ", "דליק וולוניץ", "Dalik Volonitz", "Dlik"],
    birthDate: "1951-08-10",
    bio: "גדליהו (דליק) ווליניץ (נולד ב-10 באוגוסט 1951) הוא שחקן, במאי תיאטרון ומנחה טלוויזיה ורדיו ישראלי. מוכר מהנחיית „זהו זה!” (1978–1980) ו„שמיניות באוויר” (1981–1988) לצד כלבו טוליפ, וכן מתפקידים ב„השיר שלנו”, „דני הוליווד”, „ראש גדול” ו„חטופים”. מקור: ויקיפדיה.",
    tags: ["הנחיה", "ילדים", "טלוויזיה", "תיאטרון", "רדיו"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%93%D7%9C%D7%99%D7%A7_%D7%95%D7%95%D7%9C%D7%99%D7%A0%D7%99%D7%A5",
    imageUrl: wikiImage("דליק ווליניץ"),
  }),
  p("sefi-rivlin", "ספי ריבלין", ["series", "film", "stage", "musical", "hosting", "performance", "festival"], {
    nameOriginal: "Joseph (Sefi) Rivlin",
    nicknames: ["ספי", "יוסף ריבלין", "פיסטוק"],
    birthDate: "1947-11-07",
    deathDate: "2013-12-03",
    bio: "יוסף (ספי) ריבלין (1947–2013) היה שחקן וקומיקאי ישראלי מהבולטים והמשפיעים בתחומו. חתן פרס האקדמיה לטלוויזיה ופרס מסך הזהב על מפעל חיים. מוכר מ„רגע עם דודלי” (פיסטוק), „הופה היי”, „איצ׳ה”, „ספי”, „זהו זה!” ועוד; הנחה פסטיגלים (1989, 1993) ושיחק בתיאטרון ובקולנוע. מקור: ויקיפדיה.",
    tags: ["קומדיה", "ילדים", "טלוויזיה", "תיאטרון"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/ספי_ריבלין",
    imageUrl: wikiImage("ספי ריבלין"),
  }),
  p("yoni-chen", "יוני חן", ["dubbing", "film", "series", "stage"], {
    nameOriginal: "Yoni Chen",
    nicknames: ["יוסי חן", "יונתן חנונו", "בץ"],
    birthDate: "1953-08-10",
    deathDate: "1995-06-27",
    bio: "יוני חן (נולד יונתן חנונו; 1953–1995) היה שחקן, במאי, בובנאי ומדבב ישראלי. דיבב והפעיל את בץ ב„פרפר נחמד” (1982–1993), הקים את אולפן הדיבוב אולפנטו, ושיחק ב„הלהקה”, „דיזנגוף 99” ו„חמש חמש”. מקור: ויקיפדיה.",
    tags: ["דיבוב", "בובנאות", "ילדים", "קולנוע"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/יוני_חן",
    imageUrl: wikiImage("יוני חן"),
  }),
  p("amvs-lbya", "עמוס לביא", ["film", "series", "stage"], {
    nameOriginal: "Amos Lavi",
    birthDate: "1953-01-01",
    deathDate: "2010-11-09",
    bio: "עמוס לביא (1 בינואר 1953 – 9 בנובמבר 2010) היה שחקן קולנוע, טלוויזיה ותיאטרון ישראלי. זכה בשלושה פרסי אופיר למשחק, על תפקידיו בסרטים „שחור”, „נשים” ו„קרקס פלשתינה”. מקור: ויקיפדיה.",
    tags: ["משחק", "קולנוע", "טלוויזיה", "תיאטרון"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/עמוס_לביא",
    imageUrl: wikiImage("עמוס לביא"),
  }),
  p("oshik-levi", "אושיק לוי", ["musical", "performance", "film", "series", "stage", "festival", "hosting"], {
    nameOriginal: "Oshik Levi",
    nicknames: ["אושר לוי", "Oshik Levy"],
    birthDate: "1944-04-07",
    bio: "אושיק לוי (נולד ב-7 באפריל 1944) הוא זמר ושחקן ישראלי. נולד בשם אושר לוי. התפרסם בלהיטים כמו „חוזה לך ברח”, „בלדה לשוטר”, „זה מכבר” ו„אגדת דשא”, ושיחק בקולנוע ובטלוויזיה (בין היתר „טלפלא”, „בסוד העניינים” ו„קופה ראשית”). מקור: ויקיפדיה.",
    tags: ["זמר", "משחק", "קולנוע", "טלוויזיה", "ילדים"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%90%D7%95%D7%A9%D7%99%D7%A7_%D7%9C%D7%95%D7%99",
    imageUrl: wikiImage("אושיק לוי"),
  }),
  p("ilan-dar", "אילן דר", ["stage", "film", "series"], {
    nameOriginal: "Ilan Dar",
    nicknames: ["אילן בלווייס", "Ilan Blauweis"],
    birthDate: "1937-01-30",
    bio: "אילן דר (שמו המקורי: אילן בלווייס; נולד ב-30 בינואר 1937) הוא שחקן קולנוע, תיאטרון וטלוויזיה, מתרגם ובמאי תיאטרון ישראלי. מוכר בין היתר מתפקידו כאילן בסדרה „קרובים קרובים”. מקור: ויקיפדיה.",
    tags: ["משחק", "תיאטרון", "קולנוע", "טלוויזיה"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%90%D7%99%D7%9C%D7%9F_%D7%93%D7%A8",
    imageUrl: wikiImage("אילן דר"),
  }),
  p("shmuel-wolf", "שמואל וולף", ["stage", "film", "series"], {
    nameOriginal: "Shmuel Wolf",
    nicknames: ["ג'רג' וולף", "Wolf György", "György Wolf"],
    birthDate: "1934-02-12",
    deathDate: "2019-02-23",
    bio: "שמואל וולף (במקור ג'רג' וולף, בהונגרית: Wolf György; 12 בפברואר 1934 – 23 בפברואר 2019) היה שחקן תיאטרון, קולנוע וטלוויזיה ישראלי. זוכה פרס „קיפוד הזהב” להצגות פרינג' על מפעל חיים (2009). מקור: ויקיפדיה.",
    tags: ["משחק", "תיאטרון", "קולנוע", "טלוויזיה", "פרינג'"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%A9%D7%9E%D7%95%D7%90%D7%9C_%D7%95%D7%95%D7%9C%D7%A3",
    imageUrl: wikiImage("שמואל וולף"),
  }),
  p("tamirosh-star", "תמירוש", ["series", "film", "cassette", "festival", "dubbing"], {
    bio: "דמות/כינוי ארכיוני בסגנון אתר תמירוש — קטלוג סדרות, סרטים ומוצרי ילדים ישראליים. ניתן לערוך ולהרחיב.",
    tags: ["ילדים", "ארכיון", "סדרות"],
    nicknames: ["תמירוש", "Tamirosh"],
    nameOriginal: "Tamirosh",
  }),
  p("yaakov-budo", "יעקב בודו", ["stage", "film", "series", "musical", "performance"], {
    nameOriginal: "Yaakov Bodo",
    nicknames: ["יענקל'ה בודו", "יעקב בודואגה", "Iacob Bodoagă"],
    birthDate: "1931-03-28",
    bio: "יעקב (יענקל'ה) בודו (שמו המקורי: יעקב בודואגה; נולד ב-28 במרץ 1931) הוא שחקן, זמר וקומיקאי ישראלי, מהכוכבים הגדולים של התיאטרון הישראלי. חתן פרס התיאטרון הישראלי על מפעל חיים ויקיר העיר תל אביב. ממייסדי הלהקות הצבאיות פיקוד הצפון ופיקוד הדרום. מקור: ויקיפדיה.",
    tags: ["משחק", "תיאטרון", "קולנוע", "יידיש"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%99%D7%A2%D7%A7%D7%91_%D7%91%D7%95%D7%93%D7%95",
    imageUrl: wikiImage("יעקב בודו"),
  }),
  p("tsvika-hadar", "צביקה הדר", ["series", "film", "stage", "hosting", "radio", "festival", "musical", "performance", "dubbing"], {
    nameOriginal: "Tzvika Hadar",
    nicknames: ["צבי פרוכטר", "Zvika Hadar"],
    birthDate: "1966-04-07",
    bio: "צביקה הדר (נולד ב-7 באפריל 1966) הוא קומיקאי, שחקן, מפיק, מנחה טלוויזיה, שדרן רדיו וסטנדאפיסט ישראלי. בין היתר כיכב ב„הקומדי סטור” ו„שמש” והנחה את „כוכב נולד”. לפי ויקיפדיה דיבב את באסטר בסרט האנימציה „לשיר” (2016). מקור: ויקיפדיה.",
    tags: ["משחק", "הנחיה", "קומדיה", "דיבוב"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%A6%D7%91%D7%99%D7%A7%D7%94_%D7%94%D7%93%D7%A8",
    imageUrl: wikiImage("צביקה הדר"),
  }),
  p("dovi-gal", "דובי גל", ["film", "series", "stage", "festival", "performance"], {
    nameOriginal: "Dov Gal",
    nicknames: ["דב גנדלמן", "Dubi Gal"],
    birthDate: "1948-03-03",
    bio: "דובי גל (שם לידה: דב גנדלמן; נולד ב-3 במרץ 1948) הוא שחקן, קומיקאי, תסריטאי ובמאי קולנוע ישראלי. מוכר בין היתר מ„קריוס ובקטוס” ומסרטי קולנוע ישראליים. מקור: ויקיפדיה.",
    tags: ["משחק", "קולנוע", "ילדים", "קומדיה"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%93%D7%95%D7%91%D7%99_%D7%92%D7%9C",
    imageUrl: wikiImage("דובי גל"),
  }),
  p("irit-kaplan", "עירית קפלן", ["stage", "film", "series"], {
    nameOriginal: "Irit Kaplan",
    nicknames: ["אירית קפלן"],
    birthDate: "1973-07-27",
    bio: "עירית קפלן (נולדה ב-27 ביולי 1973) היא שחקנית ומחזאית ישראלית. זוכת פרס אופיר לשחקנית הראשית הטובה ביותר (על „סיפור גדול”, 2009). מקור: ויקיפדיה.",
    tags: ["משחק", "תיאטרון", "קולנוע", "טלוויזיה"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%A2%D7%99%D7%A8%D7%99%D7%AA_%D7%A7%D7%A4%D7%9C%D7%9F",
    imageUrl: wikiImage("עירית קפלן"),
  }),
  p("natan-zehavi", "נתן זהבי", ["radio", "film", "series", "hosting", "dubbing"], {
    nameOriginal: "Natan Zehavi",
    nicknames: ["נתו זהבי", "Natu Zehavi"],
    birthDate: "1946-10-27",
    bio: "נתן זהבי (נולד ב-27 באוקטובר 1946) הוא שדרן רדיו, עיתונאי, פובליציסט, עורך, סופר, תסריטאי, שחקן, במאי ומפיק קולנוע ישראלי. זוכה „פרס סוקולוב” (2000). לפי ויקיפדיה דיבב את מוסטפא בסדרת האנימציה „סלב׳ס” (2009). מקור: ויקיפדיה.",
    tags: ["רדיו", "משחק", "קולנוע", "דיבוב"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%A0%D7%AA%D7%9F_%D7%96%D7%94%D7%91%D7%99",
    imageUrl: wikiImage("נתן זהבי"),
  }),
  p("alex-ansky", "אלכס אנסקי", ["stage", "film", "series", "radio", "hosting"], {
    nameOriginal: "Alex Ansky",
    nicknames: ["אלכסנדר אנסקי", "Alexander Ansky"],
    birthDate: "1939-05-26",
    bio: "אלכסנדר (אלכס) אנסקי (נולד ב-26 במאי 1939) הוא שחקן תיאטרון וקולנוע, קריין, איש תקשורת ושדרן רדיו ישראלי. מקור: ויקיפדיה.",
    tags: ["משחק", "תיאטרון", "קולנוע", "רדיו", "קריינות"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%90%D7%9C%D7%9B%D7%A1_%D7%90%D7%A0%D7%A1%D7%A7%D7%99",
    imageUrl: wikiImage("אלכס אנסקי"),
  }),
  p("yehoram-gaon", "יהורם גאון", ["musical", "performance", "film", "series", "stage", "radio", "hosting"], {
    nameOriginal: "Yehoram Gaon",
    birthDate: "1939-12-28",
    bio: "יהורם גאון (נולד ב-28 בדצמבר 1939) הוא זמר, במאי, מגיש טלוויזיה, שדרן רדיו, קומיקאי, מפיק ושחקן ישראלי, חתן פרס ישראל לשנת תשס״ד (2004) לזמר העברי. הקליט למעלה מ-900 שירים ושיחק בסרטי קולנוע ובהצגות תיאטרון רבים. מקור: ויקיפדיה.",
    tags: ["זמר", "משחק", "קולנוע", "תיאטרון", "רדיו"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%99%D7%94%D7%95%D7%A8%D7%9D_%D7%92%D7%90%D7%95%D7%9F",
    imageUrl: wikiImage("יהורם גאון"),
  }),
  p("gabi-amrani", "גבי עמרני", ["stage", "film", "series", "musical", "performance"], {
    nameOriginal: "Gabi Amrani",
    nicknames: ["גבריאל עמרני"],
    birthDate: "1934-10-22",
    bio: "גבריאל (גבי) עמרני (נולד ב-22 באוקטובר 1934) הוא שחקן תיאטרון, קולנוע וטלוויזיה, קומיקאי וזמר ישראלי. חתן פרס ישראל לקולנוע לשנת 2026 ופרס אופיר על מפעל חיים לשנת 2000. מקור: ויקיפדיה.",
    tags: ["משחק", "תיאטרון", "קולנוע", "קומדיה"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%92%D7%91%D7%99_%D7%A2%D7%9E%D7%A8%D7%A0%D7%99",
    imageUrl: wikiImage("גבי עמרני"),
  }),
  p("yigal-adika", "יגאל עדיקא", ["film", "series", "stage"], {
    nameOriginal: "Yigal Adika",
    birthDate: "1959-08-29",
    bio: "יגאל עדיקא (נולד ב-29 באוגוסט 1959) הוא שחקן ישראלי. מקור: ויקיפדיה.",
    tags: ["משחק", "קולנוע", "טלוויזיה"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%99%D7%92%D7%90%D7%9C_%D7%A2%D7%93%D7%99%D7%A7%D7%90",
    imageUrl: wikiImage("יגאל עדיקא"),
  }),
  p("menashe-noy", "מנשה נוי", ["film", "series", "stage"], {
    nameOriginal: "Menashe Noy",
    birthDate: "1959-08-07",
    bio: "מנשה נוי (נולד ב-7 באוגוסט 1959) הוא שחקן, קומיקאי, תסריטאי ובמאי קולנוע ישראלי. מקור: ויקיפדיה.",
    tags: ["משחק", "קולנוע", "קומדיה", "בימוי"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%9E%D7%A0%D7%A9%D7%94_%D7%A0%D7%95%D7%99",
    imageUrl: wikiImage("מנשה נוי"),
  }),
  p("zev-revach", "זאב רווח", ["film", "series", "stage", "musical", "performance"], {
    nameOriginal: "Ze'ev Revach",
    nicknames: ["זאביק רווח"],
    birthDate: "1940-08-15",
    deathDate: "2025-01-18",
    bio: "זאב (זאביק) נחום רווח (15 באוגוסט 1940 – 18 בינואר 2025) היה שחקן קולנוע, טלוויזיה ותיאטרון, קומיקאי, זמר, מפיק, תסריטאי, במאי קולנוע ותיאטרון וצייר ישראלי. שחקן בולט בז'אנר הבורקס וחתן שלושה פרסי אופיר. מקור: ויקיפדיה.",
    tags: ["משחק", "קולנוע", "בורקס", "קומדיה"],
    wikipediaUrl: "https://he.wikipedia.org/wiki/%D7%96%D7%90%D7%91_%D7%A8%D7%95%D7%95%D7%97",
    imageUrl: wikiImage("זאב רווח"),
  }),
];
