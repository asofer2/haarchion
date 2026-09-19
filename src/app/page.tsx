import { Suspense } from "react";
import Link from "next/link";
import { HomeAdminSection } from "@/components/HomeAdminSection";
import { HomeFeed } from "@/components/HomeFeed";
import { ArchiveSkeleton } from "@/components/ArchiveSkeleton";

/** Homepage shell is static; widgets refresh hourly via cached server data. */
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="meta">מאגר ישראלי · דיבוב · מחזמר · קלטות · במה</p>
        <h1>אישים</h1>
        <p className="hero-welcome">ברוכים הבאים לאתר אישים</p>
        <p className="hero-actions">
          <Link href="/ishur" className="btn btn-primary">
            פאנל ניהול — בקשות לאישור
          </Link>
        </p>
      </section>

      <HomeAdminSection />

      <Suspense
        fallback={<ArchiveSkeleton label="טוען את אישים…" cards={6} />}
      >
        <HomeFeed />
      </Suspense>
    </>
  );
}
