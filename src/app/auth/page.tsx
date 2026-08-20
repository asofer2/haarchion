"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { safeNextPath } from "@/lib/ishim-directory";

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const { signInWithGoogle, user, logout, configured, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && next && next !== "/me") {
      router.replace(next);
    }
  }, [user, next, router]);

  if (loading) {
    return <p className="notice">טוען…</p>;
  }

  if (user) {
    return (
      <>
        <h1 className="page-title">מחובר/ת</h1>
        <p className="notice" style={{ marginBottom: "1rem" }}>
          שלום <strong>{user.displayName}</strong>
          {user.email ? (
            <>
              {" "}
              (<span className="meta">{user.email}</span>)
            </>
          ) : null}
          — עריכות נשמרות תחת חשבון Google זה.
        </p>
        <div className="hero-actions">
          <Link href={next} className="btn btn-primary">
            המשך
          </Link>
          <Link href="/me" className="btn btn-ghost">
            הספרייה שלי
          </Link>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void logout()}
          >
            התנתקות
          </button>
        </div>
      </>
    );
  }

  async function onGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "התחברות נכשלה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="page-title">התחברות / הרשמה</h1>
      <p className="notice" style={{ marginBottom: "1rem" }}>
        כניסה עם חשבון Google (Gmail). אין צורך בסיסמה נפרדת לאתר — ההרשמה
        וההתחברות מתבצעות באותו כפתור.
      </p>

      <div className="auth-card">
        {!configured && (
          <p className="form-error">
            Firebase לא מוגדר בסביבה הזו — לא ניתן להתחבר עם Google.
          </p>
        )}
        <button
          type="button"
          className="btn btn-google"
          disabled={busy || !configured}
          onClick={() => void onGoogle()}
        >
          <GoogleIcon />
          {busy ? "מתחבר…" : "המשך עם Google"}
        </button>
        {error && (
          <p className="form-error" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {error}
          </p>
        )}
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          אם מופיעה שגיאת Google לא מופעלת — ודאו שבפרויקט{" "}
          <strong>tamir-web</strong> (לא פרויקט אחר) סטטוס Google הוא{" "}
          <strong>Enabled</strong>, ואז לחצו Save ורעננו את הדף.
        </p>
      </div>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<p className="notice">טוען…</p>}>
      <AuthPageInner />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.2 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.1 7.1l.1.1 6.2 5.2C37.2 41.5 44 36 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
