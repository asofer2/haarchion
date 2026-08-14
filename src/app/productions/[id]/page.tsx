"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EntityImage } from "@/components/EntityImage";
import { OwnerActions } from "@/components/OwnerActions";
import { useArchive } from "@/hooks/useArchive";
import { findById, canEditArchive } from "@/lib/data";
import {
  formatProductionTitle,
  formatProductionYears,
} from "@/lib/production-title";
import {
  CREDIT_ROLE_LABELS,
  productionKindLabel,
  type CreditRole,
  type Person,
} from "@/lib/types";

export default function ProductionDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useArchive();
  const { user } = useAuth();

  const production = data ? findById(data.productions, params.id) : undefined;

  const crew = useMemo(() => {
    if (!data || !production)
      return [] as {
        role: CreditRole;
        entries: { person: Person; characterName?: string }[];
      }[];
    const credits = data.credits.filter((c) => c.productionId === production.id);
    const hasNamedDubCast = credits.some(
      (c) =>
        (c.role === "dubber" || c.role === "dub_director" || c.role === "singer") &&
        Boolean(c.characterName)
    );
    const byRole = new Map<
      CreditRole,
      { person: Person; characterName?: string }[]
    >();
    for (const credit of credits) {
      if (
        hasNamedDubCast &&
        (credit.role === "dubber" ||
          credit.role === "dub_director" ||
          credit.role === "singer") &&
        !credit.characterName
      ) {
        continue;
      }
      const person = data.people.find((p) => p.id === credit.personId);
      if (!person) continue;
      const list = byRole.get(credit.role) || [];
      if (!list.some((x) => x.person.id === person.id)) {
        list.push({ person, characterName: credit.characterName });
      }
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
        entries: entries.sort((a, b) =>
          a.person.name.localeCompare(b.person.name, "he")
        ),
      }))
      .sort((a, b) => {
        const ai = roleOrder.indexOf(a.role);
        const bi = roleOrder.indexOf(b.role);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
  }, [data, production]);

  if (loading && !data) return <p className="notice">טוען…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!production) return <p className="form-error">ההפקה לא נמצאה</p>;

  const displayTitle = formatProductionTitle(production);
  const years = formatProductionYears(production.year, production.endYear);

  return (
    <article className="detail-layout">
      <div className="detail-poster">
        <EntityImage src={production.imageUrl} alt={displayTitle} />
      </div>
      <div className="detail-content">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1>{displayTitle}</h1>
            {production.originalTitle && (
              <p className="meta">{production.originalTitle}</p>
            )}
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

        <div className="chip-row">
          <span className="chip">{productionKindLabel(production.kind)}</span>
          {years ? <span className="chip">{years}</span> : null}
          {production.channel && <span className="chip">{production.channel}</span>}
          {production.studio && <span className="chip">{production.studio}</span>}
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

        <p className="prose">{production.summary || "אין תקציר עדיין."}</p>

        <section className="credit-groups">
          <h2 className="page-title" style={{ fontSize: "1.4rem" }}>
            {production.genres?.includes("מדובב") ||
            production.dubbingStudio ||
            crew.some((g) => g.role === "dubber" || g.role === "dub_director")
              ? "מדבבים וצוות"
              : "אנשי צוות"}
          </h2>
          {crew.length === 0 && <p className="notice">אין קרדיטים מקושרים עדיין.</p>}
          {crew.map((group) => (
            <div key={group.role} className="credit-group">
              <h3>{CREDIT_ROLE_LABELS[group.role]}</h3>
              <div className="credit-list">
                {group.entries.map(({ person, characterName }) => (
                  <Link key={person.id} href={`/people/${person.id}`}>
                    {person.name}
                    {characterName ? (
                      <span className="meta"> — {characterName}</span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </article>
  );
}
