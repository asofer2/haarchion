"use client";

import { ProductionForm } from "@/components/ProductionForm";

export default function NewProductionPage() {
  return (
    <>
      <h1 className="page-title">הוספת הפקה</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        אחרי השמירה אפשר לקשר אישים דרך עריכת הקרדיטים (בגרסה הבאה) או ישירות במסד.
      </p>
      <ProductionForm />
    </>
  );
}
