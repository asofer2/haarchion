"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useArchive } from "@/hooks/useArchive";
import { AdminInbox } from "@/components/AdminInbox";
import { isSiteAdmin, SITE_ADMIN_NAME } from "@/lib/admin";
import {
  PENDING_NOTICE,
  requestOrApplyDelete,
  subscribeChangeRequests,
  type ChangeRequest,
} from "@/lib/change-requests";
import {
  formatDateHe,
  isCreatedByUser,
  syncMyCreationsToCloud,
} from "@/lib/data";
import { isFirebaseConfigured } from "@/lib/firebase";
import { formatProductionTitle } from "@/lib/production-title";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { data, loading, error, refresh } = useArchive();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [myRequests, setMyRequests] = useState<ChangeRequest[]>([]);
  const [sent, setSent] = useState(false);
  const admin = isSiteAdmin(user);

  useEffect(() => {
    setSent(new URLSearchParams(window.location.search).get("sent") === "1");
  }, []);

  useEffect(() => {
    if (!user) return;
    return subscribeChangeRequests((list) => {
      setMyRequests(
        list.filter(
          (item) =>
            item.requestedBy === user.uid ||
            item.requestedByEmail === user.email
        )
      );
    });
  }, [user]);

  const mine = useMemo(() => {
    if (!data || !user) {
      return { contributions: [], createdPeople: [], createdProductions: [] };
    }
    const contributions = data.contributions
      .filter(
        (c) =>
          c.userId === user.uid ||
          c.userName === user.displayName ||
          c.userId === `local-${user.displayName}`
      )
      .sort((a, b) => b.at.localeCompare(a.at));
    return {
      contributions,
      createdPeople: data.people.filter((p) => isCreatedByUser(p, user)),
      createdProductions: data.productions.filter((p) =>
        isCreatedByUser(p, user)
      ),
    };
  }, [data, user]);

  async function syncToCloud() {
    if (!user || !admin) return;
    setSyncing(true);
    setActionError(null);
    setSyncMsg(null);
    try {
      const result = await syncMyCreationsToCloud(user);
      setSyncMsg(
        `הועלו לענן: ${result.people} אישים, ${result.productions} הפקות. עכשיו יופיעו גם במחשבים אחרים.`
      );
      await refresh(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "סנכרון נכשל");
    } finally {
      setSyncing(false);
    }
  }

  async function remove(
    kind: "person" | "production",
    id: string,
    title: string
  ) {
    if (!user) return;
    const ok = window.confirm(
      admin
        ? `למחוק את „${title}” לצמיתות?\nפעולה זו אינה ניתנת לביטול.`
        : `לשלוח בקשת מחיקה של „${title}” לאישור ${SITE_ADMIN_NAME}?`
    );
    if (!ok) return;
    setBusyId(id);
    setActionError(null);
    try {
      const result = await requestOrApplyDelete(
        {
          uid: user.uid,
          displayName: user.displayName || undefined,
          email: user.email,
        },
        kind,
        id,
        title
      );
      if (result.pending) {
        setSyncMsg(PENDING_NOTICE);
        return;
      }
      await refresh(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "המחיקה נכשלה");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || (loading && !data)) return <p className="notice">טוען…</p>;
  if (!user) {
    return (
      <>
        <h1 className="page-title">הספרייה שלי</h1>
        <p className="notice">
          יש{" "}
          <Link href="/auth" className="chip-link">
            להתחבר עם Google
          </Link>{" "}
          כדי לראות מה הוספתם, לערוך או למחוק.
        </p>
      </>
    );
  }
  if (error || !data) return <p className="form-error">{error || "שגיאה"}</p>;

  return (
    <>
      <h1 className="page-title">הספרייה שלי</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        שלום <strong>{user.displayName}</strong>
        {user.email ? (
          <>
            {" "}
            (<span className="meta">{user.email}</span>)
          </>
        ) : null}{" "}
        — כאן אפשר לערוך או לבקש מחיקה של ערכים.{" "}
        {admin
          ? "כדי שיופיעו גם במחשב אחר — לחצו „העלה לענן”."
          : `הוספות ועריכות נשלחות לאישור ${SITE_ADMIN_NAME} ויופיעו באתר רק אחרי שיאשר.`}
      </p>
      {!admin && (
        <p className="muted" style={{ marginBottom: "1rem" }}>
          פאנל האישור מופיע רק אחרי התחברות עם tamirsofer@gmail.com. עכשיו
          מחוברים כ־{user.email || user.displayName}.
        </p>
      )}
      {sent && <p className="notice">{PENDING_NOTICE}</p>}
      {actionError && <p className="form-error">{actionError}</p>}
      {syncMsg && <p className="notice">{syncMsg}</p>}

      <section id="admin" className="section" style={{ marginBottom: "1.5rem" }}>
        <div className="section-head">
          <h2>פאנל ניהול — בקשות לאישור</h2>
        </div>
        {admin ? (
          <AdminInbox />
        ) : (
          <p className="notice">
            התחברו עם החשבון tamirsofer@gmail.com כדי לראות כאן בקשות של
            משתמשים אחרים ולאשר או לדחות אותן.
          </p>
        )}
      </section>

      {myRequests.some((r) => r.status === "pending") && (
        <section className="section" style={{ marginBottom: "1.5rem" }}>
          <div className="section-head">
            <h2>בקשות ממתינות לאישור {SITE_ADMIN_NAME}</h2>
            <p>{myRequests.filter((r) => r.status === "pending").length}</p>
          </div>
          <ul className="activity-list">
            {myRequests
              .filter((r) => r.status === "pending")
              .map((r) => (
                <li key={r.id}>
                  <span className="chip">ממתין</span> {r.entityTitle}
                  <span className="meta">
                    {" "}
                    · {r.action === "create" ? "הוספה" : r.action === "delete" ? "מחיקה" : "עדכון"}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <div className="hero-actions" style={{ marginBottom: "1.5rem" }}>
        <Link href="/people/new" className="btn btn-primary">
          + הוספת אישיות
        </Link>
        <Link href="/productions/new" className="btn btn-ghost">
          + הוספת הפקה
        </Link>
        {admin && isFirebaseConfigured() && (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={syncing}
            onClick={() => void syncToCloud()}
          >
            {syncing ? "מעלה לענן…" : "העלה לענן"}
          </button>
        )}
        {admin && (
          <Link href="/admin" className="btn btn-primary">
            פאנל ניהול
          </Link>
        )}
      </div>

      <section className="section" style={{ marginTop: "1rem" }}>
        <div className="section-head">
          <h2>היסטוריית עריכות</h2>
          <p>{mine.contributions.length}</p>
        </div>
        {mine.contributions.length === 0 ? (
          <p className="muted">
            עדיין אין תרומות. הוסיפו אישיות או הפקה — זה יופיע כאן אוטומטית.
          </p>
        ) : (
          <ul className="activity-list">
            {mine.contributions.map((c) => (
              <li key={c.id}>
                <span className="chip">
                  {c.action === "create" ? "נוסף" : "עודכן"}
                </span>{" "}
                <Link
                  href={
                    c.entityType === "person"
                      ? `/people/${encodeURIComponent(c.entityId)}`
                      : `/productions/${encodeURIComponent(c.entityId)}`
                  }
                >
                  {c.entityTitle}
                </Link>
                <span className="meta">
                  {" "}
                  · {c.entityType === "person" ? "אישיות" : "הפקה"} ·{" "}
                  {formatDateHe(c.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>אישים שיצרתי</h2>
          <p>{mine.createdPeople.length}</p>
        </div>
        {mine.createdPeople.length === 0 ? (
          <p className="muted">אין עדיין.</p>
        ) : (
          <ul className="activity-list">
            {mine.createdPeople.map((p) => (
              <li key={p.id} className="mine-row">
                <Link href={`/people/${encodeURIComponent(p.id)}`}>{p.name}</Link>
                <span className="mine-row-actions">
                  <Link
                    href={`/people/${encodeURIComponent(p.id)}/edit`}
                    className="btn btn-ghost"
                  >
                    עריכה
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busyId === p.id}
                    onClick={() => void remove("person", p.id, p.name)}
                  >
                    {busyId === p.id
                      ? admin
                        ? "מוחק…"
                        : "שולח…"
                      : admin
                        ? "מחיקה"
                        : "בקשת מחיקה"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>הפקות שיצרתי</h2>
          <p>{mine.createdProductions.length}</p>
        </div>
        {mine.createdProductions.length === 0 ? (
          <p className="muted">אין עדיין.</p>
        ) : (
          <ul className="activity-list">
            {mine.createdProductions.map((p) => (
              <li key={p.id} className="mine-row">
                <Link href={`/productions/${encodeURIComponent(p.id)}`}>
                  {formatProductionTitle(p)}
                </Link>
                <span className="mine-row-actions">
                  <Link
                    href={`/productions/${encodeURIComponent(p.id)}/edit`}
                    className="btn btn-ghost"
                  >
                    עריכה
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busyId === p.id}
                    onClick={() => void remove("production", p.id, p.title)}
                  >
                    {busyId === p.id
                      ? admin
                        ? "מוחק…"
                        : "שולח…"
                      : admin
                        ? "מחיקה"
                        : "בקשת מחיקה"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
