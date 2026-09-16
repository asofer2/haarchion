export const A11Y_STORAGE_KEY = "ishim-a11y-v1";

export type FontScale = "100" | "125" | "150" | "175" | "200";

export const FONT_SCALE_STEPS: FontScale[] = [
  "100",
  "125",
  "150",
  "175",
  "200",
];

export function stepFontScale(
  current: FontScale,
  direction: 1 | -1
): FontScale {
  const index = FONT_SCALE_STEPS.indexOf(current);
  const next = Math.max(
    0,
    Math.min(FONT_SCALE_STEPS.length - 1, index + direction)
  );
  return FONT_SCALE_STEPS[next] ?? current;
}

export interface A11yPrefs {
  /** Root font scale percent */
  fontScale: FontScale;
  highContrast: boolean;
  /** Extra letter spacing */
  letterSpacing: boolean;
  /** Comfortable line height */
  lineHeight: boolean;
  /** Always underline links */
  underlineLinks: boolean;
  /** Larger buttons / tap targets */
  largeTargets: boolean;
  /** Reduce motion / disable animations */
  reduceMotion: boolean;
  /** Simpler flat background (less visual noise) */
  plainBackground: boolean;
  /** Magnifying-glass cursor + reading lens over text */
  textMagnifier: boolean;
}

export const DEFAULT_A11Y: A11yPrefs = {
  fontScale: "100",
  highContrast: false,
  letterSpacing: false,
  lineHeight: false,
  underlineLinks: false,
  largeTargets: false,
  reduceMotion: false,
  plainBackground: false,
  textMagnifier: false,
};

export function readA11yPrefs(): A11yPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_A11Y };
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_A11Y };
    const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
    return { ...DEFAULT_A11Y, ...parsed };
  } catch {
    return { ...DEFAULT_A11Y };
  }
}

export function writeA11yPrefs(prefs: A11yPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
}

/** Apply accessibility prefs to <html> for CSS hooks */
export function applyA11yPrefs(prefs: A11yPrefs, root: HTMLElement = document.documentElement) {
  root.style.setProperty("--a11y-font-scale", `${Number(prefs.fontScale) / 100}`);
  root.setAttribute("data-font-scale", prefs.fontScale);
  root.setAttribute("data-high-contrast", prefs.highContrast ? "true" : "false");
  root.setAttribute("data-letter-spacing", prefs.letterSpacing ? "true" : "false");
  root.setAttribute("data-line-height", prefs.lineHeight ? "true" : "false");
  root.setAttribute("data-underline-links", prefs.underlineLinks ? "true" : "false");
  root.setAttribute("data-large-targets", prefs.largeTargets ? "true" : "false");
  root.setAttribute("data-reduce-motion", prefs.reduceMotion ? "true" : "false");
  root.setAttribute("data-plain-bg", prefs.plainBackground ? "true" : "false");
  root.setAttribute("data-text-magnifier", prefs.textMagnifier ? "true" : "false");
}

/** Inline script — runs before paint to avoid flash */
export const A11Y_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(A11Y_STORAGE_KEY)};var r=localStorage.getItem(k);if(!r)return;var p=JSON.parse(r);var h=document.documentElement;var s=p.fontScale||"100";h.style.setProperty("--a11y-font-scale",String(Number(s)/100));h.setAttribute("data-font-scale",s);h.setAttribute("data-high-contrast",p.highContrast?"true":"false");h.setAttribute("data-letter-spacing",p.letterSpacing?"true":"false");h.setAttribute("data-line-height",p.lineHeight?"true":"false");h.setAttribute("data-underline-links",p.underlineLinks?"true":"false");h.setAttribute("data-large-targets",p.largeTargets?"true":"false");h.setAttribute("data-reduce-motion",p.reduceMotion?"true":"false");h.setAttribute("data-plain-bg",p.plainBackground?"true":"false");h.setAttribute("data-text-magnifier",p.textMagnifier?"true":"false");}catch(e){}})();`;
