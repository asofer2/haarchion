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
import {
  getLeanArchiveSync,
  invalidateArchiveCache,
  loadArchive,
} from "@/lib/data";
import type { ArchiveData, Person, Production, ProductionKind } from "@/lib/types";

interface ArchiveContextValue {
  data: ArchiveData | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
}

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

type PersonStub = {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  activities?: string[];
};

type ProductionStub = {
  id: string;
  title: string;
  year: number;
  kind: string;
};

function personStub(row: PersonStub): Person {
  return {
    id: row.id,
    name: row.name,
    nicknames: [],
    tags: [],
    bio: "",
    activities: (row.activities || []) as Person["activities"],
    birthDate: row.birthDate,
    deathDate: row.deathDate,
    createdAt: "",
    updatedAt: "",
  };
}

function productionStub(row: ProductionStub): Production {
  return {
    id: row.id,
    title: row.title,
    year: row.year || 0,
    kind: (row.kind || "tv_series") as ProductionKind,
    summary: "",
    genres: [],
    createdAt: "",
    updatedAt: "",
  };
}

/** Merge CDN catalog indexes as list stubs; keep lean/local rows when richer. */
function mergeCatalogStubs(
  lean: ArchiveData,
  peopleRows: PersonStub[],
  prodRows: ProductionStub[]
): ArchiveData {
  const people = new Map(lean.people.map((p) => [p.id, p]));
  for (const row of peopleRows) {
    if (!row?.id || !row.name) continue;
    if (!people.has(row.id)) people.set(row.id, personStub(row));
  }

  const productions = new Map(lean.productions.map((p) => [p.id, p]));
  for (const row of prodRows) {
    if (!row?.id || !row.title) continue;
    if (!productions.has(row.id)) productions.set(row.id, productionStub(row));
  }

  return {
    people: [...people.values()],
    productions: [...productions.values()],
    credits: lean.credits,
    contributions: lean.contributions || [],
  };
}

async function fetchCatalogIndexes(): Promise<{
  people: PersonStub[];
  productions: ProductionStub[];
} | null> {
  try {
    const [peopleRes, prodRes] = await Promise.all([
      fetch("/catalog/people-index.json", {
        headers: { Accept: "application/json" },
      }),
      fetch("/catalog/productions-index.json", {
        headers: { Accept: "application/json" },
      }),
    ]);
    if (!peopleRes.ok || !prodRes.ok) return null;
    const people = (await peopleRes.json()) as PersonStub[];
    const productions = (await prodRes.json()) as ProductionStub[];
    if (!Array.isArray(people) || !Array.isArray(productions)) return null;
    return { people, productions };
  } catch {
    return null;
  }
}

function initialArchive(): ArchiveData | null {
  if (typeof window === "undefined") return null;
  try {
    return getLeanArchiveSync();
  } catch {
    return null;
  }
}

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ArchiveData | null>(initialArchive);
  const [loading, setLoading] = useState(() => data === null);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<ArchiveData | null>(null);
  dataRef.current = data;

  const refresh = useCallback(async (force = false) => {
    if (force) invalidateArchiveCache();
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
      if (!dataRef.current) setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Catalog indexes only — never auto-fetch full /api/archive on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const lean = dataRef.current ?? getLeanArchiveSync();
      if (!dataRef.current) setData(lean);
      setLoading(false);
      const indexes = await fetchCatalogIndexes();
      if (cancelled || !indexes) return;
      setData(mergeCatalogStubs(lean, indexes.people, indexes.productions));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
