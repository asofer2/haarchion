"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useArchive } from "@/hooks/useArchive";
import { bornToday, formatDateHe, recentUpdates } from "@/lib/data";
import { directoryCount, ISHIM_DIRECTORY } from "@/lib/ishim-directory";

export default function HomePage() {
  const { data, loading, error } = useArchive();

  const kindCounts = useMemo(() => {
    if (!data) return [];
    return ISHIM_DIRECTORY.map((item) => ({
      item,
      count: directoryCount(item, data.people, data.productions),
    }));
  }, [data]);

  if (loading && !data) return <p className="notice">טוען את אישים…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  const todayPeople = bornToday(data.people);
  const latest = recentUpdates(data, 3);

  return (
    <>
      <section className="hero">
        <p className="meta">מאגר ישראלי · דיבוב · מחזמר · קלטות · במה</p>
        <h1>אישים</h1>
        <p className="hero-welcome">ברוכים הבאים לאתר אישים</p>
      </section>

      <section className="section" style={{ marginTop: "0.5rem" }}>
        <div className="category-grid compact">
          {kindCounts.map(({ item, count }) => (
            <Link key={item.label} href={item.listHref} className="category-card">
              <h2>{item.label}</h2>
              <p>{count}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>לוח שנה</h2>
          <Link href="/y">כל התאריכים</Link>
        </div>
        {todayPeople.length === 0 ? (
          <p className="muted">אין ימי הולדת היום בארכיון.</p>
        ) : (
          <div className="link-list">
            {todayPeople.map((person) => (
              <div key={person.id} className="link-list-row">
                <Link href={`/people/${encodeURIComponent(person.id)}`}>
                  {person.name}
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {latest.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>עדכונים אחרונים</h2>
          </div>
          <ul className="activity-list">
            {latest.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <span className="chip">
                  {item.action === "create" ? "נוסף" : "עודכן"}
                </span>{" "}
                <Link href={item.href}>{item.title}</Link>
                <span className="meta"> · {formatDateHe(item.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
