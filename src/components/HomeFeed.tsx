import Link from "next/link";
import { PersonCard } from "@/components/PersonCard";
import { getCachedHomeSummary, formatDateHe } from "@/lib/home-summary";
import type { Person } from "@/lib/types";

/** Server-rendered homepage widgets (ISR via unstable_cache / revalidate). */
export async function HomeFeed() {
  const summary = await getCachedHomeSummary();

  return (
    <>
      <section className="section" style={{ marginTop: "0.5rem" }}>
        <div className="category-grid compact">
          {summary.kindCounts.map((item) => (
            <Link key={item.label} href={item.listHref} className="category-card">
              <h2>{item.label}</h2>
              <p>{item.count}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>נולדו היום</h2>
          <Link href="/y">לוח שנה</Link>
        </div>
        {summary.todayPeople.length === 0 ? (
          <p className="muted">אין ימי הולדת היום בארכיון.</p>
        ) : (
          <div className="grid-cards">
            {summary.todayPeople.map((row) => (
              <PersonCard
                key={row.id}
                person={{
                  id: row.id,
                  name: row.name,
                  imageUrl: row.imageUrl,
                  birthDate: row.birthDate,
                  deathDate: row.deathDate,
                  activities: row.activities as Person["activities"],
                  nicknames: [],
                  tags: [],
                  bio: "",
                  createdAt: "",
                  updatedAt: "",
                }}
              />
            ))}
          </div>
        )}
      </section>

      {summary.latest.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>עדכונים אחרונים</h2>
          </div>
          <ul className="activity-list">
            {summary.latest.map((item) => (
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
        {summary.upcoming.length === 0 ? (
          <p className="muted">
            אין הפקות עתידיות בארכיון. בעריכת סדרה או סרט אפשר לבחור סטטוס
            «עתידי» (או «משודר כעת» / «הסתיים»).
          </p>
        ) : (
          <ul className="activity-list">
            {summary.upcoming.map((production) => (
              <li key={production.id}>
                <span className="chip">עתידי</span>{" "}
                <Link
                  href={`/productions/${encodeURIComponent(production.id)}`}
                >
                  {production.title}
                </Link>
                <span className="meta"> · {production.year}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
