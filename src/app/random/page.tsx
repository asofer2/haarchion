"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useArchive } from "@/hooks/useArchive";

export default function RandomPage() {
  const router = useRouter();
  const { data, loading, error } = useArchive();

  useEffect(() => {
    if (!data) return;
    const people = data.people;
    const productions = data.productions;
    if (people.length === 0 && productions.length === 0) return;

    const pickPerson =
      productions.length === 0 ||
      (people.length > 0 && Math.random() < 0.65);
    if (pickPerson && people.length > 0) {
      const person = people[Math.floor(Math.random() * people.length)];
      router.replace(`/people/${encodeURIComponent(person.id)}`);
      return;
    }
    if (productions.length > 0) {
      const production =
        productions[Math.floor(Math.random() * productions.length)];
      router.replace(`/productions/${encodeURIComponent(production.id)}`);
    }
  }, [data, router]);

  if (error) return <p className="form-error">{error}</p>;
  if (loading && !data) return <p className="notice">בוחר ערך אקראי…</p>;
  if (data && data.people.length === 0 && data.productions.length === 0) {
    return <p className="muted">אין ערכים במאגר.</p>;
  }
  return <p className="notice">בוחר ערך אקראי…</p>;
}
