"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PersonForm } from "@/components/PersonForm";
import { useArchive } from "@/hooks/useArchive";
import { findById } from "@/lib/data";

export default function EditPersonPage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data, loading, error } = useArchive();
  const person = data ? findById(data.people, params.id) : undefined;

  if ((loading && !data) || authLoading) return <p className="notice">טוען…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!person) return <p className="form-error">האישיות לא נמצאה</p>;
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
      <h1 className="page-title">עריכת {person.name}</h1>
      <PersonForm initial={person} />
    </>
  );
}
