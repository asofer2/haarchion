"use client";

import { useA11y } from "@/components/A11yProvider";

export function FooterA11yLink() {
  const { setPanelOpen } = useA11y();
  return (
    <button
      type="button"
      className="footer-a11y-btn"
      onClick={() => setPanelOpen(true)}
    >
      נגישות
    </button>
  );
}
