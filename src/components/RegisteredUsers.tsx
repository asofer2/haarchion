"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { ensureFirebaseSignedIn } from "@/lib/firebase-session";

type SiteMember = {
  uid: string;
  displayName: string;
  email?: string;
  provider?: string;
  registeredAt?: string;
  lastSeenAt?: string;
};

function providerLabel(provider?: string): string {
  if (provider === "google") return "Google";
  if (provider === "password") return "דוא״ל וסיסמה";
  return provider || "—";
}

function formatWhen(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function RegisteredUsers() {
  const [members, setMembers] = useState<SiteMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    void (async () => {
      const uid = await ensureFirebaseSignedIn();
      const db = getFirebaseDb();
      if (cancelled) return;
      if (!uid || !db) {
        setError("אין חיבור לענן — לא ניתן לטעון את רשימת הנרשמים.");
        setLoading(false);
        return;
      }
      unsubscribe = onSnapshot(
        collection(db, "editors"),
        (snap) => {
          const rows = snap.docs.map((item) => {
            const data = item.data();
            return {
              uid: item.id,
              displayName: String(data.displayName || "—"),
              email: data.email ? String(data.email) : undefined,
              provider: data.provider ? String(data.provider) : undefined,
              registeredAt: data.registeredAt
                ? String(data.registeredAt)
                : undefined,
              lastSeenAt: data.lastSeenAt ? String(data.lastSeenAt) : undefined,
            };
          });
          rows.sort((a, b) =>
            (b.registeredAt || b.lastSeenAt || "").localeCompare(
              a.registeredAt || a.lastSeenAt || ""
            )
          );
          setMembers(rows);
          setLoading(false);
          setError(null);
        },
        () => {
          setError("לא ניתן לטעון את רשימת הנרשמים.");
          setLoading(false);
        }
      );
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <section className="admin-members">
      <h2>נרשמים לאתר{loading ? "" : ` (${members.length})`}</h2>
      {loading && <p className="muted">טוען נרשמים…</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && members.length === 0 && (
        <p className="muted">עדיין אין נרשמים שנשמרו בענן.</p>
      )}
      {members.length > 0 && (
        <table className="history-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>דוא״ל</th>
              <th>התחברות</th>
              <th>נרשם</th>
              <th>נראה לאחרונה</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.uid}>
                <td>{member.displayName}</td>
                <td dir="ltr">{member.email || "—"}</td>
                <td>{providerLabel(member.provider)}</td>
                <td>{formatWhen(member.registeredAt)}</td>
                <td>{formatWhen(member.lastSeenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
