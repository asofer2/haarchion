"use client";

import Link from "next/link";
import { AdminInbox } from "@/components/AdminInbox";
import { useAuth } from "@/components/AuthProvider";
import { isSiteAdmin, SITE_ADMIN_NAME } from "@/lib/admin";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const admin = isSiteAdmin(user);

  return (
    <>
      <h1 className="page-title">פאנל ניהול — בקשות לאישור</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        כאן {SITE_ADMIN_NAME} מאשר או דוחה הוספות, עדכונים ומחיקות של משתמשים
        אחרים. השינוי עולה לאתר רק אחרי „כן”.
      </p>

      {authLoading && <p className="muted">טוען התחברות…</p>}

      {!authLoading && !user && (
        <p className="notice">
          יש{" "}
          <Link href="/auth" className="chip-link">
            להתחבר עם Google
          </Link>{" "}
          כ{SITE_ADMIN_NAME} (tamirsofer@gmail.com).
        </p>
      )}

      {!authLoading && user && !admin && (
        <p className="notice">
          מחוברים כ־{user.email || user.displayName}. כדי לאשר בקשות יש להתחבר
          עם tamirsofer@gmail.com.
        </p>
      )}

      {admin && <AdminInbox />}
    </>
  );
}
