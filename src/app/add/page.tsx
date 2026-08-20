"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function AddPage() {
  const { user, loading } = useAuth();

  if (loading) return <p className="notice">טוען…</p>;

  if (!user) {
    return (
      <>
        <h1 className="page-title">הוספה</h1>
        <p className="notice" style={{ marginBottom: "1rem" }}>
          כדי להוסיף אישיות או הפקה יש להתחבר.
        </p>
        <Link href="/auth" className="btn btn-primary">
          התחברות
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">הוספה</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        מה להוסיף למאגר?
      </p>
      <div className="hero-actions">
        <Link href="/people/new" className="btn btn-primary">
          + אישיות
        </Link>
        <Link href="/productions/new" className="btn btn-ghost">
          + הפקה
        </Link>
      </div>
    </>
  );
}
