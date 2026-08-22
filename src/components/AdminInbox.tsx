"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useArchive } from "@/hooks/useArchive";
import { isSiteAdmin } from "@/lib/admin";
import {
  approveChangeRequest,
  rejectChangeRequest,
  subscribeChangeRequests,
  type ChangeRequest,
} from "@/lib/change-requests";
import { formatDateHe } from "@/lib/data";

const ACTION_HE = {
  create: "הוספה",
  update: "עדכון",
  delete: "מחיקה",
} as const;

const ENTITY_HE = {
  person: "אישיות",
  production: "הפקה",
} as const;

const STATUS_HE = {
  pending: "ממתין",
  approved: "אושר",
  rejected: "נדחה",
} as const;

function requestSummary(request: ChangeRequest): string {
  if (request.action === "delete") {
    return `מחיקת ${ENTITY_HE[request.entityType]} „${request.entityTitle}”`;
  }
  if (request.person) {
    const credits = request.creditInputs?.length || 0;
    const extra = credits ? ` · ${credits} קרדיטים` : "";
    return `${request.person.name}${extra}`;
  }
  if (request.production) {
    return `${request.production.title} (${request.production.year})`;
  }
  if (request.credits) {
    return `${request.entityTitle} · ${request.credits.length} קרדיטים`;
  }
  return request.entityTitle;
}

export function AdminInbox({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { refresh } = useArchive();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const admin = isSiteAdmin(user);

  useEffect(() => {
    if (!admin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeChangeRequests(
      (list) => {
        setRequests(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, [admin]);

  if (!admin) return null;

  async function decide(request: ChangeRequest, approve: boolean) {
    if (!user) return;
    setBusyId(request.id);
    setError(null);
    try {
      const reviewer = {
        uid: user.uid,
        displayName: user.displayName || undefined,
        email: user.email,
      };
      if (approve) {
        await approveChangeRequest(request, reviewer);
        await refresh(true);
      } else {
        await rejectChangeRequest(request, reviewer);
      }
      setRequests((prev) =>
        prev.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: approve ? "approved" : "rejected",
                reviewedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "הפעולה נכשלה");
    } finally {
      setBusyId(null);
    }
  }

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");

  return (
    <div className="admin-inbox">
      {error && <p className="form-error">{error}</p>}

      <section className="section">
        <div className="section-head">
          <h2>ממתינות לאישור</h2>
          <p>{pending.length}</p>
        </div>
        {loading ? (
          <p className="muted">טוען בקשות…</p>
        ) : pending.length === 0 ? (
          <p className="muted">
            אין בקשות ממתינות. כשמשתמש אחר יוסיף או יערוך ערך, הבקשה תופיע כאן
            אוטומטית.
          </p>
        ) : (
          <ul className="admin-request-list">
            {pending.map((request) => (
              <li key={request.id} className="admin-request">
                <div className="admin-request-body">
                  <span className="chip">{ACTION_HE[request.action]}</span>{" "}
                  <span className="chip">{ENTITY_HE[request.entityType]}</span>
                  <h3>{request.entityTitle}</h3>
                  <p className="muted">{requestSummary(request)}</p>
                  {request.person?.bio ? (
                    <p className="admin-request-excerpt">{request.person.bio}</p>
                  ) : null}
                  {request.production?.summary ? (
                    <p className="admin-request-excerpt">
                      {request.production.summary}
                    </p>
                  ) : null}
                  <p className="meta">
                    מאת {request.requestedByName || request.requestedByEmail || "משתמש"}
                    {request.requestedByEmail
                      ? ` · ${request.requestedByEmail}`
                      : ""}{" "}
                    · {formatDateHe(request.createdAt)}
                  </p>
                </div>
                <div className="admin-request-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busyId === request.id}
                    onClick={() => void decide(request, true)}
                  >
                    {busyId === request.id ? "מעדכן…" : "כן"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busyId === request.id}
                    onClick={() => void decide(request, false)}
                  >
                    לא
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!compact && (
        <section className="section">
          <div className="section-head">
            <h2>היסטוריית החלטות</h2>
            <p>{history.length}</p>
          </div>
          {history.length === 0 ? (
            <p className="muted">עדיין אין החלטות.</p>
          ) : (
            <ul className="activity-list">
              {history.map((request) => (
                <li key={request.id}>
                  <span className="chip">{STATUS_HE[request.status]}</span>{" "}
                  <span className="chip">{ACTION_HE[request.action]}</span>{" "}
                  {request.entityTitle}
                  <span className="meta">
                    {" "}
                    · {request.requestedByName || "משתמש"} ·{" "}
                    {formatDateHe(request.reviewedAt || request.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
