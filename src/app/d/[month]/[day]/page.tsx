"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useArchive } from "@/hooks/useArchive";
import type { Person } from "@/lib/types";
import {
  hebrewDayTitle,
  parseMonthDayParam,
  peopleBornOnDay,
  peopleDiedOnDay,
  shiftCalendarDay,
  yearFromIso,
} from "@/lib/year-calendar";

function PersonRow({
  person,
  date,
  kind,
}: {
  person: Person;
  date?: string;
  kind: "birth" | "death";
}) {
  const year = yearFromIso(date);
  const yearLink =
    year && kind === "birth" ? `/y/${year}#born` : year ? `/y/${year}#died` : undefined;
  return (
    <div className="year-person">
      {year ? (
        <span className="year-person-date">
          {yearLink ? (
            <Link href={yearLink} className="ishim-date-link">
              {year}
            </Link>
          ) : (
            year
          )}
        </span>
      ) : null}
      <Link href={`/people/${encodeURIComponent(person.id)}`}>
        {person.name}
      </Link>
    </div>
  );
}

export default function DayPage() {
  const params = useParams<{ month: string; day: string }>();
  const parsed = parseMonthDayParam(params.month, params.day);
  const { data, loading, error } = useArchive();

  const born = useMemo(
    () =>
      data && parsed
        ? peopleBornOnDay(data.people, parsed.month, parsed.day)
        : [],
    [data, parsed]
  );
  const died = useMemo(
    () =>
      data && parsed
        ? peopleDiedOnDay(data.people, parsed.month, parsed.day)
        : [],
    [data, parsed]
  );

  if (!parsed) {
    return (
      <p className="form-error">
        תאריך לא תקין. <Link href="/y">ללוח השנה</Link>
      </p>
    );
  }

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  const prev = shiftCalendarDay(parsed.month, parsed.day, -1);
  const next = shiftCalendarDay(parsed.month, parsed.day, 1);
  const title = hebrewDayTitle(parsed.month, parsed.day);

  return (
    <div className="year-calendar">
      <h1 className="year-title year-title-day">
        <Link
          href={`/d/${prev.month}/${prev.day}`}
          className="year-arrow"
          aria-label={`יום קודם, ${hebrewDayTitle(prev.month, prev.day)}`}
        >
          →
        </Link>
        <span>{title}</span>
        <Link
          href={`/d/${next.month}/${next.day}`}
          className="year-arrow"
          aria-label={`יום הבא, ${hebrewDayTitle(next.month, next.day)}`}
        >
          ←
        </Link>
      </h1>
      <p className="meta" style={{ textAlign: "center" }}>
        <Link href="/y">לוח שנה לפי שנים</Link>
      </p>

      <section id="born" className="year-section">
        <h2>נולדו</h2>
        {born.length === 0 ? (
          <p className="muted">אין אישים במאגר שנולדו ביום זה.</p>
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
        <h2>נפטרו</h2>
        {died.length === 0 ? (
          <p className="muted">אין אישים במאגר שנפטרו ביום זה.</p>
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
