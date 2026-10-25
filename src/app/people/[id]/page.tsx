"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AdminInbox } from "@/components/AdminInbox";
import { ArchiveSkeleton } from "@/components/ArchiveSkeleton";
import { EntityImage } from "@/components/EntityImage";
import { EntityProvenance } from "@/components/EntityProvenance";
import { OwnerActions } from "@/components/OwnerActions";
import { isAdminPerson, isSiteAdmin } from "@/lib/admin";
import { useArchive } from "@/hooks/useArchive";
import {
  calcAge,
  findById,
  canEditArchive,
} from "@/lib/data";
import { PersonDateLinks } from "@/components/PersonDateLinks";
import { IshimCreditLine } from "@/components/IshimCreditLine";
import {
  formatIshimCharacters,
  ISHIM_HEADING_ORDER,
} from "@/lib/ishim-person";
import {
  genderedActivityLabel,
  genderedBornAsLabel,
  genderedBornInline,
  genderedBornLabel,
  genderedDiedInline,
  genderedDiedLabel,
  inferPersonGender,
  personCreditHeading,
} from "@/lib/person-gender";
import { groupIshimCredits } from "@/lib/ishim-credits";
import { FILMOGRAPHY_FILLER_IDS } from "@/lib/filmography";
import { canonicalProductionId } from "@/lib/production-aliases";
import {
  ACTIVITY_LABELS,
  type ActivityCategory,
  type Credit,
  type CreditRole,
  type Person,
  type Production,
} from "@/lib/types";

type PersonBundle = {
  person: Person;
  credits: Credit[];
  productions: Production[];
};

function isFillerCredit(credit: Credit): boolean {
  return (
    FILMOGRAPHY_FILLER_IDS.has(credit.productionId) &&
    !credit.characterName?.trim() &&
    !credit.heading?.trim()
  );
}

function hasHebrew(value: string): boolean {
  return /[\u0590-\u05FF]/.test(value);
}

export default function PersonDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useArchive();
  const { user } = useAuth();
  const [bundle, setBundle] = useState<PersonBundle | null>(null);
  const [bundleState, setBundleState] = useState<"loading" | "ready" | "miss">(
    "loading"
  );

  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return;
    let cancelled = false;
    setBundle(null);
    setBundleState("loading");
    void fetch(`/api/people/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as PersonBundle;
      })
      .then((json) => {
        if (cancelled) return;
        if (!json?.person || !Array.isArray(json.credits)) {
          setBundleState("miss");
          return;
        }
        setBundle(json);
        setBundleState("ready");
      })
      .catch(() => {
        if (!cancelled) setBundleState("miss");
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const person =
    bundle?.person ?? (data ? findById(data.people, params.id) : undefined);
  const gender = person ? inferPersonGender(person) : undefined;

  const byRole = useMemo(() => {
    if (!person) {
      return [] as {
        heading: string;
        items: ReturnType<typeof groupIshimCredits>;
      }[];
    }

    const belongsToPerson = (credit: Credit) =>
      credit.personId === person.id ||
      credit.personId === `${person.id}-w2` ||
      credit.personId.replace(/-w2$/i, "") === person.id;
    // The role API is the classic Ishim list. Edit mode reads the full catalog,
    // which also has Hop Tamir and later credits for the same person.
    const creditKey = (credit: Credit) =>
      [
        credit.productionId,
        credit.role,
        credit.year || "",
        credit.endYear || "",
        credit.characterName || "",
        credit.heading || "",
      ].join("|");
    const creditMap = new Map<string, Credit>();
    for (const credit of bundle?.credits ?? []) {
      if (belongsToPerson(credit)) creditMap.set(creditKey(credit), credit);
    }
    for (const credit of data?.credits ?? []) {
      if (!belongsToPerson(credit)) continue;
      const key = creditKey(credit);
      if (!creditMap.has(key)) creditMap.set(key, credit);
    }
    const productionMap = new Map<string, Production>();
    for (const production of bundle?.productions ?? []) {
      productionMap.set(production.id, production);
    }
    for (const production of data?.productions ?? []) {
      if (!productionMap.has(production.id)) productionMap.set(production.id, production);
    }
    const sourceProductions = [...productionMap.values()];
    let credits = [...creditMap.values()];
    if (credits.some((credit) => !isFillerCredit(credit))) {
      credits = credits.filter((credit) => !isFillerCredit(credit));
    }

    const seenProductionRole = new Set<string>();
    const map = new Map<
      string,
      {
        production: Production;
        role: CreditRole;
        characterName?: string;
        year?: number;
        billingOrder?: number;
      }[]
    >();

    for (const credit of credits) {
      const listed = sourceProductions.find((p) => p.id === credit.productionId);
      if (!listed) continue;
      const canonicalId = canonicalProductionId(listed.id);
      const production =
        canonicalId === listed.id
          ? listed
          : sourceProductions.find((item) => item.id === canonicalId) ||
            data?.productions.find((item) => item.id === canonicalId) || {
              ...listed,
              id: canonicalId,
            };
      const productionRole = `${production.id}|${credit.role}`;
      if (seenProductionRole.has(productionRole)) continue;
      seenProductionRole.add(productionRole);
      const heading = personCreditHeading(credit, gender);
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
          billingOrder: credit.billingOrder,
        });
      }
      map.set(heading, list);
    }

    return [...map.entries()]
      .map(([heading, items]) => ({
        heading,
        items: groupIshimCredits(
          items.sort((a, b) => {
            const ba = a.billingOrder;
            const bb = b.billingOrder;
            if (ba !== undefined && bb !== undefined && ba !== bb) return ba - bb;
            if (ba !== undefined && bb === undefined) return -1;
            if (ba === undefined && bb !== undefined) return 1;
            return (b.year || b.production.year) - (a.year || a.production.year);
          })
        ),
      }))
      .sort((a, b) => {
        const ia = ISHIM_HEADING_ORDER.indexOf(a.heading);
        const ib = ISHIM_HEADING_ORDER.indexOf(b.heading);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
  }, [bundle, data, person, gender]);

  if (bundleState === "loading" || (loading && !data && !person)) {
    return <ArchiveSkeleton label="טוען…" cards={4} />;
  }
  if (error && !person) return <p className="form-error">{error}</p>;
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
  const showActivityKeys = !person.ishimClassic && activityLabels.length > 0;
  const showTagKeys = tagKeys.length > 0;
  const hasKeys = showActivityKeys || showTagKeys;

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
                {person.birthDate ? (
                  <>
                    {" "}
                    ({genderedBornInline(gender)}
                    <PersonDateLinks iso={person.birthDate} kind="birth" />)
                  </>
                ) : null}
                {person.deathDate ? (
                  <>
                    {" "}
                    ({genderedDiedInline(gender)}
                    <PersonDateLinks iso={person.deathDate} kind="death" />)
                  </>
                ) : null}
              </dd>
            </div>
          )}
          {age === undefined && person.birthDate && (
            <div>
              <dt>{genderedBornLabel(gender)}</dt>
              <dd>
                <PersonDateLinks iso={person.birthDate} kind="birth" />
              </dd>
            </div>
          )}
          {age === undefined && person.deathDate && (
            <div>
              <dt>{genderedDiedLabel(gender)}</dt>
              <dd>
                <PersonDateLinks iso={person.deathDate} kind="death" />
              </dd>
            </div>
          )}
          {bornName && (
            <div>
              <dt>{genderedBornAsLabel(gender)}</dt>
              <dd>{bornName}</dd>
            </div>
          )}
          {person.nameOriginal &&
            !hasHebrew(person.nameOriginal) &&
            !person.ishimClassic && (
            <div>
              <dt>שם באנגלית:</dt>
              <dd>{person.nameOriginal}</dd>
            </div>
          )}
          {hasKeys && (
            <div className="ishim-keys">
              <dt>מפתחות:</dt>
              <dd>
                {showActivityKeys &&
                  activityLabels.map((activity) => (
                    <Link
                      key={activity}
                      href={`/categories/${activity}`}
                      className="ishim-key"
                    >
                      {activity === "acting" || activity === "dubbing"
                        ? genderedActivityLabel(activity, gender)
                        : ACTIVITY_LABELS[activity as ActivityCategory]}
                    </Link>
                  ))}
                {showTagKeys &&
                  tagKeys.map((tag) => (
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
          {!person.ishimClassic && person.wikipediaUrl && (
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
              {group.items.map((item) => {
                const year = item.year || item.production.year || "";
                const characters = item.characters
                  .map((name) => formatIshimCharacters(name))
                  .filter(Boolean)
                  .join(" / ");
                return (
                  <IshimCreditLine
                    key={`${item.production.id}-${item.role}-${year}-${characters}`}
                    href={`/productions/${encodeURIComponent(item.production.id)}`}
                    year={year}
                    lead={item.production.title}
                    characters={characters || undefined}
                  />
                );
              })}
            </ul>
          </section>
        ))}

        {!person.ishimClassic && (person.discography?.length || 0) > 0 && (
          <section className="ishim-role">
            <h3>דיסקוגרפיה</h3>
            <ul className="ishim-credits">
              {person.discography!.map((item) => (
                <IshimCreditLine
                  key={`${item.title}-${item.year || ""}`}
                  href={`/search?q=${encodeURIComponent(item.title)}`}
                  year={item.year || ""}
                  lead={item.title}
                  characters={[item.kind, item.note].filter(Boolean).join(" · ")}
                />
              ))}
            </ul>
          </section>
        )}

        {person.ishimNotes?.map((note) => (
          <section key={note.heading} className="ishim-role">
            <h3>{note.heading}</h3>
            <ul className="ishim-notes-list">
              {note.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        {person.bio?.trim() &&
          (!person.ishimClassic ||
            !person.ishimNotes?.some((n) => n.heading === "כללי")) && (
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
