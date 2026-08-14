/** Resolve dynamic route ids that may be URL-encoded (esp. Hebrew). */
export function resolveRouteId(
  raw: string | string[] | undefined
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function findById<T extends { id: string; name?: string; title?: string }>(
  items: T[],
  rawId: string | string[] | undefined
): T | undefined {
  const id = resolveRouteId(rawId);
  if (!id) return undefined;

  const direct = items.find((item) => item.id === id);
  if (direct) return direct;

  const decodedMatch = items.find((item) => {
    try {
      return decodeURIComponent(item.id) === id || item.id === decodeURIComponent(id);
    } catch {
      return false;
    }
  });
  if (decodedMatch) return decodedMatch;

  // Fallback: Hebrew-only slug that matched the display name (legacy saves)
  return items.find(
    (item) => item.name === id || item.title === id || item.id.replace(/-/g, "") === id.replace(/-/g, "")
  );
}

const HEBREW_MAP: Record<string, string> = {
  א: "a",
  ב: "b",
  ג: "g",
  ד: "d",
  ה: "h",
  ו: "v",
  ז: "z",
  ח: "ch",
  ט: "t",
  י: "y",
  כ: "k",
  ך: "k",
  ל: "l",
  מ: "m",
  ם: "m",
  נ: "n",
  ן: "n",
  ס: "s",
  ע: "a",
  פ: "p",
  ף: "f",
  צ: "ts",
  ץ: "ts",
  ק: "k",
  ר: "r",
  ש: "sh",
  ת: "t",
  "׳": "",
  "'": "",
  "־": "-",
  "-": "-",
  " ": "-",
};

/** Always produce ASCII-safe URL ids (Hebrew names used to break detail pages). */
export function slugify(input: string): string {
  const transliterated = input
    .trim()
    .toLowerCase()
    .split("")
    .map((ch) => {
      if (/[a-z0-9]/.test(ch)) return ch;
      if (HEBREW_MAP[ch] !== undefined) return HEBREW_MAP[ch];
      if (/\s/.test(ch)) return "-";
      return "";
    })
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (transliterated.length >= 2) return transliterated;
  return `item-${Date.now().toString(36)}`;
}
