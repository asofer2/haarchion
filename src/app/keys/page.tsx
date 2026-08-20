"use client";

import { useMemo } from "react";
import { CompactLinkList } from "@/components/CompactLinkList";
import { useArchive } from "@/hooks/useArchive";
import { activityKeyItems, listHref, listPersonTags } from "@/lib/lists";

export default function KeysPage() {
  const { data, loading, error } = useArchive();
  const tags = useMemo(() => {
    if (!data) return [];
    return listPersonTags(data.people).map((item) => ({
      href: listHref("/keys", item.name),
      label: item.name,
      meta: String(item.count),
    }));
  }, [data]);

  const activities = activityKeyItems().map((item) => ({
    href: `/categories/${item.slug}`,
    label: item.name,
  }));

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  return (
    <>
      <h1 className="page-title">כל המפתחות</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        קטגוריות פעילות ותגיות של אישים.
      </p>

      <section className="year-section">
        <h2>קטגוריות</h2>
        <CompactLinkList items={activities} empty="אין קטגוריות." />
      </section>

      <section className="year-section">
        <h2>תגיות</h2>
        <CompactLinkList items={tags} empty="אין תגיות במאגר." />
      </section>
    </>
  );
}
