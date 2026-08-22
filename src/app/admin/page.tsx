"use client";

import Link from "next/link";
import { AdminInbox } from "@/components/AdminInbox";
import { useAuth } from "@/components/AuthProvider";
import { isSiteAdmin, SITE_ADMIN_NAME } from "@/lib/admin";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const admin = isSiteAdmin(user);

  if (authLoading) return <p className="notice">טוען…</p>;
  if (!user) {
    return (
      <>
        <h1 className="page-title">פאנל ניהול</h1>
        <p className="notice">
          יש{" "}
          <Link href="/auth" className="chip-link">
            להתחבר עם Google
          </Link>{" "}
          כ{SITE_ADMIN_NAME} ({"tamirsofer@gmail.com"}) כדי לאשר שינויים.
        </p>
      </>
    );
  }
  if (!admin) {
    return (
      <>
        <h1 className="page-title">פאנל ניהול</h1>
        <p className="notice">
          רק {SITE_ADMIN_NAME} יכול לאשר או לדחות שינויים באתר. התחברו עם{" "}
          tamirsofer@gmail.com.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">פאנל ניהול</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        שלום {user.displayName}. כאן מופיעות בקשות של משתמשים אחרים להוספה,
        עדכון או מחיקה. השינוי יופיע באתר רק אחרי לחיצה על „כן”.
      </p>
      <AdminInbox />
    </>
  );
}
