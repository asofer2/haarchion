"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useArchive } from "@/hooks/useArchive";
import { isSiteAdmin, SITE_ADMIN_NAME } from "@/lib/admin";
import {
  PENDING_NOTICE,
  requestOrApplyDelete,
} from "@/lib/change-requests";

interface Props {
  kind: "person" | "production";
  id: string;
  title: string;
  /** Any signed-in editor may delete */
  canDelete: boolean;
  /** Any signed-in editor may edit any entry */
  canEdit?: boolean;
}

export function OwnerActions({
  kind,
  id,
  title,
  canDelete,
  canEdit = true,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { refresh } = useArchive();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const admin = isSiteAdmin(user);

  if (!canEdit && !canDelete) return null;

  const editHref =
    kind === "person"
      ? `/people/${encodeURIComponent(id)}/edit`
      : `/productions/${encodeURIComponent(id)}/edit`;

  async function onDelete() {
    if (!user) return;
    const ok = window.confirm(
      admin
        ? `למחוק את „${title}” לצמיתות?\nפעולה זו אינה ניתנת לביטול.`
        : `לשלוח בקשת מחיקה של „${title}” לאישור ${SITE_ADMIN_NAME}?`
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    setNotice(null);
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
        setNotice(PENDING_NOTICE);
        router.push("/me?sent=1");
        return;
      }
      await refresh(true);
      router.push(kind === "person" ? "/people" : "/productions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "המחיקה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="owner-actions">
      {canEdit && (
        <Link href={editHref} className="btn btn-ghost">
          עריכה
        </Link>
      )}
      {canDelete && (
        <button
          type="button"
          className="btn btn-danger"
          disabled={busy}
          onClick={() => void onDelete()}
        >
          {busy ? (admin ? "מוחק…" : "שולח…") : admin ? "מחיקה" : "בקשת מחיקה"}
        </button>
      )}
      {notice && <p className="notice">{notice}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
