"use client";

import { PersonForm } from "@/components/PersonForm";

export default function NewPersonPage() {
  return (
    <>
      <h1 className="page-title">הוספת אישיות</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        בסוף הטופס אפשר להוסיף הפקות לכל קטגוריה בנפרד — הן יופיעו בביוגרפיה תחת
        „פעילויות לפי קטגוריה”.
      </p>
      <PersonForm />
    </>
  );
}
