"use client";

import { useMemo, useState } from "react";
import { PersonCard } from "@/components/PersonCard";
import { ProductionCard } from "@/components/ProductionCard";
import { useArchive } from "@/hooks/useArchive";
import {
  SEARCH_SCOPE_LABELS,
  SEARCH_SCOPE_LIST,
  searchArchive,
  searchResultCount,
  type SearchResults,
  type SearchScope,
} from "@/lib/search";

const EMPTY: SearchResults = {
  people: [],
  series: [],
  films: [],
  productions: [],
};

function scopedResults(
  all: SearchResults,
  scope: SearchScope
): SearchResults {
  if (scope === "all") return all;
  if (scope === "people") {
    return { ...EMPTY, people: all.people };
  }
  if (scope === "series") {
    return { ...EMPTY, series: all.series };
  }
  if (scope === "films") {
    return { ...EMPTY, films: all.films };
  }
  // «הפקות» — כל סוגי ההפקות יחד
  return {
    ...EMPTY,
    productions: [...all.series, ...all.films, ...all.productions].sort(
      (a, b) => b.year - a.year || a.title.localeCompare(b.title, "he")
    ),
  };
}

export default function SearchPage() {
  const { data, loading, error } = useArchive();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");

  const allResults = useMemo(() => {
    if (!data) return EMPTY;
    return searchArchive(data, q);
  }, [data, q]);

  const results = useMemo(
    () => scopedResults(allResults, scope),
    [allResults, scope]
  );

  const total = searchResultCount(allResults);
  const productionCount =
    allResults.series.length +
    allResults.films.length +
    allResults.productions.length;
  const hasQuery = q.trim().length > 0;

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  return (
    <>
      <h1 className="page-title">חיפוש</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        חיפוש בכל הארכיון — אישים, סדרות, סרטים והפקות.
      </p>
      <div className="search-box" style={{ marginBottom: "1rem" }}>
        <label>
          חיפוש באישים, בסדרות, בסרטים ובהפקות
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="למשל: מדבב, שחקן, פאודה, אלמגור…"
            autoFocus
          />
        </label>
      </div>

      <div className="chip-row" style={{ marginBottom: "1.25rem" }}>
        {SEARCH_SCOPE_LIST.map((key) => {
          const count =
            key === "all"
              ? total
              : key === "people"
                ? allResults.people.length
                : key === "series"
                  ? allResults.series.length
                  : key === "films"
                    ? allResults.films.length
                    : productionCount;
          return (
            <button
              key={key}
              type="button"
              className={`chip chip-btn ${scope === key ? "on" : ""}`}
              onClick={() => setScope(key)}
            >
              {SEARCH_SCOPE_LABELS[key]}
              {hasQuery ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {!hasQuery ? (
        <p className="muted">הקלידו שם, כותרת, ז׳אנר או שם דמות כדי לחפש.</p>
      ) : total === 0 ? (
        <p className="muted">לא נמצאו תוצאות ל«{q.trim()}».</p>
      ) : searchResultCount(results) === 0 ? (
        <p className="muted">אין תוצאות במסנן זה — נסו «הכול».</p>
      ) : (
        <>
          {(scope === "all" || scope === "people") &&
            results.people.length > 0 && (
              <section className="section" style={{ marginTop: "1rem" }}>
                <div className="section-head">
                  <h2>אישים</h2>
                  <p>{results.people.length}</p>
                </div>
                <div className="grid-cards">
                  {results.people.map((person) => (
                    <PersonCard key={person.id} person={person} />
                  ))}
                </div>
              </section>
            )}

          {scope === "all" && results.series.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>סדרות</h2>
                <p>{results.series.length}</p>
              </div>
              <div className="grid-cards">
                {results.series.map((production) => (
                  <ProductionCard
                    key={production.id}
                    production={production}
                  />
                ))}
              </div>
            </section>
          )}

          {scope === "all" && results.films.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>סרטים</h2>
                <p>{results.films.length}</p>
              </div>
              <div className="grid-cards">
                {results.films.map((production) => (
                  <ProductionCard
                    key={production.id}
                    production={production}
                  />
                ))}
              </div>
            </section>
          )}

          {scope === "all" && results.productions.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>הפקות נוספות</h2>
                <p>{results.productions.length}</p>
              </div>
              <div className="grid-cards">
                {results.productions.map((production) => (
                  <ProductionCard
                    key={production.id}
                    production={production}
                  />
                ))}
              </div>
            </section>
          )}

          {scope === "series" && (
            <section className="section" style={{ marginTop: "1rem" }}>
              <div className="section-head">
                <h2>סדרות</h2>
                <p>{results.series.length}</p>
              </div>
              <div className="grid-cards">
                {results.series.map((production) => (
                  <ProductionCard
                    key={production.id}
                    production={production}
                  />
                ))}
              </div>
            </section>
          )}

          {scope === "films" && (
            <section className="section" style={{ marginTop: "1rem" }}>
              <div className="section-head">
                <h2>סרטים</h2>
                <p>{results.films.length}</p>
              </div>
              <div className="grid-cards">
                {results.films.map((production) => (
                  <ProductionCard
                    key={production.id}
                    production={production}
                  />
                ))}
              </div>
            </section>
          )}

          {scope === "productions" && (
            <section className="section" style={{ marginTop: "1rem" }}>
              <div className="section-head">
                <h2>הפקות</h2>
                <p>{results.productions.length}</p>
              </div>
              <div className="grid-cards">
                {results.productions.map((production) => (
                  <ProductionCard
                    key={production.id}
                    production={production}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
