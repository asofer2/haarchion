"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadArchive, invalidateArchiveCache } from "@/lib/data";
import type { ArchiveData } from "@/lib/types";

interface ArchiveContextValue {
  data: ArchiveData | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
}

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ArchiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<ArchiveData | null>(null);
  dataRef.current = data;

  const refresh = useCallback(async (force = false) => {
    if (force) invalidateArchiveCache();
    // Don't blank the UI on refresh — only block when we have nothing yet
    const blocking = !dataRef.current;
    if (blocking) setLoading(true);
    setError(null);
    try {
      const next = await loadArchive(force, {
        onRemote: (remote) => {
          setData(remote);
        },
      });
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינת הנתונים");
      // Keep previous data if any
      if (!dataRef.current) setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  return (
    <ArchiveContext.Provider value={{ data, loading, error, refresh }}>
      {children}
    </ArchiveContext.Provider>
  );
}

export function useArchive() {
  const ctx = useContext(ArchiveContext);
  if (!ctx) throw new Error("useArchive must be used within ArchiveProvider");
  return ctx;
}
