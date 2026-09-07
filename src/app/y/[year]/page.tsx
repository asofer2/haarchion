"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useArchive } from "@/hooks/useArchive";
import type { Person } from "@/lib/types";
import {
  compactDayMonth,
  monthDayFromIso,
  parseYearParam,
  peopleBornInYear,
  peopleDiedInYear,
} from "@/lib/year-calendar";

function dayMonthHref(iso: string | undefined, kind: "birth" | "death") {
  const md = monthDayFromIso(iso);
  if (!md) return undefined;
  return kind === "birth"
    ? `/d/${md.month}/${md.day}#born`
    : `/d/${md.month}/${md.day}#died`;
}

function PersonRow({
  person,
  date,
  kind,
}: {
  person: Person;
  date?: string;
  kind: "birth" | "death";
}) {
  const when = compactDayMonth(date);
  const href = dayMonthHref(date, kind);
  return (
    <div className="year-person">
      {when ? (
        <span className="year-person-date">
          {href ? (
            <Link href={href} className="ishim-date-link">
              {when}
            </Link>
          ) : (
            when
          )}
        </span>
      ) : null}
      <Link href={`/people/${encodeURIComponent(person.id)}`}>
        {person.name}
      </Link>
    </div>
  );
}

export default function YearPage() {
  const params = useParams<{ year: string }>();
  const year = parseYearParam(params.year);
  const { data, loading, error } = useArchive();

  const born = useMemo(
    () => (data && year ? peopleBornInYear(data.people, year) : []),
    [data, year]
  );
  const died = useMemo(
    () => (data && year ? peopleDiedInYear(data.people, year) : []),
    [data, year]
  );

  if (year === null) {
    return (
      <p className="form-error">
        שנה לא תקינה.{" "}
        <Link href="/y">לשנה הנוכחית</Link>
      </p>
    );
  }

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  const prevYear = year - 1;
  const nextYear = year + 1;

  return (
    <div className="year-calendar">
      <h1 className="year-title">
        <Link
          href={`/y/${prevYear}`}
          className="year-arrow"
          aria-label={`שנה קודמת, ${prevYear}`}
          title={`${prevYear}`}
        >
          →
        </Link>
        <span>{year}</span>
        <Link
          href={`/y/${nextYear}`}
          className="year-arrow"
          aria-label={`שנה הבאה, ${nextYear}`}
          title={`${nextYear}`}
        >
          ←
        </Link>
      </h1>

      <section id="born" className="year-section">
        <h2>נולדו ב-{year}</h2>
        {born.length === 0 ? (
          <p className="muted">אין אישים במאגר שנולדו בשנה זו.</p>
        ) : (
          <div className="year-people">
            {born.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                date={person.birthDate}
                kind="birth"
              />
            ))}
          </div>
        )}
      </section>

      <section id="died" className="year-section">
        <h2>נפטרו ב-{year}</h2>
        {died.length === 0 ? (
          <p className="muted">אין אישים במאגר שנפטרו בשנה זו.</p>
        ) : (
          <div className="year-people">
            {died.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                date={person.deathDate}
                kind="death"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
