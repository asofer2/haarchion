"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EntityImage } from "@/components/EntityImage";
import { OwnerActions } from "@/components/OwnerActions";
import { EntityProvenance } from "@/components/EntityProvenance";
import { useArchive } from "@/hooks/useArchive";
import { findById, canEditArchive } from "@/lib/data";
import { IshimCreditLine } from "@/components/IshimCreditLine";
import { compareBillingOrder } from "@/lib/credit-order";
import {
  formatIshimCharacters,
  ISHIM_HEADING_ORDER,
} from "@/lib/ishim-person";
import {
  formatCreditYearsBracket,
  formatProductionTitle,
  formatProductionYears,
  productionHasSingleYear,
} from "@/lib/production-title";
import {
  masculineCreditHeading,
  masculineRoleLabel,
} from "@/lib/person-gender";
import {
  airStatusLabel,
  productionKindLabel,
  resolveAirStatus,
  type Credit,
  type CreditRole,
  type Person,
  type Production,
} from "@/lib/types";

type CrewEntry = {
  person: Person;
  characterName?: string;
  creditYear?: number;
  creditEndYear?: number;
  billingOrder?: number;
  key: string;
};

function creditYearLabel(
  production: Production,
  creditYear?: number,
  creditEndYear?: number
): string | undefined {
  // Single-year productions: year already on the title — omit beside cast.
  if (productionHasSingleYear(production)) return undefined;
  if (!creditYear) return undefined;
  return formatCreditYearsBracket(creditYear, creditEndYear) || undefined;
}

function groupCreditsByHeading(
  credits: Credit[],
  people: Person[],
  productionId: string
): { heading: string; entries: CrewEntry[] }[] {
  const byHeading = new Map<string, CrewEntry[]>();

  for (const credit of credits) {
    if (credit.productionId !== productionId) continue;
    const person = people.find((p) => p.id === credit.personId);
    if (!person) continue;

    const heading = masculineCreditHeading(credit);
    const key = `${credit.personId}|${credit.role}|${credit.characterName || ""}|${heading}|${credit.year || ""}|${credit.endYear || ""}`;
    const list = byHeading.get(heading) || [];
    if (list.some((item) => item.key === key)) continue;
    list.push({
      person,
      characterName: credit.characterName,
      creditYear: credit.year,
      creditEndYear: credit.endYear,
      billingOrder: credit.billingOrder,
      key,
    });
    byHeading.set(heading, list);
  }

  return [...byHeading.entries()]
    .map(([heading, entries]) => ({
      heading,
      entries: entries.sort(compareBillingOrder),
    }))
    .sort((a, b) => {
      const ia = ISHIM_HEADING_ORDER.indexOf(a.heading);
      const ib = ISHIM_HEADING_ORDER.indexOf(b.heading);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

function groupCreditsByRole(
  credits: Credit[],
  people: Person[],
  production: Production
): { role: CreditRole; entries: CrewEntry[] }[] {
  const hasNamedDubCast = credits.some(
    (c) =>
      c.productionId === production.id &&
      (c.role === "dubber" || c.role === "singer") &&
      Boolean(c.characterName)
  );

  const byRole = new Map<CreditRole, CrewEntry[]>();
  for (const credit of credits) {
    if (credit.productionId !== production.id) continue;
    if (
      hasNamedDubCast &&
      (credit.role === "dubber" || credit.role === "singer") &&
      !credit.characterName
    ) {
      continue;
    }
    const person = people.find((p) => p.id === credit.personId);
    if (!person) continue;
    const key = `${credit.personId}|${credit.characterName || ""}`;
    const list = byRole.get(credit.role) || [];
    if (list.some((item) => item.key === key)) continue;
    list.push({
      person,
      characterName: credit.characterName,
      creditYear: credit.year,
      creditEndYear: credit.endYear,
      billingOrder: credit.billingOrder,
      key,
    });
    byRole.set(credit.role, list);
  }

  const roleOrder: CreditRole[] = [
    "dub_director",
    "dubber",
    "singer",
    "actor",
    "director",
    "writer",
    "producer",
    "composer",
    "musical_performer",
    "host",
    "cinematographer",
  ];

  return [...byRole.entries()]
    .map(([role, entries]) => ({
      role,
      entries: entries.sort(compareBillingOrder),
    }))
    .sort((a, b) => {
      const ai = roleOrder.indexOf(a.role);
      const bi = roleOrder.indexOf(b.role);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
}

function IshimProductionBody({
  production,
  creditGroups,
}: {
  production: Production;
  creditGroups: { heading: string; entries: CrewEntry[] }[];
}) {
  const years = formatProductionYears(production.year, production.endYear);

  return (
    <>
      <dl className="ishim-facts">
        {production.summary ? (
          <div>
            <dt>עלילה:</dt>
            <dd>{production.summary}</dd>
          </div>
        ) : null}
        {production.runtimeMinutes ? (
          <div>
            <dt>אורך:</dt>
            <dd>{production.runtimeMinutes} דקות</dd>
          </div>
        ) : null}
        {production.episodeCount ? (
          <div>
            <dt>פרקים:</dt>
            <dd>{production.episodeCount}</dd>
          </div>
        ) : null}
        <div>
          <dt>סוג:</dt>
          <dd>{productionKindLabel(production.kind)}</dd>
        </div>
        <div>
          <dt>סטטוס:</dt>
          <dd>{airStatusLabel(resolveAirStatus(production))}</dd>
        </div>
        {production.originalTitle ? (
          <div>
            <dt>במקור:</dt>
            <dd>{production.originalTitle}</dd>
          </div>
        ) : null}
        {(production.ishimKeys?.length || 0) > 0 ? (
          <div className="ishim-keys">
            <dt>מפתחות:</dt>
            <dd>
              {production.ishimKeys!.map((key) => (
                <Link
                  key={key}
                  href={`/search?q=${encodeURIComponent(key)}`}
                  className="ishim-key"
                >
                  {key}
                </Link>
              ))}
            </dd>
          </div>
        ) : null}
        {(production.genres?.length || 0) > 0 ? (
          <div className="ishim-keys">
            <dt>ז&apos;אנר:</dt>
            <dd>
              {production.genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/genres/${encodeURIComponent(genre)}`}
                  className="ishim-key"
                >
                  {genre}
                </Link>
              ))}
            </dd>
          </div>
        ) : null}
        {production.channel ? (
          <div>
            <dt>ערוץ שידור:</dt>
            <dd>{production.channel}</dd>
          </div>
        ) : null}
        {years ? (
          <div>
            <dt>שנים:</dt>
            <dd>{years}</dd>
          </div>
        ) : null}
      </dl>

      {creditGroups.map((group) => (
        <section key={group.heading} className="ishim-role">
          <h3>{group.heading}</h3>
          <ul className="ishim-production-credits">
            {group.entries.map((entry) => (
              <IshimCreditLine
                key={entry.key}
                href={`/people/${encodeURIComponent(entry.person.id)}`}
                year={creditYearLabel(
                  production,
                  entry.creditYear,
                  entry.creditEndYear
                )}
                yearAtEnd
                lead={entry.person.name}
                characters={formatIshimCharacters(entry.characterName) || undefined}
              />
            ))}
          </ul>
        </section>
      ))}

      {production.ishimNotes?.map((note) => (
        <section key={note.heading} className="ishim-role">
          <h3>{note.heading}</h3>
          <ul className="ishim-notes-list">
            {note.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export default function ProductionDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useArchive();
  const { user } = useAuth();

  const production = data ? findById(data.productions, params.id) : undefined;

  const ishimCreditGroups = useMemo(
    () =>
      data && production
        ? groupCreditsByHeading(data.credits, data.people, production.id)
        : [],
    [data, production]
  );

  const crew = useMemo(
    () =>
      data && production
        ? groupCreditsByRole(data.credits, data.people, production)
        : [],
    [data, production]
  );

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!production) return <p className="form-error">ההפקה לא נמצאה</p>;

  const displayTitle = formatProductionTitle(production);
  const years = formatProductionYears(production.year, production.endYear);
  const classic = production.ishimClassic;
  const ishimCastLayout =
    classic ||
    ishimCreditGroups.some(
      (g) =>
        g.entries.some((e) => Boolean(e.characterName)) ||
        /מדבב|דיבוב|שחק/.test(g.heading)
    );

  return (
    <article className={`detail-layout${classic ? " ishim-person" : ""}`}>
      <div className="detail-poster">
        <EntityImage src={production.imageUrl} alt={displayTitle} />
      </div>
      <div className="detail-content">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1>
              {production.title}
              {years ? ` (${years})` : ""}
            </h1>
            {!classic && production.originalTitle ? (
              <p className="meta">{production.originalTitle}</p>
            ) : null}
          </div>
          {canEditArchive(user) && (
            <OwnerActions
              kind="production"
              id={production.id}
              title={production.title}
              canEdit
              canDelete
            />
          )}
        </div>

        {ishimCastLayout ? (
          <IshimProductionBody
            production={production}
            creditGroups={ishimCreditGroups}
          />
        ) : (
          <>
            <div className="chip-row">
              <span className="chip">{productionKindLabel(production.kind)}</span>
              {years ? <span className="chip">{years}</span> : null}
              {production.channel && (
                <span className="chip">{production.channel}</span>
              )}
              {production.studio && (
                <span className="chip">{production.studio}</span>
              )}
              {production.genres.map((genre) => (
                <span key={genre} className="chip">
                  {genre}
                </span>
              ))}
            </div>

            {production.dubbingStudio && (
              <p className="meta" style={{ marginTop: "0.75rem" }}>
                אולפן דיבוב: <strong>{production.dubbingStudio}</strong>
              </p>
            )}

            <p className="prose">
              {production.summary || "אין תקציר עדיין."}
            </p>

            <section className="credit-groups">
              <h2 className="page-title" style={{ fontSize: "1.4rem" }}>
                {production.genres?.includes("מדובב") ||
                production.dubbingStudio ||
                crew.some(
                  (g) => g.role === "dubber" || g.role === "dub_director"
                )
                  ? "מדבבים וצוות"
                  : "אנשי צוות"}
              </h2>
              {crew.length === 0 && (
                <p className="notice">אין קרדיטים מקושרים עדיין.</p>
              )}
              {crew.map((group) => (
                <div key={group.role} className="credit-group">
                  <h3>{masculineRoleLabel(group.role)}</h3>
                  <ul className="credit-list">
                    {group.entries.map((entry) => (
                      <IshimCreditLine
                        key={entry.key}
                        href={`/people/${encodeURIComponent(entry.person.id)}`}
                        year={creditYearLabel(
                          production,
                          entry.creditYear,
                          entry.creditEndYear
                        )}
                        yearAtEnd
                        lead={entry.person.name}
                        characters={
                          formatIshimCharacters(entry.characterName) || undefined
                        }
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}

        <EntityProvenance
          entityType="production"
          entityId={production.id}
          entity={production}
          contributions={data?.contributions || []}
        />
      </div>
    </article>
  );
}
