"use client";

import { useEffect, useState } from "react";
import { useA11y } from "@/components/A11yProvider";

const READABLE_SELECTOR = [
  "p",
  "li",
  "td",
  "th",
  "label",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  ".prose",
  ".meta",
  ".tags",
  ".notice",
  ".ishim-credit-row",
  ".ishim-notes",
  ".ishim-chars",
  ".credit-list",
  ".entity-body",
  ".page-title",
  ".hero p",
  ".muted",
].join(", ");

type LensState = {
  x: number;
  y: number;
  text: string;
};

function nearestReadable(el: Element | null): HTMLElement | null {
  if (!el) return null;
  if (el.closest(".a11y-panel, .a11y-overlay, .a11y-text-lens, .site-header, .skip-link")) {
    return null;
  }
  const hit = el.closest(READABLE_SELECTOR);
  return hit instanceof HTMLElement ? hit : null;
}

export function TextMagnifier() {
  const { prefs } = useA11y();
  const [lens, setLens] = useState<LensState | null>(null);

  useEffect(() => {
    if (!prefs.textMagnifier) {
      setLens(null);
      return;
    }

    const onMove = (event: MouseEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const readable = nearestReadable(target);
      if (!readable) {
        setLens(null);
        return;
      }

      const text = readable.innerText.replace(/\s+/g, " ").trim();
      if (!text) {
        setLens(null);
        return;
      }

      setLens({
        x: event.clientX,
        y: event.clientY,
        text: text.length > 320 ? `${text.slice(0, 317)}…` : text,
      });
    };

    const onLeave = () => setLens(null);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [prefs.textMagnifier]);

  if (!prefs.textMagnifier || !lens) return null;

  const offset = 28;
  const maxLeft = typeof window !== "undefined" ? window.innerWidth - 20 : lens.x;
  const maxTop = typeof window !== "undefined" ? window.innerHeight - 20 : lens.y;
  const left = Math.min(Math.max(12, lens.x + offset), maxLeft - 12);
  const top = Math.min(Math.max(12, lens.y + offset), maxTop - 12);

  return (
    <div
      className="a11y-text-lens"
      style={{ left, top }}
      aria-hidden="true"
    >
      {lens.text}
    </div>
  );
}
