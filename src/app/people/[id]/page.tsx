"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EntityImage } from "@/components/EntityImage";
import { OwnerActions } from "@/components/OwnerActions";
import { useArchive } from "@/hooks/useArchive";
import { formatDateHe, findById, canEditArchive, ageLabel } from "@/lib/data";
import {
  formatProductionTitle,
  showsActivityYearsInTitle,
} from "@/lib/production-title";
import {
  ACTIVITY_LABELS,
  CREDIT_ROLE_LABELS,
  kindToActivity,
  roleToActivity,
  type ActivityCategory,
  type CreditRole,
  type Production,
} from "@/lib/types";

/** A credit can belong to more than one activity bucket (e.g. dubbing + film). */
function activitiesForCredit(
  role: CreditRole,
  kind: Production["kind"]
): ActivityCategory[] {
  const set = new Set<ActivityCategory>();
  set.add(kindToActivity(kind));
  set.add(roleToActivity(role));
  if (role === "dubber" || role === "dub_director") set.add("dubbing");
  if (role === "actor") set.add("acting");
  if (role === "musical_performer" || role === "singer") {
    set.add("musical");
    set.add("performance");
  }
  if (role === "host") set.add("hosting");
  return [...set];
}

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useArchive();
  const { user } = useAuth();

  const person = data ? findById(data.people, params.id) : undefined;

  const byActivity = useMemo(() => {
    if (!data || !person) {
      return [] as {
        activity: ActivityCategory;
        items: { production: Production; role: CreditRole; characterName?: string }[];
      }[];
    }

    const credits = data.credits.filter(
      (c) =>
        c.personId === person.id ||
        c.personId === `${person.id}-w2` ||
        c.personId.replace(/-w2$/i, "") === person.id
    );

    const map = new Map<
      ActivityCategory,
      { production: Production; role: CreditRole; characterName?: string }[]
    >();

    for (const activity of person.activities || []) {
      if (!map.has(activity)) map.set(activity, []);
    }

    for (const credit of credits) {
      const production = data.productions.find((p) => p.id === credit.productionId);
      if (!production) continue;
      const buckets = activitiesForCredit(credit.role, production.kind);
      for (const activity of buckets) {
        const list = map.get(activity) || [];
        if (
          !list.some(
            (x) => x.production.id === production.id && x.role === credit.role
          )
        ) {
          list.push({
            production,
            role: credit.role,
            characterName: credit.characterName,
          });
        }
        map.set(activity, list);
      }
    }

    // Only show categories that are on the person OR have linked items
    return [...map.entries()]
      .filter(
        ([activity, items]) =>
          items.length > 0 || (person.activities || []).includes(activity)
      )
      .map(([activity, items]) => ({
        activity,
        items: items.sort((a, b) => b.production.year - a.production.year),
      }))
      .sort((a, b) => {
        if (b.items.length !== a.items.length) return b.items.length - a.items.length;
        return ACTIVITY_LABELS[a.activity].localeCompare(
          ACTIVITY_LABELS[b.activity],
          "he"
        );
      });
  }, [data, person]);

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!person) {
    return (
      <div>
        <p className="form-error">האישיות לא נמצאה</p>
        <p className="notice">
          נסו מ־
          <Link href="/me">הספרייה שלי</Link> או{" "}
          <Link href="/search">חיפוש לפי שם</Link>.
        </p>
        <Link href="/people" className="btn btn-ghost">
          חזרה לאישים
        </Link>
      </div>
    );
  }

  const totalLinked = byActivity.reduce((n, g) => n + g.items.length, 0);
  const ageText = ageLabel(person.birthDate, person.deathDate);

  return (
    <article className="detail-layout">
      <div className="detail-poster">
        <EntityImage src={person.imageUrl} alt={person.name} />
      </div>
      <div className="detail-content">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1>{person.name}</h1>
            {person.nameOriginal && <p className="meta">{person.nameOriginal}</p>}
          </div>
          {canEditArchive(user) && (
            <OwnerActions
              kind="person"
              id={person.id}
              title={person.name}
              canEdit
              canDelete
            />
          )}
        </div>

        <div className="chip-row">
          {(person.activities || []).map((activity) => {
            const count =
              byActivity.find((g) => g.activity === activity)?.items.length || 0;
            return (
              <Link
                key={activity}
                href={`/categories/${activity}`}
                className="chip chip-link"
              >
                {ACTIVITY_LABELS[activity]}
                {count > 0 ? ` (${count})` : ""}
              </Link>
            );
          })}
          {person.birthDate && (
            <span className="chip">נולד/ה {formatDateHe(person.birthDate)}</span>
          )}
          {ageText && <span className="chip">{ageText}</span>}
          {person.deathDate && (
            <span className="chip">נפטר/ה {formatDateHe(person.deathDate)}</span>
          )}
          {person.nicknames.map((n) => (
            <span key={n} className="chip">
              כינוי: {n}
            </span>
          ))}
          {person.tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>

        <p className="prose">{person.bio || "אין ביוגרפיה עדיין."}</p>

        {person.wikipediaUrl && (
          <p className="notice" style={{ marginTop: "0.75rem" }}>
            <a href={person.wikipediaUrl} target="_blank" rel="noreferrer">
              ויקיפדיה
            </a>
          </p>
        )}

        {(person.discography?.length || 0) > 0 && (
          <section className="credit-groups" style={{ marginTop: "1.5rem" }}>
            <h2 className="page-title" style={{ fontSize: "1.4rem" }}>
              דיסקוגרפיה
            </h2>
            <p className="muted" style={{ marginTop: 0 }}>
              {person.discography!.length} ערכים מוויקיפדיה / ויקידאטה
            </p>
            <ul className="activity-list">
              {person.discography!.map((item) => (
                <li key={`${item.title}-${item.year || ""}`}>
                  <strong>{item.title}</strong>
                  <span className="meta">
                    {item.year ? ` · ${item.year}` : ""}
                    {item.kind ? ` · ${item.kind}` : ""}
                    {item.note ? ` · ${item.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="credit-groups">
          <h2 className="page-title" style={{ fontSize: "1.4rem" }}>
            פעילויות לפי קטגוריה
          </h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {totalLinked > 0
              ? `${totalLinked} קישורי הפקות לפי תפקיד וסוג`
              : "עדיין אין הפקות מקושרות — ערכו את האישיות והוסיפו הפקות לכל קטגוריה"}
          </p>
          {byActivity.map((group) => (
            <div key={group.activity} className="credit-group activity-block">
              <h3>
                <Link href={`/categories/${group.activity}`}>
                  {ACTIVITY_LABELS[group.activity]}
                </Link>
                <span className="meta"> ({group.items.length})</span>
              </h3>
              {group.items.length === 0 ? (
                <p className="muted">אין הפקות מקושרות בקטגוריה זו עדיין.</p>
              ) : (
                <ul className="activity-list">
                  {group.items.map((item) => (
                    <li key={`${item.production.id}-${item.role}`}>
                      <Link
                        href={`/productions/${encodeURIComponent(item.production.id)}`}
                      >
                        {formatProductionTitle(item.production)}
                      </Link>
                      <span className="meta">
                        {" "}
                        {!showsActivityYearsInTitle(item.production.kind) &&
                        item.production.year
                          ? `· ${item.production.year} `
                          : ""}
                        · {CREDIT_ROLE_LABELS[item.role]}
                        {item.characterName ? ` · ${item.characterName}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      </div>
    </article>
  );
}
