import Link from "next/link";
import { EntityImage } from "@/components/EntityImage";
import {
  formatProductionTitle,
  formatProductionYears,
  showsActivityYearsInTitle,
} from "@/lib/production-title";
import type { Production } from "@/lib/types";
import { productionKindLabel } from "@/lib/types";

export function ProductionCard({ production }: { production: Production }) {
  const displayTitle = formatProductionTitle(production);
  const years = formatProductionYears(production.year, production.endYear);
  const yearsInTitle = showsActivityYearsInTitle(production.kind);

  return (
    <Link href={`/productions/${encodeURIComponent(production.id)}`} className="entity-card">
      <div className="entity-media wide">
        <EntityImage src={production.imageUrl} alt={displayTitle} />
      </div>
      <div className="entity-body">
        <h3>{displayTitle}</h3>
        <p className="meta">
          {productionKindLabel(production.kind)}
          {!yearsInTitle && years ? ` · ${years}` : ""}
          {production.dubbingStudio ? ` · ${production.dubbingStudio}` : ""}
        </p>
        {production.genres.length > 0 && (
          <p className="tags">{production.genres.slice(0, 3).join(" · ")}</p>
        )}
      </div>
    </Link>
  );
}
