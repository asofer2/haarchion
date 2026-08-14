import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import { formatDateHe, ageLabel } from "@/lib/data";
import { ACTIVITY_LABELS, type Person } from "@/lib/types";

export function PersonCard({ person }: { person: Person }) {
  const age = ageLabel(person.birthDate, person.deathDate);
  return (
    <Link
      href={`/people/${encodeURIComponent(person.id)}`}
      className="entity-card"
    >
      <div className="entity-media">
        <EntityImage src={person.imageUrl} alt={person.name} />
      </div>
      <div className="entity-body">
        <h3>{person.name}</h3>
        {(person.birthDate || person.deathDate) && (
          <p className="meta">
            {person.birthDate ? formatDateHe(person.birthDate) : "?"}
            {person.deathDate
              ? ` – ${formatDateHe(person.deathDate)}`
              : ""}
            {age ? ` · ${age}` : ""}
          </p>
        )}
        {(person.activities || []).length > 0 ? (
          <p className="tags activity-topics">
            {[...new Set(person.activities || [])]
              .slice(0, 3)
              .map((a) => ACTIVITY_LABELS[a])
              .join(" · ")}
          </p>
        ) : (
          person.tags.length > 0 && (
            <p className="tags">{person.tags.slice(0, 3).join(" · ")}</p>
          )
        )}
      </div>
    </Link>
  );
}
