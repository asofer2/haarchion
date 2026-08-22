"use client";

import Link from "next/link";
import {
  contributionsForEntity,
  entityHistoryHref,
  entryAuthorsForEntity,
  resolveEntitySource,
  type ArchiveEntity,
} from "@/lib/entity-provenance";
import type { Contribution } from "@/lib/types";

interface Props {
  entityType: "person" | "production";
  entityId: string;
  entity: ArchiveEntity;
  contributions: Contribution[];
}

export function EntityProvenance({
  entityType,
  entityId,
  entity,
  contributions,
}: Props) {
  const authors = entryAuthorsForEntity(
    entity,
    contributions,
    entityType,
    entityId
  );
  const source = resolveEntitySource(entity);
  const history = contributionsForEntity(contributions, entityType, entityId);
  const historyHref = entityHistoryHref(entityType, entityId);

  return (
    <footer className="entity-provenance">
      {authors.length > 0 ? (
        <p>
          <span className="entity-provenance-label">כותבי הערך:</span>{" "}
          {authors.join(", ")}
        </p>
      ) : null}
      <p className="entity-provenance-meta">
        {source ? (
          <>
            <span className="entity-provenance-label">מקור:</span>{" "}
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.note}
              </a>
            ) : (
              source.note
            )}
          </>
        ) : null}
        {source ? (
          <span className="entity-provenance-sep" aria-hidden="true">
            ·
          </span>
        ) : null}
        <Link href={historyHref}>היסטוריית עדכונים</Link>
        {history.length > 0 && (
          <span className="meta"> ({history.length})</span>
        )}
      </p>
    </footer>
  );
}
