"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { CreditsEditor } from "@/components/CreditsEditor";
import { ProductionForm } from "@/components/ProductionForm";
import { useArchive } from "@/hooks/useArchive";
import { findById } from "@/lib/data";
import { formatProductionTitle } from "@/lib/production-title";

export default function EditProductionPage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data, loading, error, refresh } = useArchive();
  const production = data ? findById(data.productions, params.id) : undefined;

  if ((loading && !data) || authLoading) return <p className="notice">טוען…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!production || !data) return <p className="form-error">ההפקה לא נמצאה</p>;
  if (!user) {
    return (
      <p className="notice">
        יש{" "}
        <Link href="/auth">
          להתחבר
        </Link>{" "}
        כדי לערוך ערכים.
      </p>
    );
  }

  return (
    <>
      <h1 className="page-title">עריכת {formatProductionTitle(production)}</h1>
      <ProductionForm initial={production} />
      <CreditsEditor
        productionId={production.id}
        data={data}
        onSaved={() => void refresh()}
      />
    </>
  );
}
