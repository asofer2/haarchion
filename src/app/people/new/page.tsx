"use client";

import { PersonForm } from "@/components/PersonForm";

export default function NewPersonPage() {
  return (
    <>
      <h1 className="page-title">הוספת אישיות</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        ערך חדש יקושר להפקות דרך קרדיטים בדף ההפקה.
      </p>
      <PersonForm />
    </>
  );
}
