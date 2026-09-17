type ArchiveSkeletonProps = {
  label?: string;
  cards?: number;
};

/** Shared Hebrew loading shell — route `loading.tsx` + in-page archive waits. */
export function ArchiveSkeleton({
  label = "טוען…",
  cards = 6,
}: ArchiveSkeletonProps) {
  return (
    <div
      className="archive-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="notice">{label}</p>
      <div className="archive-skeleton-grid" aria-hidden="true">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="archive-skeleton-card">
            <div className="archive-skeleton-media" />
            <div className="archive-skeleton-line" />
            <div className="archive-skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}
