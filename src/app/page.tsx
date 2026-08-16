"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PersonCard } from "@/components/PersonCard";
import { ProductionCard } from "@/components/ProductionCard";
import { useArchive } from "@/hooks/useArchive";
import {
  bornToday,
  formatDateHe,
  recentUpdates,
} from "@/lib/data";
import { categoryCounts } from "@/lib/category-filter";
import { ACTIVITY_LABELS, ACTIVITY_LIST } from "@/lib/types";

export default function HomePage() {
  const { data, loading, error } = useArchive();

  const counts = useMemo(() => (data ? categoryCounts(data) : null), [data]);

  if (loading && !data) return <p className="notice">טוען את אישים…</p>;
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  const todayPeople = bornToday(data.people);
  const latest = recentUpdates(data, 3);
  const dubbers = data.people
    .filter((p) => (p.activities || []).includes("dubbing"))
    .slice(0, 8);
  const recentProductions = [...data.productions]
    .filter((p) =>
      [
        "cassette",
        "cassette_kids",
        "festival",
        "musical",
        "series",
        "tv_series",
        "tv_program",
        "series_israeli_foreign_dubbed",
        "film",
        "film_cinema",
        "film_dubbed_foreign",
        "film_student",
      ].includes(p.kind)
    )
    .slice(0, 6);

  return (
    <>
      <section className="hero">
        <p className="meta">מאגר ישראלי · דיבוב · מחזמר · קלטות · במה</p>
        <h1>אישים</h1>
        <p className="hero-welcome">ברוכים הבאים לאתר אישים</p>
        <div className="hero-actions">
          <Link href="/people" className="btn btn-primary">
            אישים
          </Link>
          <Link href="/categories" className="btn btn-ghost">
            קטגוריות
          </Link>
          <Link href="/people/new" className="btn btn-ghost">
            הוספת אישיות
          </Link>
          <Link href="/me" className="btn btn-ghost">
            הספרייה שלי
          </Link>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>עדכונים אחרונים</h2>
            <p>3</p>
          </div>
          <ul className="activity-list">
            {latest.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <span className="chip">
                  {item.action === "create" ? "נוסף" : "עודכן"}
                </span>{" "}
                <Link href={item.href}>{item.title}</Link>
                <span className="meta">
                  {" "}
                  · {item.kind === "person" ? "אישיות" : "הפקה"} ·{" "}
                  {formatDateHe(item.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>עיון לפי קטגוריה</h2>
          <Link href="/categories">הכול</Link>
        </div>
        <div className="category-grid compact">
          {ACTIVITY_LIST.map((cat) => {
            const c = counts?.[cat];
            return (
              <Link key={cat} href={`/categories/${cat}`} className="category-card">
                <h2>{ACTIVITY_LABELS[cat]}</h2>
                <p>
                  {c?.people ?? 0} אישים
                  {c?.productions ? ` · ${c.productions} הפקות` : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>ימי הולדת היום</h2>
          <p>{todayPeople.length}</p>
        </div>
        {todayPeople.length === 0 ? (
          <p className="muted">אין ימי הולדת היום בארכיון.</p>
        ) : (
          <div className="grid-cards">
            {todayPeople.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>מדבבים ישראלים</h2>
          <Link href="/categories/dubbing">לקטגוריה</Link>
        </div>
        <div className="grid-cards">
          {dubbers.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>הפקות נבחרות</h2>
          <Link href="/productions">הכול</Link>
        </div>
        <div className="grid-cards">
          {recentProductions.map((production) => (
            <ProductionCard key={production.id} production={production} />
          ))}
        </div>
      </section>
    </>
  );
}
