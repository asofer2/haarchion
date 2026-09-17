"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArchiveSkeleton } from "@/components/ArchiveSkeleton";
import { ProductionCard } from "@/components/ProductionCard";
import { useArchive } from "@/hooks/useArchive";
import { useAuth } from "@/components/AuthProvider";
import { productionMatchesCategory } from "@/lib/category-filter";
import { ISHIM_DIRECTORY, productionsForKindParam } from "@/lib/ishim-directory";
import {
  ACTIVITY_LABELS,
  ACTIVITY_LIST,
  type ActivityCategory,
} from "@/lib/types";

const PAGE_SIZE = 24;

function ProductionsInner() {
  const { data, loading, error } = useArchive();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const kindParam = searchParams.get("kind");
  const [filter, setFilter] = useState<ActivityCategory | "all">("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const kindItem = ISHIM_DIRECTORY.find((item) =>
    item.addHref.includes(`kind=${kindParam}`)
  );

  const productions = useMemo(() => {
    if (!data) return [];
    const byKind = productionsForKindParam(data.productions, kindParam);
    const list =
      byKind ??
      (filter === "all"
        ? data.productions
        : data.productions.filter((p) => productionMatchesCategory(p, filter)));
    return [...list].sort((a, b) => b.year - a.year);
  }, [data, filter, kindParam]);

  const shown = productions.slice(0, visible);

  if (loading && !data) {
    return <ArchiveSkeleton label="טוען הפקות…" cards={8} />;
  }
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  const title = kindItem?.label || "הפקות";

  return (
    <>
      <div className="section-head" style={{ border: "none", marginBottom: "0.5rem" }}>
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="notice">
            {productions.length} הפקות
            {!kindItem && filter !== "all" ? ` ב«${ACTIVITY_LABELS[filter]}»` : ""}
          </p>
        </div>
        {user && (
          <Link
            href={kindItem?.addHref || "/productions/new"}
            className="btn btn-primary"
          >
            + הוספת הפקה
          </Link>
        )}
      </div>

      {!kindItem && (
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
      )}

      {kindItem && (
        <p className="meta" style={{ marginBottom: "1rem" }}>
          <Link href="/productions">← כל ההפקות</Link>
        </p>
      )}

      {productions.length === 0 ? (
        <p className="muted">אין הפקות במסנן זה.</p>
      ) : (
        <>
          <div className="grid-cards">
            {shown.map((production) => (
              <ProductionCard key={production.id} production={production} />
            ))}
          </div>
          {visible < productions.length && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                הצג עוד ({productions.length - visible} נותרו)
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function ProductionsPage() {
  return (
    <Suspense fallback={<ArchiveSkeleton label="טוען הפקות…" cards={8} />}>
      <ProductionsInner />
    </Suspense>
  );
}
