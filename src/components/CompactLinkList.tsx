import Link from "next/link";

export function CompactLinkList({
  items,
  empty,
}: {
  items: { href: string; label: string; meta?: string }[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="muted">{empty}</p>;
  }
  return (
    <div className="link-list">
      {items.map((item) => (
        <div key={item.href} className="link-list-row">
          <Link href={item.href}>{item.label}</Link>
          {item.meta ? <span className="meta">{item.meta}</span> : null}
        </div>
      ))}
    </div>
  );
}
