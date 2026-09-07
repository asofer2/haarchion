import Link from "next/link";
import { monthDayFromIso, yearFromIso } from "@/lib/year-calendar";

type DateKind = "birth" | "death";

function yearHref(iso: string, kind: DateKind): string | undefined {
  const year = yearFromIso(iso);
  if (!year) return undefined;
  return kind === "birth" ? `/y/${year}#born` : `/y/${year}#died`;
}

function dayHref(iso: string, kind: DateKind): string | undefined {
  const md = monthDayFromIso(iso);
  if (!md) return undefined;
  return kind === "birth"
    ? `/d/${md.month}/${md.day}#born`
    : `/d/${md.month}/${md.day}#died`;
}

/** Ishim-style date with separate links for day/month and year. */
export function PersonDateLinks({
  iso,
  kind,
}: {
  iso?: string;
  kind: DateKind;
}) {
  if (!iso) return null;

  const parts = iso.trim().split("-");
  const year = parts[0] ? Number(parts[0]) : 0;
  const month = parts[1] ? Number(parts[1]) : 0;
  const day = parts[2] ? Number(parts[2]) : 0;
  const yLink = yearHref(iso, kind);
  const dLink = dayHref(iso, kind);

  if (day > 0 && month > 0 && year >= 1000) {
    return (
      <>
        {dLink ? (
          <Link href={dLink} className="ishim-date-link">
            {day}/{month}
          </Link>
        ) : (
          `${day}/${month}`
        )}
        /
        {yLink ? (
          <Link href={yLink} className="ishim-date-link">
            {year}
          </Link>
        ) : (
          year
        )}
      </>
    );
  }

  if (month > 0 && year >= 1000 && !day) {
    return (
      <>
        {month}/
        {yLink ? (
          <Link href={yLink} className="ishim-date-link">
            {year}
          </Link>
        ) : (
          year
        )}
      </>
    );
  }

  if (year >= 1000) {
    return yLink ? (
      <Link href={yLink} className="ishim-date-link">
        {year}
      </Link>
    ) : (
      <>{year}</>
    );
  }

  return <>{iso}</>;
}
