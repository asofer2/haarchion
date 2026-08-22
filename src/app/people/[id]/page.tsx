"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AdminInbox } from "@/components/AdminInbox";
import { EntityImage } from "@/components/EntityImage";
import { EntityProvenance } from "@/components/EntityProvenance";
import { OwnerActions } from "@/components/OwnerActions";
import { isAdminPerson, isSiteAdmin } from "@/lib/admin";
import { useArchive } from "@/hooks/useArchive";
import {
  calcAge,
  findById,
  canEditArchive,
  formatDateNumeric,
} from "@/lib/data";
import {
  ishimRoleHeading,
  ISHIM_HEADING_ORDER,
} from "@/lib/ishim-person";
import {
  ACTIVITY_LABELS,
  type CreditRole,
  type Production,
} from "@/lib/types";

function hasHebrew(value: string): boolean {
  return /[\u0590-\u05FF]/.test(value);
}

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useArchive();
  const { user } = useAuth();

  const person = data ? findById(data.people, params.id) : undefined;

  const byRole = useMemo(() => {
    if (!data || !person) {
      return [] as {
        heading: string;
        items: {
          production: Production;
          role: CreditRole;
          characterName?: string;
          year?: number;
        }[];
      }[];
    }

    const credits = data.credits.filter(
      (c) =>
        c.personId === person.id ||
        c.personId === `${person.id}-w2` ||
        c.personId.replace(/-w2$/i, "") === person.id
    );

    const map = new Map<
      string,
      { production: Production; role: CreditRole; characterName?: string; year?: number }[]
    >();

    for (const credit of credits) {
      const production = data.productions.find((p) => p.id === credit.productionId);
      if (!production) continue;
      const heading = ishimRoleHeading(credit.role);
      const list = map.get(heading) || [];
      if (
        !list.some(
          (x) =>
            x.production.id === production.id &&
            x.role === credit.role &&
            (x.year || production.year) === (credit.year || production.year) &&
            (x.characterName || "") === (credit.characterName || "")
        )
      ) {
        list.push({
          production,
          role: credit.role,
          characterName: credit.characterName,
          year: credit.year || production.year,
        });
      }
      map.set(heading, list);
    }

    return [...map.entries()]
      .map(([heading, items]) => ({
        heading,
        items: items.sort(
          (a, b) => (b.year || b.production.year) - (a.year || a.production.year)
        ),
      }))
      .sort((a, b) => {
        const ia = ISHIM_HEADING_ORDER.indexOf(a.heading);
        const ib = ISHIM_HEADING_ORDER.indexOf(b.heading);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
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

  const age = calcAge(person.birthDate, person.deathDate);
  const bornName =
    person.nicknames.filter(Boolean).join(" / ") ||
    (person.nameOriginal && hasHebrew(person.nameOriginal)
      ? person.nameOriginal
      : "");
  const activityLabels = [...new Set(person.activities || [])];
  const tagKeys = person.tags.filter(
    (tag) => !activityLabels.some((a) => ACTIVITY_LABELS[a] === tag)
  );
  const hasKeys = activityLabels.length > 0 || tagKeys.length > 0;

  return (
    <article className="detail-layout ishim-person">
      <div className="detail-poster">
        <EntityImage src={person.imageUrl} alt={person.name} />
      </div>
      <div className="detail-content">
        <div className="ishim-person-head">
          <h1>{person.name}</h1>
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
        {isAdminPerson(person) && isSiteAdmin(user) && (
          <div className="admin-inbox-embed">
            <p className="notice">
              בקשות שינוי של משתמשים אחרים — לחצו כן כדי לפרסם באתר, או לא כדי
              לדחות.
            </p>
            <AdminInbox compact />
          </div>
        )}

        <dl className="ishim-facts">
          {age !== undefined && (
            <div>
              <dt>גיל:</dt>
              <dd>
                {age}
                {person.deathDate
                  ? ` (נפטר/ה ב-${formatDateNumeric(person.deathDate)})`
                  : ""}
              </dd>
            </div>
          )}
          {person.birthDate && (
            <div>
              <dt>נולד ב:</dt>
              <dd>{formatDateNumeric(person.birthDate)}</dd>
            </div>
          )}
          {bornName && (
            <div>
              <dt>נולד בשם:</dt>
              <dd>{bornName}</dd>
            </div>
          )}
          {person.nameOriginal && !hasHebrew(person.nameOriginal) && (
            <div>
              <dt>שם באנגלית:</dt>
              <dd>{person.nameOriginal}</dd>
            </div>
          )}
          {hasKeys && (
            <div className="ishim-keys">
              <dt>מפתחות:</dt>
              <dd>
                {activityLabels.map((activity) => (
                  <Link
                    key={activity}
                    href={`/categories/${activity}`}
                    className="ishim-key"
                  >
                    {ACTIVITY_LABELS[activity]}
                  </Link>
                ))}
                {tagKeys.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="ishim-key"
                  >
                    {tag}
                  </Link>
                ))}
              </dd>
            </div>
          )}
          {person.wikipediaUrl && (
            <div>
              <dt>קישורים:</dt>
              <dd>
                <a href={person.wikipediaUrl} target="_blank" rel="noreferrer">
                  ויקיפדיה
                </a>
              </dd>
            </div>
          )}
        </dl>

        {byRole.map((group) => (
          <section key={group.heading} className="ishim-role">
            <h3>{group.heading}</h3>
            <ul className="ishim-credits">
              {group.items.map((item) => (
                <li
                  key={`${item.production.id}-${item.role}-${item.year || ""}-${item.characterName || ""}`}
                >
                  <span className="ishim-year">
                    {item.year || item.production.year || ""}
                  </span>
                  <div className="ishim-credit-body">
                    <Link
                      href={`/productions/${encodeURIComponent(item.production.id)}`}
                    >
                      {item.production.title}
                    </Link>
                    {item.characterName ? (
                      <span className="ishim-chars">{item.characterName}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {(person.discography?.length || 0) > 0 && (
          <section className="ishim-role">
            <h3>דיסקוגרפיה</h3>
            <ul className="ishim-credits">
              {person.discography!.map((item) => (
                <li key={`${item.title}-${item.year || ""}`}>
                  <span className="ishim-year">{item.year || ""}</span>
                  <div className="ishim-credit-body">
                    <strong>{item.title}</strong>
                    {item.kind || item.note ? (
                      <span className="ishim-chars">
                        {[item.kind, item.note].filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {person.bio?.trim() && (
          <section className="ishim-role">
            <h3>כללי</h3>
            <div className="prose ishim-notes">{person.bio}</div>
          </section>
        )}

        <EntityProvenance
          entityType="person"
          entityId={person.id}
          entity={person}
          contributions={data?.contributions || []}
        />
      </div>
    </article>
  );
}
