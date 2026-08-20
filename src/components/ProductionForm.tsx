"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ImageDropzone } from "@/components/ImageDropzone";
import { useArchive } from "@/hooks/useArchive";
import { saveProduction, slugify } from "@/lib/data";
import { DUBBING_STUDIOS } from "@/lib/dubbing-studios";
import {
  PRODUCTION_KIND_FORM_OPTIONS,
  PRODUCTION_KIND_LABELS,
  type Production,
  type ProductionKind,
} from "@/lib/types";

interface Props {
  initial?: Production;
  presetKind?: string;
}

export function ProductionForm({ initial, presetKind }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { refresh } = useArchive();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);

  const kindDefault =
    initial?.kind ??
    (presetKind &&
    PRODUCTION_KIND_FORM_OPTIONS.some((opt) => opt.value === presetKind)
      ? (presetKind as ProductionKind)
      : "film_cinema");

  if (!user) {
    return <p className="notice">יש להתחבר כדי לערוך ערכים.</p>;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") || "").trim();
    const year = Number(form.get("year"));
    if (!title || !year) {
      setError("כותרת ושנה הם שדות חובה");
      setSaving(false);
      return;
    }

    const customId = String(form.get("id") || "").trim();
    const id = initial?.id || slugify(customId || title);
    const now = new Date().toISOString();
    const endYearRaw = String(form.get("endYear") || "");
    const production: Production = {
      id,
      title,
      originalTitle: String(form.get("originalTitle") || "").trim() || undefined,
      year,
      endYear: endYearRaw ? Number(endYearRaw) : undefined,
      kind: String(form.get("kind") || "film_cinema") as ProductionKind,
      summary: String(form.get("summary") || "").trim(),
      genres: String(form.get("genres") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      channel: String(form.get("channel") || "").trim() || undefined,
      studio: String(form.get("studio") || "").trim() || undefined,
      dubbingStudio: String(form.get("dubbingStudio") || "").trim() || undefined,
      imageUrl,
      createdAt: initial?.createdAt || now,
      updatedAt: now,
      createdBy: initial?.createdBy || user!.uid,
      updatedBy: user!.uid,
    };

    try {
      await saveProduction(production, {
        userId: user!.uid,
        userName: user!.displayName || undefined,
        isNew: !initial,
      });
      await refresh(false);
      router.push(`/productions/${encodeURIComponent(production.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="edit-form" onSubmit={onSubmit}>
      <label>
        כותרת
        <input name="title" defaultValue={initial?.title} required />
      </label>
      {!initial && (
        <label>
          מזהה URL באנגלית (אופציונלי)
          <input name="id" placeholder="למשל fauda" dir="ltr" />
        </label>
      )}
      <label>
        שם מקורי
        <input name="originalTitle" defaultValue={initial?.originalTitle} />
      </label>
      <div className="form-row">
        <label>
          שנה
          <input
            type="number"
            name="year"
            defaultValue={initial?.year ?? 2020}
            required
          />
        </label>
        <label>
          שנת סיום
          <input type="number" name="endYear" defaultValue={initial?.endYear} />
        </label>
        <label>
          סוג
          <select name="kind" defaultValue={kindDefault} key={kindDefault}>
            {PRODUCTION_KIND_FORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {initial?.kind &&
              !PRODUCTION_KIND_FORM_OPTIONS.some((o) => o.value === initial.kind) && (
                <option value={initial.kind}>
                  {PRODUCTION_KIND_LABELS[initial.kind] || initial.kind}
                </option>
              )}
          </select>
        </label>
      </div>
      <label>
        ז׳אנרים (מופרדים בפסיק)
        <input name="genres" defaultValue={initial?.genres.join(", ")} />
      </label>
      <div className="form-row">
        <label>
          ערוץ שידור
          <input name="channel" defaultValue={initial?.channel} />
        </label>
        <label>
          אולפן / חברת הפקה
          <input name="studio" defaultValue={initial?.studio} />
        </label>
      </div>
      <label>
        אולפן דיבוב (לסרטים/סדרות מדובבים)
        <input
          name="dubbingStudio"
          list="dubbing-studios"
          defaultValue={initial?.dubbingStudio}
          placeholder="למשל אולפני אלרום"
        />
        <datalist id="dubbing-studios">
          {DUBBING_STUDIOS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>

      <ImageDropzone
        value={imageUrl}
        onChange={setImageUrl}
        label="תמונה / פוסטר (בחירה / גרירה / הדבקה)"
      />

      <label>
        תקציר
        <textarea name="summary" rows={8} defaultValue={initial?.summary} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? "שומר…" : "שמירה"}
      </button>
    </form>
  );
}
