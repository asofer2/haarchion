"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_A11Y,
  applyA11yPrefs,
  readA11yPrefs,
  writeA11yPrefs,
  type A11yPrefs,
} from "@/lib/a11y";

interface A11yContextValue {
  prefs: A11yPrefs;
  setPrefs: (patch: Partial<A11yPrefs>) => void;
  resetPrefs: () => void;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
}

const A11yContext = createContext<A11yContextValue | null>(null);

export function A11yProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<A11yPrefs>(DEFAULT_A11Y);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const initial = readA11yPrefs();
    setPrefsState(initial);
    applyA11yPrefs(initial);

    // Respect OS reduced-motion if user hasn't set a preference yet
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches && !localStorage.getItem("ishim-a11y-v1")) {
      const next = { ...initial, reduceMotion: true };
      setPrefsState(next);
      applyA11yPrefs(next);
      writeA11yPrefs(next);
    }
  }, []);

  const setPrefs = useCallback((patch: Partial<A11yPrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      applyA11yPrefs(next);
      writeA11yPrefs(next);
      return next;
    });
  }, []);

  const resetPrefs = useCallback(() => {
    const next = { ...DEFAULT_A11Y };
    applyA11yPrefs(next);
    writeA11yPrefs(next);
    setPrefsState(next);
  }, []);

  const value = useMemo(
    () => ({ prefs, setPrefs, resetPrefs, panelOpen, setPanelOpen }),
    [prefs, setPrefs, resetPrefs, panelOpen]
  );

  return (
    <A11yContext.Provider value={value}>{children}</A11yContext.Provider>
  );
}

export function useA11y() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useA11y must be used within A11yProvider");
  return ctx;
}
