"use client";

import { useEffect, useId, useRef } from "react";
import { useA11y } from "@/components/A11yProvider";
import { FONT_SCALE_STEPS, type FontScale } from "@/lib/a11y";

const FONT_OPTIONS: { value: FontScale; label: string }[] = FONT_SCALE_STEPS.map(
  (value) => ({
    value,
    label:
      value === "100"
        ? "רגיל"
        : value === "125"
          ? "גדול"
          : value === "150"
            ? "גדול מאוד"
            : value === "175"
              ? "ענק"
              : "ענק+",
  })
);

export function AccessibilityButton() {
  const { panelOpen, setPanelOpen } = useA11y();
  return (
    <button
      type="button"
      className="btn btn-ghost a11y-trigger"
      aria-haspopup="dialog"
      aria-expanded={panelOpen}
      aria-controls="a11y-panel"
      onClick={() => setPanelOpen(!panelOpen)}
    >
      נגישות
    </button>
  );
}

export function AccessibilityPanel() {
  const { prefs, setPrefs, resetPrefs, panelOpen, setPanelOpen } = useA11y();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("button, select, input")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, setPanelOpen]);

  if (!panelOpen) return null;

  return (
    <div
      className="a11y-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) setPanelOpen(false);
      }}
    >
      <div
        ref={panelRef}
        id="a11y-panel"
        className="a11y-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="a11y-panel-head">
          <h2 id={titleId}>הגדרות נגישות</h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setPanelOpen(false)}
            aria-label="סגירת הגדרות נגישות"
          >
            סגירה
          </button>
        </div>

        <p className="a11y-intro">
          אפשרויות לכבדי ראייה ולנוחות קריאה. ההגדרות נשמרות במכשיר זה.
          Ctrl+גלגלת מגדילה רק את התוכן (לא את כותרת האתר).
        </p>

        <fieldset className="a11y-fieldset">
          <legend>גודל טקסט</legend>
          <div className="a11y-font-row" role="group" aria-label="גודל טקסט">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={
                  prefs.fontScale === opt.value
                    ? "btn btn-primary a11y-font-btn"
                    : "btn btn-ghost a11y-font-btn"
                }
                aria-pressed={prefs.fontScale === opt.value}
                onClick={() => setPrefs({ fontScale: opt.value })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="a11y-fieldset">
          <legend>תצוגה</legend>
          <Toggle
            id="a11y-contrast"
            label="ניגודיות גבוהה"
            hint="רקע כהה וטקסט בהיר, קווים חזקים"
            checked={prefs.highContrast}
            onChange={(v) => setPrefs({ highContrast: v })}
          />
          <Toggle
            id="a11y-plain"
            label="רקע פשוט"
            hint="ללא גרדיאנטים — פחות עומס ויזואלי"
            checked={prefs.plainBackground}
            onChange={(v) => setPrefs({ plainBackground: v })}
          />
          <Toggle
            id="a11y-underline"
            label="הדגשת קישורים"
            hint="קו תחתון לכל הקישורים"
            checked={prefs.underlineLinks}
            onChange={(v) => setPrefs({ underlineLinks: v })}
          />
          <Toggle
            id="a11y-targets"
            label="כפתורים גדולים"
            hint="אזורי לחיצה רחבים יותר"
            checked={prefs.largeTargets}
            onChange={(v) => setPrefs({ largeTargets: v })}
          />
        </fieldset>

        <fieldset className="a11y-fieldset">
          <legend>קריאות</legend>
          <Toggle
            id="a11y-spacing"
            label="ריווח אותיות"
            hint="רווח גדול יותר בין אותיות"
            checked={prefs.letterSpacing}
            onChange={(v) => setPrefs({ letterSpacing: v })}
          />
          <Toggle
            id="a11y-leading"
            label="ריווח שורות"
            hint="גובה שורה נוח יותר לקריאה"
            checked={prefs.lineHeight}
            onChange={(v) => setPrefs({ lineHeight: v })}
          />
          <Toggle
            id="a11y-motion"
            label="הפחתת תנועה"
            hint="ביטול אנימציות ומעברים"
            checked={prefs.reduceMotion}
            onChange={(v) => setPrefs({ reduceMotion: v })}
          />
        </fieldset>

        <div className="a11y-actions">
          <button type="button" className="btn btn-ghost" onClick={resetPrefs}>
            איפוס להגדרות ברירת מחדל
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="a11y-toggle" htmlFor={id}>
      <span className="a11y-toggle-text">
        <span className="a11y-toggle-label">{label}</span>
        <span className="a11y-toggle-hint">{hint}</span>
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
