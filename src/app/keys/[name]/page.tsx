"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { CompactLinkList } from "@/components/CompactLinkList";
import { useArchive } from "@/hooks/useArchive";
import { personMatchesCategory } from "@/lib/category-filter";
import { decodeListName, namesMatch } from "@/lib/lists";
import {
  ACTIVITY_LABELS,
  ACTIVITY_LIST,
  type ActivityCategory,
} from "@/lib/types";

export default function KeyDetailPage() {
  const params = useParams<{ name: string }>();
  const name = decodeListName(params.name);
  const { data, loading, error } = useArchive();

  const activity = ACTIVITY_LIST.find(
    (slug) => slug === name || ACTIVITY_LABELS[slug] === name
  ) as ActivityCategory | undefined;

  const people = useMemo(() => {
    if (!data || !name) return [];
    if (activity) {
      const productionById = new Map(data.productions.map((p) => [p.id, p]));
      return data.people
        .filter((p) =>
          personMatchesCategory(p, activity, data.credits, productionById)
        )
        .sort((a, b) => a.name.localeCompare(b.name, "he"));
    }
    return data.people
      .filter((p) => (p.tags || []).some((tag) => namesMatch(tag, name)))
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [activity, data, name]);

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;
  if (!name) return <p className="form-error">מפתח לא נמצא</p>;

  return (
    <>
      <p className="meta">
        <Link href="/keys">← כל המפתחות</Link>
      </p>
      <h1 className="page-title">{name}</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        {people.length} אישים
      </p>
      <CompactLinkList
        items={people.map((p) => ({
          href: `/people/${encodeURIComponent(p.id)}`,
          label: p.name,
        }))}
        empty="אין אישים עם מפתח זה."
      />
    </>
  );
}
