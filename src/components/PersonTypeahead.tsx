"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { normalizeSearchText } from "@/lib/search";
import type { Person } from "@/lib/types";

const RESULT_LIMIT = 30;

type Props = {
  people: Person[];
  value: string;
  onChange: (personId: string) => void;
  placeholder?: string;
};

function personSearchBlob(person: Person): string {
  return [
    person.name,
    person.nameOriginal,
    ...(person.nicknames || []),
    person.id,
  ]
    .filter(Boolean)
    .join(" ");
}

function rankMatch(blob: string, term: string, name: string): number {
  const normalizedName = normalizeSearchText(name);
  if (normalizedName === term) return 0;
  if (normalizedName.startsWith(term)) return 1;
  if (blob.startsWith(term)) return 2;
  const idx = blob.indexOf(term);
  return idx < 0 ? 99 : 3 + Math.min(idx, 20);
}

export function PersonTypeahead({
  people,
  value,
  onChange,
  placeholder = "הקלידו שם לחיפוש…",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(
    () => people.find((person) => person.id === value),
    [people, value]
  );
  const [query, setQuery] = useState(selected?.name || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setQuery(selected?.name || "");
  }, [selected?.id, selected?.name]);

  const indexed = useMemo(
    () =>
      people.map((person) => ({
        person,
        blob: normalizeSearchText(personSearchBlob(person)),
      })),
    [people]
  );

  const results = useMemo(() => {
    const term = normalizeSearchText(query);
    if (!term) return [];
    return indexed
      .map(({ person, blob }) => ({
        person,
        rank: rankMatch(blob, term, person.name),
      }))
      .filter((row) => row.rank < 99)
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.person.name.localeCompare(b.person.name, "he");
      })
      .slice(0, RESULT_LIMIT)
      .map((row) => row.person);
  }, [indexed, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        if (selected) setQuery(selected.name);
        else if (!value) setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [selected, value]);

  function pick(person: Person) {
    onChange(person.id);
    setQuery(person.name);
    setOpen(false);
  }

  function clearSelection() {
    onChange("");
    setQuery("");
    setOpen(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      if (normalizeSearchText(query)) setOpen(true);
      return;
    }
    if (!open || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const person = results[activeIndex];
      if (person) pick(person);
    } else if (event.key === "Escape") {
      setOpen(false);
      if (selected) setQuery(selected.name);
    }
  }

  const showResults = open && normalizeSearchText(query).length > 0;

  return (
    <div className="person-typeahead" ref={rootRef}>
      <div className="person-typeahead-input-row">
        <input
          type="search"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showResults && results[activeIndex]
              ? `${listId}-opt-${activeIndex}`
              : undefined
          }
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            if (value && selected && next !== selected.name) {
              onChange("");
            }
          }}
          onFocus={() => {
            if (normalizeSearchText(query)) setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {value ? (
          <button
            type="button"
            className="btn btn-ghost person-typeahead-clear"
            onClick={clearSelection}
            aria-label="נקו בחירה"
          >
            ✕
          </button>
        ) : null}
      </div>
      {showResults ? (
        <ul
          id={listId}
          role="listbox"
          className="person-typeahead-results"
        >
          {results.length === 0 ? (
            <li className="person-typeahead-empty muted">אין תוצאות</li>
          ) : (
            results.map((person, index) => (
              <li key={person.id} role="presentation">
                <button
                  type="button"
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={
                    index === activeIndex
                      ? "person-typeahead-option is-active"
                      : "person-typeahead-option"
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pick(person)}
                >
                  <span>{person.name}</span>
                  {person.nameOriginal ? (
                    <span className="meta">{person.nameOriginal}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
