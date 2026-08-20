"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductionForm } from "@/components/ProductionForm";

function NewProductionInner() {
  const kind = useSearchParams().get("kind") || undefined;
  return (
    <>
      <h1 className="page-title">הוספת הפקה</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        אחרי השמירה אפשר לקשר אישים דרך עריכת הקרדיטים.
      </p>
      <ProductionForm presetKind={kind} />
    </>
  );
}

export default function NewProductionPage() {
  return (
    <Suspense fallback={<p className="notice">טוען…</p>}>
      <NewProductionInner />
    </Suspense>
  );
}
