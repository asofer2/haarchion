"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useArchive } from "@/hooks/useArchive";
import {
  randomDayPath,
  randomFilmPath,
  randomGamePath,
  randomPersonPath,
  randomShowPath,
  randomYearPath,
} from "@/lib/random-pick";
import { ISHIM_DIRECTORY, loginOr } from "@/lib/ishim-directory";

const links = [
  { href: "/", label: "בית" },
  { href: "/people", label: "אישים" },
  { href: "/productions", label: "הפקות" },
  { href: "/search", label: "חיפוש" },
  { href: "/ishur", label: "ניהול" },
];

const LIST_OPTIONS = [
  { href: "/channels", label: "כל הערוצים" },
  { href: "/genres", label: "כל הז׳אנרים" },
  { href: "/keys", label: "כל המפתחות" },
  { href: "/y", label: "כל התאריכים" },
  { href: "/questions", label: "כל השאלות" },
  { href: "/productions?kind=game_israeli", label: "משחקי מחשב" },
  { href: "/categories/game", label: "קטגוריית משחק מחשב" },
];

export function Header({ a11ySlot }: { a11ySlot?: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading, logout, localMode } = useAuth();
  const { data } = useArchive();

  const listsValue = useMemo(() => {
    const match = LIST_OPTIONS.find((opt) => {
      if (opt.href.includes("?")) {
        const [path, query] = opt.href.split("?");
        if (pathname !== path) return false;
        const expected = new URLSearchParams(query);
        for (const [key, value] of expected.entries()) {
          if (searchParams.get(key) !== value) return false;
        }
        return true;
      }
      return pathname === opt.href || pathname.startsWith(`${opt.href}/`);
    });
    return match?.href || "";
  }, [pathname, searchParams]);

  function onListsChange(href: string) {
    if (href) router.push(href);
  }

  function onRandomChange(kind: string) {
    if (!kind || !data) return;
    let href: string | undefined;
    if (kind === "film") href = randomFilmPath(data.productions);
    else if (kind === "show") href = randomShowPath(data.productions);
    else if (kind === "game") href = randomGamePath(data.productions);
    else if (kind === "person") href = randomPersonPath(data.people);
    else if (kind === "day") href = randomDayPath(data.people);
    else if (kind === "year") href = randomYearPath(data.people);
    if (href) router.push(href);
  }

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

          <label className={`nav-combo ${listsValue ? "is-active" : ""}`}>
            <span className="visually-hidden">רשימות</span>
            <select
              value={listsValue}
              onChange={(event) => onListsChange(event.target.value)}
              aria-label="רשימות"
            >
              <option value="">רשימות</option>
              {LIST_OPTIONS.map((opt) => (
                <option key={opt.href} value={opt.href}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="nav-combo">
            <span className="visually-hidden">אקראי</span>
            <select
              value=""
              disabled={!data}
              onChange={(event) => {
                const kind = event.target.value;
                event.target.value = "";
                onRandomChange(kind);
              }}
              aria-label="אקראי"
            >
              <option value="">אקראי</option>
              <option value="film">סרט אקראי</option>
              <option value="show">תוכנית אקראית</option>
              <option value="game">משחק מחשב אקראי</option>
              <option value="person">אדם אקראי</option>
              <option value="day">יום אקראי</option>
              <option value="year">שנה אקראית</option>
            </select>
          </label>

          <label className="nav-combo">
            <span className="visually-hidden">הוספה</span>
            <select
              value=""
              onChange={(event) => {
                const href = event.target.value;
                event.target.value = "";
                if (href) router.push(loginOr(href, Boolean(user)));
              }}
              aria-label="הוספה"
            >
              <option value="">הוספה</option>
              {ISHIM_DIRECTORY.map((item) => (
                <option key={item.label} value={item.addHref}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
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
              <Link
                href="/ishur"
                className={`btn btn-ghost${pathname.startsWith("/ishur") ? " active" : ""}`}
              >
                ניהול בקשות
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
