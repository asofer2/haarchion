"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { CompactLinkList } from "@/components/CompactLinkList";
import { useArchive } from "@/hooks/useArchive";
import { decodeListName, namesMatch } from "@/lib/lists";

export default function ChannelDetailPage() {
  const params = useParams<{ name: string }>();
  const name = decodeListName(params.name);
  const { data, loading, error } = useArchive();

  const productions = useMemo(() => {
    if (!data || !name) return [];
    return data.productions
      .filter((p) => p.channel && namesMatch(p.channel, name))
      .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "he"));
  }, [data, name]);

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;
  if (!name) return <p className="form-error">ערוץ לא נמצא</p>;

  return (
    <>
      <p className="meta">
        <Link href="/channels">← כל הערוצים</Link>
      </p>
      <h1 className="page-title">{name}</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        {productions.length} הפקות
      </p>
      <CompactLinkList
        items={productions.map((p) => ({
          href: `/productions/${encodeURIComponent(p.id)}`,
          label: p.title,
          meta: String(p.year),
        }))}
        empty="אין הפקות בערוץ זה."
      />
    </>
  );
}
