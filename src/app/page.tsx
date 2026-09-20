"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AdminInbox } from "@/components/AdminInbox";
import { PersonCard } from "@/components/PersonCard";
import { useAuth } from "@/components/AuthProvider";
import { isSiteAdmin } from "@/lib/admin";
import { useArchive } from "@/hooks/useArchive";
import { bornToday, formatDateHe, recentUpdates } from "@/lib/data";
import { formatProductionTitle } from "@/lib/production-title";
import { upcomingProductions } from "@/lib/types";
import { directoryCount, ISHIM_DIRECTORY } from "@/lib/ishim-directory";

export default function HomePage() {
  const { data, loading, error } = useArchive();
  const { user } = useAuth();
  const admin = isSiteAdmin(user);

  const kindCounts = useMemo(() => {
    if (!data) {
      return ISHIM_DIRECTORY.map((item) => ({ item, count: null as number | null }));
    }
    return ISHIM_DIRECTORY.map((item) => ({
      item,
      count: directoryCount(item, data.people, data.productions),
    }));
  }, [data]);

  const todayPeople = data ? bornToday(data.people) : [];
  const latest = data ? recentUpdates(data, 3) : [];
  const upcoming = data ? upcomingProductions(data.productions, 8) : [];

  return (
    <>
      <section className="hero">
        <p className="meta">מאגר ישראלי · דיבוב · מחזמר · קלטות · במה</p>
        <h1>אישים</h1>
        <p className="hero-welcome">ברוכים הבאים לאתר אישים</p>
        <p className="hero-actions">
          <Link href="/ishur" className="btn btn-primary">
            פאנל ניהול — בקשות לאישור
          </Link>
        </p>
      </section>
      {admin && (
        <section className="section" style={{ marginTop: "1rem" }}>
          <div className="section-head">
            <h2>פאנל ניהול — בקשות לאישור</h2>
          </div>
          <AdminInbox compact />
        </section>
      )}

      <section className="section" style={{ marginTop: "0.5rem" }}>
        <div className="category-grid compact">
          {kindCounts.map(({ item, count }) => (
            <Link key={item.label} href={item.listHref} className="category-card">
              <h2>{item.label}</h2>
              <p>{count === null ? (loading ? "…" : "—") : count}</p>
            </Link>
          ))}
        </div>
      </section>

      {error && !data ? (
        <p className="form-error">{error}</p>
      ) : (
        <>
          <section className="section">
            <div className="section-head">
              <h2>נולדו היום</h2>
              <Link href="/y">לוח שנה</Link>
            </div>
            {loading && !data ? (
              <p className="muted">טוען…</p>
            ) : todayPeople.length === 0 ? (
              <p className="muted">אין ימי הולדת היום בארכיון.</p>
            ) : (
              <div className="grid-cards">
                {todayPeople.map((person) => (
                  <PersonCard key={person.id} person={person} />
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

          <section className="section">
            <div className="section-head">
              <h2>עתידי</h2>
            </div>
            {loading && !data ? (
              <p className="muted">טוען…</p>
            ) : upcoming.length === 0 ? (
              <p className="muted">
                אין הפקות עתידיות בארכיון. בעריכת סדרה או סרט אפשר לבחור סטטוס
                «עתידי» (או «משודר כעת» / «הסתיים»).
              </p>
            ) : (
              <ul className="activity-list">
                {upcoming.map((production) => (
                  <li key={production.id}>
                    <span className="chip">עתידי</span>{" "}
                    <Link
                      href={`/productions/${encodeURIComponent(production.id)}`}
                    >
                      {formatProductionTitle(production)}
                    </Link>
                    <span className="meta"> · {production.year}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
