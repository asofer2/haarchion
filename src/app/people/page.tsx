"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArchiveSkeleton } from "@/components/ArchiveSkeleton";
import { PersonCard } from "@/components/PersonCard";
import { useArchive } from "@/hooks/useArchive";
import { useAuth } from "@/components/AuthProvider";
import { personMatchesCategory } from "@/lib/category-filter";
import {
  ACTIVITY_LABELS,
  ACTIVITY_LIST,
  type ActivityCategory,
} from "@/lib/types";

const PAGE_SIZE = 24;

export default function PeoplePage() {
  const { data, loading, error } = useArchive();
  const { user } = useAuth();
  const [filter, setFilter] = useState<ActivityCategory | "all">("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const productionById = useMemo(() => {
    if (!data) return new Map();
    return new Map(data.productions.map((p) => [p.id, p]));
  }, [data]);

  const people = useMemo(() => {
    if (!data) return [];
    const list =
      filter === "all"
        ? data.people
        : data.people.filter((p) =>
            personMatchesCategory(p, filter, data.credits, productionById)
          );
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [data, filter, productionById]);

  const shown = people.slice(0, visible);

  if (loading && !data) return <ArchiveSkeleton label="טוען אישים…" cards={8} />;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  return (
    <>
      <div className="section-head" style={{ border: "none", marginBottom: "0.5rem" }}>
        <div>
          <h1 className="page-title">אישים</h1>
          <p className="notice">
            {people.length} ערכים
            {filter !== "all" ? ` ב«${ACTIVITY_LABELS[filter]}»` : ""} — מדבבים,
            שחקנים, כוכבי מחזמר והופעות.
          </p>
        </div>
        {user && (
          <Link href="/people/new" className="btn btn-primary">
            + הוספת אישיות
          </Link>
        )}
      </div>

      <div className="chip-row" style={{ marginBottom: "1.25rem" }}>
        <button
          type="button"
          className={`chip chip-btn ${filter === "all" ? "on" : ""}`}
          onClick={() => {
            setFilter("all");
            setVisible(PAGE_SIZE);
          }}
        >
          הכול
        </button>
        {ACTIVITY_LIST.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`chip chip-btn ${filter === cat ? "on" : ""}`}
            onClick={() => {
              setFilter(cat);
              setVisible(PAGE_SIZE);
            }}
          >
            {ACTIVITY_LABELS[cat]}
          </button>
        ))}
      </div>

      {people.length === 0 ? (
        <p className="muted">אין אישים במסנן זה.</p>
      ) : (
        <>
          <div className="grid-cards">
            {shown.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>

          {visible < people.length && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                הצג עוד ({people.length - visible} נותרו)
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
