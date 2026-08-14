"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const links = [
  { href: "/", label: "בית" },
  { href: "/people", label: "אישים" },
  { href: "/productions", label: "הפקות" },
  { href: "/categories", label: "קטגוריות" },
  { href: "/search", label: "חיפוש" },
];

export function Header({ a11ySlot }: { a11ySlot?: ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout, localMode } = useAuth();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-ishim.png"
            alt="אישים — לוגו האתר"
            className="brand-logo"
            width={140}
            height={48}
          />
          <span className="brand-sub">דיבוב · מחזמר · קולנוע · קלטות</span>
        </Link>

        <nav className="nav-links" aria-label="ניווט ראשי">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          {a11ySlot}
          {user && (
            <>
              <Link href="/people/new" className="btn btn-ghost">
                + אישיות
              </Link>
              <Link href="/productions/new" className="btn btn-ghost">
                + הפקה
              </Link>
              <Link href="/me" className="btn btn-ghost">
                הספרייה שלי
              </Link>
            </>
          )}
          {!loading &&
            (user ? (
              <>
                <Link href="/me" className="btn btn-ghost">
                  {user.displayName}
                </Link>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void logout()}
                >
                  יציאה
                </button>
              </>
            ) : (
              <Link href="/auth" className="btn btn-primary">
                התחברות
              </Link>
            ))}
        </div>
      </div>
      {localMode && (
        <p className="local-banner" role="status">
          מצב מקומי — הנתונים נשמרים בדפדפן. חבר Firebase ב־`.env.local` לסנכרון מלא.
        </p>
      )}
    </header>
  );
}
