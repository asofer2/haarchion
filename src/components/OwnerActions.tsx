"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useArchive } from "@/hooks/useArchive";
import { deletePerson, deleteProduction } from "@/lib/data";

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
  const { refresh } = useArchive();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit && !canDelete) return null;

  const editHref =
    kind === "person"
      ? `/people/${encodeURIComponent(id)}/edit`
      : `/productions/${encodeURIComponent(id)}/edit`;

  async function onDelete() {
    const ok = window.confirm(
      `למחוק את „${title}” לצמיתות?\nפעולה זו אינה ניתנת לביטול.`
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      if (kind === "person") await deletePerson(id);
      else await deleteProduction(id);
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
          {busy ? "מוחק…" : "מחיקה"}
        </button>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
