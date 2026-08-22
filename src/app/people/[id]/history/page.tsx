"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EntityHistoryPanel } from "@/components/EntityHistoryPanel";
import { useArchive } from "@/hooks/useArchive";
import { findById } from "@/lib/data";

export default function PersonHistoryPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useArchive();
  const person = data ? findById(data.people, params.id) : undefined;

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!person) {
    return (
      <>
        <p className="form-error">האישיות לא נמצאה</p>
        <Link href="/people" className="btn btn-ghost">
          חזרה לאישים
        </Link>
      </>
    );
  }

  return (
    <EntityHistoryPanel
      entityType="person"
      entityId={person.id}
      entityTitle={person.name}
      entity={person}
      contributions={data?.contributions || []}
      backHref={`/people/${encodeURIComponent(person.id)}`}
    />
  );
}
