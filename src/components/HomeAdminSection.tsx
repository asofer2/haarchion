"use client";

import Link from "next/link";
import { AdminInbox } from "@/components/AdminInbox";
import { useAuth } from "@/components/AuthProvider";
import { isSiteAdmin } from "@/lib/admin";

/** Client-only admin strip — keeps the homepage shell as an RSC. */
export function HomeAdminSection() {
  const { user } = useAuth();
  if (!isSiteAdmin(user)) return null;

  return (
    <section className="section" style={{ marginTop: "1rem" }}>
      <div className="section-head">
        <h2>פאנל ניהול — בקשות לאישור</h2>
      </div>
      <AdminInbox compact />
      <p className="hero-actions" style={{ marginTop: "0.75rem" }}>
        <Link href="/ishur" className="btn btn-primary">
          פאנל ניהול — בקשות לאישור
        </Link>
      </p>
    </section>
  );
}
