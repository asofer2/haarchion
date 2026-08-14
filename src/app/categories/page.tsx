"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useArchive } from "@/hooks/useArchive";
import { categoryCounts } from "@/lib/category-filter";
import { ACTIVITY_LABELS, ACTIVITY_LIST } from "@/lib/types";

export default function CategoriesPage() {
  const { data, loading, error } = useArchive();

  const counts = useMemo(() => (data ? categoryCounts(data) : null), [data]);

  if (loading && !data) return <p className="notice">טוען קטגוריות…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  return (
    <>
      <h1 className="page-title">קטגוריות</h1>
      <p className="notice" style={{ marginBottom: "1.25rem" }}>
        עיון לפי תחום — רק אישים והפקות עם קרדיטים אמיתיים בכל קטגוריה.
      </p>
      <div className="category-grid">
        {ACTIVITY_LIST.map((cat) => {
          const c = counts?.[cat] || { people: 0, productions: 0 };
          return (
            <Link key={cat} href={`/categories/${cat}`} className="category-card">
              <h2>{ACTIVITY_LABELS[cat]}</h2>
              <p>
                {c.people} אישים · {c.productions} הפקות
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
