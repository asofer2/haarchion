"use client";

import Link from "next/link";
import {
  contributorDisplayName,
  contributionsForEntity,
  resolveEntitySource,
  type ArchiveEntity,
} from "@/lib/entity-provenance";
import { formatDateHe } from "@/lib/data";
import type { Contribution } from "@/lib/types";

interface Props {
  entityType: "person" | "production";
  entityId: string;
  entityTitle: string;
  entity: ArchiveEntity;
  contributions: Contribution[];
  backHref: string;
}

export function EntityHistoryPanel({
  entityType,
  entityId,
  entityTitle,
  entity,
  contributions,
  backHref,
}: Props) {
  const history = contributionsForEntity(contributions, entityType, entityId);
  const source = resolveEntitySource(entity);
  const kindLabel = entityType === "person" ? "אישיות" : "הפקה";

  return (
    <>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        <Link href={backHref}>← חזרה ל{kindLabel}: {entityTitle}</Link>
      </p>
      <h1 className="page-title">היסטוריית עדכונים</h1>
      <p className="meta" style={{ marginBottom: "1.25rem" }}>
        {entityTitle} · {kindLabel}
      </p>

      {source && (
        <section className="section" style={{ marginTop: 0 }}>
          <div className="section-head">
            <h2>מקור הערך</h2>
          </div>
          <p>
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.note}
              </a>
            ) : (
              source.note
            )}
          </p>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>עריכות</h2>
          <p>{history.length}</p>
        </div>
        {history.length === 0 ? (
          <p className="muted">
            אין עדיין רישום עריכות לערך זה. עריכות שיבוצעו לאחר התחברות יופיעו
            כאן — מי ערך/ה, מתי, ועל איזה מקור התבסס/ה.
          </p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>עורך/ת</th>
                <th>פעולה</th>
                <th>מקור בעריכה</th>
              </tr>
            </thead>
            <tbody>
              {history.map((c) => (
                <tr key={c.id}>
                  <td>{formatDateHe(c.at)}</td>
                  <td>{contributorDisplayName(c)}</td>
                  <td>{c.action === "create" ? "יצירת הערך" : "עדכון"}</td>
                  <td>{c.sourceNote?.trim() || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
