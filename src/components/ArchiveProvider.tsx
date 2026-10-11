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
import { normalizePersonName } from "@/lib/dedupe";
import type { ArchiveData, Person } from "@/lib/types";

interface ArchiveContextValue {
  data: ArchiveData | null;
  loading: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
}

const ArchiveContext = createContext<ArchiveContextValue | null>(null);

let classicPeopleCache: Person[] | null = null;

function mergeClassicPeople(data: ArchiveData, extra: Person[]): ArchiveData {
  if (!extra.length) return data;
  const ids = new Set(data.people.map((person) => person.id));
  const names = new Set(
    data.people.map((person) => normalizePersonName(person.name))
  );
  const add = extra.filter((person) => {
    if (!person?.id || !person.name) return false;
    if (ids.has(person.id)) return false;
    return !names.has(normalizePersonName(person.name));
  });
  if (!add.length) return data;
  return { ...data, people: [...data.people, ...add] };
}

function loadClassicPeople(): Promise<Person[]> {
  if (classicPeopleCache) return Promise.resolve(classicPeopleCache);
  return fetch("/api/people", { headers: { Accept: "application/json" } })
    .then(async (res) => {
      if (!res.ok) return [];
      const json = (await res.json()) as { people?: Person[] };
      const people = Array.isArray(json.people) ? json.people : [];
      classicPeopleCache = people;
      return people;
    })
    .catch(() => []);
}

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
      const classicPromise = loadClassicPeople();
      const applyClassic = (archive: ArchiveData) => {
        void classicPromise.then((extra) => {
          setData((current) => mergeClassicPeople(current ?? archive, extra));
        });
      };
      let remoteLanded = false;
      const next = await loadArchive(force, {
        onRemote: (remote) => {
          remoteLanded = true;
          setData(remote);
          applyClassic(remote);
        },
      });
      if (!remoteLanded) setData(next);
      applyClassic(next);
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
