"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EntityHistoryPanel } from "@/components/EntityHistoryPanel";
import { useArchive } from "@/hooks/useArchive";
import { findById } from "@/lib/data";
import { formatProductionTitle } from "@/lib/production-title";

export default function ProductionHistoryPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useArchive();
  const production = data ? findById(data.productions, params.id) : undefined;

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!production) {
    return (
      <>
        <p className="form-error">ההפקה לא נמצאה</p>
        <Link href="/productions" className="btn btn-ghost">
          חזרה להפקות
        </Link>
      </>
    );
  }

  return (
    <EntityHistoryPanel
      entityType="production"
      entityId={production.id}
      entityTitle={formatProductionTitle(production)}
      entity={production}
      contributions={data?.contributions || []}
      backHref={`/productions/${encodeURIComponent(production.id)}`}
    />
  );
}
