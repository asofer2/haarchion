"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PersonCard } from "@/components/PersonCard";
import { ProductionCard } from "@/components/ProductionCard";
import { useArchive } from "@/hooks/useArchive";
import { filterArchiveByCategory } from "@/lib/category-filter";
import {
  ACTIVITY_LABELS,
  ACTIVITY_LIST,
  type ActivityCategory,
} from "@/lib/types";

const PAGE_SIZE = 24;

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug as string;
  const { data, loading, error } = useArchive();
  const [visiblePeople, setVisiblePeople] = useState(PAGE_SIZE);
  const [visibleProds, setVisibleProds] = useState(PAGE_SIZE);

  const isValid = ACTIVITY_LIST.includes(slug as ActivityCategory);
  const label = isValid ? ACTIVITY_LABELS[slug as ActivityCategory] : undefined;

  const { people, productions } = useMemo(() => {
    if (!data || !isValid) return { people: [], productions: [] };
    return filterArchiveByCategory(data, slug as ActivityCategory);
  }, [data, isValid, slug]);

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!label) return <p className="form-error">קטגוריה לא נמצאה</p>;

  const shownPeople = people.slice(0, visiblePeople);
  const shownProds = productions.slice(0, visibleProds);

  return (
    <>
      <p className="meta">
        <Link href="/categories">← כל הקטגוריות</Link>
      </p>
      <h1 className="page-title">{label}</h1>
      <p className="notice" style={{ marginBottom: "1.25rem" }}>
        {people.length} אישים · {productions.length} הפקות — מסונן לפי קרדיטים והפקות
        בקטגוריה זו
      </p>

      <section className="section" style={{ marginTop: "1rem" }}>
        <div className="section-head">
          <h2>אישים</h2>
        </div>
        {people.length === 0 ? (
          <p className="muted">אין אישים עם קרדיטים בקטגוריה זו.</p>
        ) : (
          <>
            <div className="grid-cards">
              {shownPeople.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
            {visiblePeople < people.length && (
              <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setVisiblePeople((v) => v + PAGE_SIZE)}
                >
                  הצג עוד אישים ({people.length - visiblePeople} נותרו)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>הפקות</h2>
        </div>
        {productions.length === 0 ? (
          <p className="muted">אין הפקות משויכות לקטגוריה זו.</p>
        ) : (
          <>
            <div className="grid-cards">
              {shownProds.map((production) => (
                <ProductionCard key={production.id} production={production} />
              ))}
            </div>
            {visibleProds < productions.length && (
              <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setVisibleProds((v) => v + PAGE_SIZE)}
                >
                  הצג עוד הפקות ({productions.length - visibleProds} נותרו)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
