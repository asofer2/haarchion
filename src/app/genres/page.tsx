"use client";

import { useMemo } from "react";
import { CompactLinkList } from "@/components/CompactLinkList";
import { useArchive } from "@/hooks/useArchive";
import { listGenres, listHref } from "@/lib/lists";

export default function GenresPage() {
  const { data, loading, error } = useArchive();
  const items = useMemo(() => {
    if (!data) return [];
    return listGenres(data.productions).map((item) => ({
      href: listHref("/genres", item.name),
      label: item.name,
      meta: String(item.count),
    }));
  }, [data]);

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  return (
    <>
      <h1 className="page-title">כל הז׳אנרים</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        ז׳אנרים מתוך ההפקות במאגר.
      </p>
      <CompactLinkList items={items} empty="אין ז׳אנרים במאגר." />
    </>
  );
}
