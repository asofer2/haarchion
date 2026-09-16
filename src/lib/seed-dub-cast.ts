import { assignBillingOrders } from "./credit-order";
import type { Credit } from "./types";

function c(
  personId: string,
  productionId: string,
  role: Credit["role"],
  characterName?: string,
  heading?: string
): Credit {
  return { personId, productionId, role, characterName, heading };
}

/**
 * Cast lists for Hebrew-dubbed films/series — dubbers + characters.
 * personId must exist in seed ( -w2 suffix is stripped on merge ).
 */
const DUB_CAST_RAW: Credit[] = [
  // —— קלאסיקות דיסני / סרטי אז ——
  // שלושת החזירונים (Three Little Pigs; HT 2005 / מקור דיסני 1933) — צוות דיבוב מוויקיפדיה העברית
  c("shafrira-zachai", "three-little-pigs-he", "dub_director", "בימוי דיבוב"),
  c("alon-sharr", "three-little-pigs-he", "dubber", "הזאב הרע"),
  c("ddy-zhr", "three-little-pigs-he", "dubber", "החזיר המעשי"),
  c("tami-barak", "three-little-pigs-he", "dubber", "החזיר החלילן"),
  c("einat-azoulay", "three-little-pigs-he", "dubber", "החזיר הכנר"),
  c("shafrira-zachai", "jungle-book-he-1988", "dub_director", "בימוי דיבוב"),
  c("shafrira-zachai", "the-smurfs-he", "dub_director", "בימוי דיבוב"),
  c("shafrira-zachai", "care-bears-he", "dub_director", "בימוי דיבוב"),
  c("shafrira-zachai", "once-upon-a-time-life", "dub_director", "בימוי דיבוב"),
  c("shafrira-zachai", "snow-white-he", "dub_director", "בימוי דיבוב"),
  c("yaffa-gabay", "the-heart-marco", "dubber", "מרקו"),
  c("yaffa-gabay", "danny-phantom-style-danny", "dubber", "דני שובבני"),
  c("yaffa-gabay", "care-bears-he", "dubber", "דמויות ראשיות"),
  c("yaffa-gabay", "the-smurfs-he", "dubber", "דרדסים / דמויות"),

  // —— מלך האריות ——
  c("sharon-cohen", "lion-king-he", "dub_director", "בימוי דיבוב"),
  c("ami-mandelman", "lion-king-he", "dubber", "סימבה (בוגר)"),
  c("daniel-magon", "lion-king-he", "dubber", "סימבה (צעיר)"),
  c("liron-lev", "lion-king-he", "dubber", "סימבה / שירה"),
  c("eran-mor", "lion-king-he", "dubber", "טימון"),
  c("kobi-likverman", "lion-king-he", "dubber", "פומבה"),
  c("simcha-barbiro", "lion-king-he", "dubber", "סקאר"),
  c("hadar-shahaf-maayan", "lion-king-he", "dubber", "נלה"),
  c("gilad-kelter", "lion-king-he", "dubber", "זאזו"),
  c("efi-ben-israel", "lion-king-he", "dubber", "שרבי / דמויות"),

  // —— אלאדין ——
  c("ami-mandelman", "aladdin-he", "dubber", "אלאדין"),
  c("simcha-barbiro", "aladdin-he", "dubber", "ג׳יני"),
  c("efi-ben-israel", "aladdin-he", "dubber", "יסמין"),
  c("yoram-yosefsberg", "aladdin-he", "dubber", "ג׳אפר"),
  c("tuvia-tsafir", "aladdin-he", "dubber", "הסוחר / דמויות"),

  // —— בת הים הקטנה ——
  c("sharon-cohen", "little-mermaid-he", "dubber", "דיבוב / תרגום"),
  c("efi-ben-israel", "little-mermaid-he", "dubber", "אריאל"),
  c("liron-lev", "little-mermaid-he", "singer", "שירת אריאל"),
  c("hadar-shahaf-maayan", "little-mermaid-he", "dubber", "אריאל / שירה"),
  c("ami-mandelman", "little-mermaid-he", "dubber", "הנסיך אריק"),
  c("simcha-barbiro", "little-mermaid-he", "dubber", "סבסטיאן"),
  c("tuvia-tsafir", "little-mermaid-he", "dubber", "אורסולה"),

  // —— היפה והחיה ——
  c("shafrira-zachai", "beauty-beast-he", "dub_director", "בימוי דיבוב"),
  c("rama-messinger", "beauty-beast-he", "dubber", "בל"),
  c("eli-gorenstein", "beauty-beast-he", "dubber", "החיה"),
  c("liron-lev", "beauty-beast-he", "singer", "שירה"),
  c("simcha-barbiro", "beauty-beast-he", "dubber", "לומייר"),
  c("miki-kam", "beauty-beast-he", "dubber", "גברת פוטס"),

  // —— מולאן / פוקהונטס / הרקולס / טרזן ——
  c("efi-ben-israel", "mulan-he", "dubber", "מולאן"),
  c("ami-mandelman", "mulan-he", "dubber", "שאנג"),
  c("eran-mor", "mulan-he", "dubber", "מושו"),
  c("efi-ben-israel", "pocahontas-he", "singer", "פוקהונטס / שירה"),
  c("ami-mandelman", "pocahontas-he", "dubber", "ג׳ון סמית׳"),
  c("simcha-barbiro", "hercules-he", "dubber", "היידס"),
  c("ami-mandelman", "hercules-he", "dubber", "הרקולס"),
  c("avi-hadash", "hercules-he", "dubber", "פילוקטטס"),
  c("hadar-shahaf-maayan", "hercules-he", "dubber", "מג"),
  c("liron-lev", "tarzan-he", "dubber", "טרזן"),
  c("efi-ben-israel", "tarzan-he", "dubber", "ג׳יין"),
  c("eran-mor", "tarzan-he", "dubber", "טרקר"),

  // —— שרק ——
  c("ami-mandelman", "shrek-he", "dubber", "שרק"),
  c("tuvia-tsafir", "shrek-he", "dubber", "חמור"),
  c("simcha-barbiro", "shrek-he", "dubber", "לורד פארקואד"),
  c("hadar-shahaf-maayan", "shrek-he", "dubber", "פיונה"),
  c("ami-mandelman", "shrek-2-he", "dubber", "שרק"),
  c("tuvia-tsafir", "shrek-2-he", "dubber", "חמור"),
  c("avi-hadash", "shrek-2-he", "dubber", "החתול במגפיים"),
  c("eran-mor", "shrek-2-he", "dubber", "דמויות"),

  // —— צעצוע של סיפור / נמו / פיקסאר ——
  c("daniel-magon", "toy-story-he", "dubber", "וודי / דמויות"),
  c("eran-mor", "toy-story-he", "dubber", "באז שנות-אור"),
  c("simcha-barbiro", "toy-story-he", "dubber", "מיסטר תפוח אדמה"),
  c("eran-mor", "toy-story-4-he", "dubber", "באז / דמויות"),
  c("gilad-kelter", "toy-story-4-he", "dubber", "דמויות"),
  c("daniel-magon", "finding-nemo-he", "dubber", "נמו"),
  c("ami-mandelman", "finding-nemo-he", "dubber", "מרלין"),
  c("simcha-barbiro", "finding-nemo-he", "dubber", "דורי"),
  c("eran-mor", "nemo-dory-he", "dubber", "דמויות"),
  c("ami-mandelman", "nemo-dory-he", "dubber", "מרלין"),
  c("eran-mor", "inside-out-he", "dubber", "שמחה / דמויות"),
  c("hadar-shahaf-maayan", "inside-out-he", "dubber", "עצבות / דמויות"),
  c("gilad-kelter", "inside-out-he", "dubber", "כעס"),
  c("eran-mor", "coco-he", "dubber", "מיגל / דמויות"),
  c("ami-mandelman", "coco-he", "dubber", "הקטור"),
  c("gilad-kelter", "incredibles-he", "dubber", "מר סופר-על"),
  c("hadar-shahaf-maayan", "incredibles-he", "dubber", "אלסטיגירל"),
  c("alon-neumann", "up-he", "dubber", "קארל"),
  c("daniel-magon", "up-he", "dubber", "ראסל"),

  // —— לשבור את הקרח / מואנה / אנקאנטו ——
  c("sharon-cohen", "frozen-he", "dub_director", "בימוי דיבוב"),
  c("ami-mandelman", "frozen-he", "dubber", "קריסטוף"),
  c("laura-shopov", "frozen-he", "dubber", "אלזה"),
  c("hadar-shahaf-maayan", "frozen-he", "dubber", "אנה"),
  c("eran-mor", "frozen-he", "dubber", "אולף"),
  c("liron-lev", "frozen-he", "singer", "שירה"),
  c("shiri-gadni", "frozen2-he", "dubber", "אלזה / דמויות"),
  c("hadar-shahaf-maayan", "frozen2-he", "dubber", "אנה"),
  c("eran-mor", "frozen2-he", "dubber", "אולף"),
  c("sharon-cohen", "moana-he", "dub_director", "בימוי דיבוב"),
  c("liron-lev", "moana-he", "dubber", "מאווי"),
  c("hadar-shahaf-maayan", "moana-he", "dubber", "מואנה"),
  c("hadar-shahaf-maayan", "encanto-he", "dubber", "מירבל"),
  c("eran-mor", "encanto-he", "dubber", "דמויות"),
  c("gilad-kelter", "zootopia-he", "dubber", "ניק ווילד"),
  c("sharon-cohen", "zootopia-he", "dub_director", "בימוי דיבוב"),
  c("hadar-shahaf-maayan", "zootopia-he", "dubber", "ג׳ודי הופס"),

  // —— אילומיניישן / מארוול אנימציה ——
  c("dan-shatzberg", "despicable-me-he", "dubber", "גרו"),
  c("nir-ron", "minions-he", "dubber", "דמויות"),
  c("kobi-likverman", "big-hero-6-he", "dubber", "הירו / דמויות"),
  c("kobi-likverman", "spiderverse-he", "dubber", "מיילס / דמויות"),
  c("tamir-ginsburg", "spiderverse-he", "dubber", "דמויות"),
  c("kobi-likverman", "super-mario-he", "dubber", "מריו"),
  c("yoav-tsarfati", "elemental-he", "dubber", "דמויות"),
  c("eran-mor", "wish-he", "dubber", "דמויות"),
  c("hadar-shahaf-maayan", "wish-he", "dubber", "אשה / דמויות"),
  c("sharon-cohen", "tangled-he", "dubber", "דיבוב"),
  c("laura-shopov", "tangled-he", "dubber", "רפונזל"),
  c("ami-mandelman", "tangled-he", "dubber", "פלין ריידר"),

  // —— סדרות ילדים מדובבות ——
  c("einat-gliksman", "paw-patrol-he", "dubber", "דמויות ראשיות"),
  c("ofek-pati", "paw-patrol-he", "dubber", "דמויות"),
  c("einat-gliksman", "peppa-pig-he", "dubber", "פפה / דמויות"),
  c("ido-mosseri", "spongebob-he", "dubber", "בובספוג מכנסמרובע"),
  c("lyrvn-brns", "spongebob-he", "dubber", "פטריק סטאר"),
  c("gilad-kelter", "spongebob-he", "dubber", "סקווידוויד"),
  c("ami-mandelman", "spongebob-he", "dubber", "מר קראב"),
  c("tsbykh-shvvrtsbrg", "spongebob-he", "dubber", "פלנקטון"),
  c("tsvika-furman", "spongebob-he", "dubber", "דמויות שונות"),
  c("simcha-barbiro", "spongebob-he", "dubber", "דמויות"),
  c("yonatan-magon", "pokemon-he", "dubber", "אש קטצ׳ם"),
  c("daniel-magon", "digimon-he", "dubber", "דמויות"),
  c("daniel-magon", "pokemon-he", "dubber", "דמויות"),
  c("tsvika-furman", "dragonball-he", "dubber", "גוקו / דמויות"),
  c("orna-katz", "sailormoon-he", "dubber", "סיילור מון"),
  c("eliana-magon", "totally-spies-he", "dubber", "סם / דמויות"),
  c("sapir-dermon", "winx-he", "dubber", "בלום / דמויות"),
  c("sapir-dermon", "miraculous-he", "dubber", "מרינט / דמויות"),
  c("romi-parkhomovsky", "miraculous-he", "dubber", "דמויות"),
  c("hadar-shahaf-maayan", "bluey-he", "dubber", "דמויות"),
  c("einat-gliksman", "bluey-he", "dubber", "דמויות"),

  // —— נארוטו (חלקים) ——
  c("yonatan-magon", "naruto-he", "dubber", "נארוטו / דמויות"),
  c("tsvika-furman", "naruto-he", "dubber", "דמויות"),
];

/** סדר לפי רשימת הדיבוב (לא אלפביתי) */
export const DUB_CAST_CREDITS: Credit[] = assignBillingOrders(DUB_CAST_RAW);
