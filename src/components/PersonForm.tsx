"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ImageDropzone } from "@/components/ImageDropzone";
import { useArchive } from "@/hooks/useArchive";
import { savePerson, slugify } from "@/lib/data";
import {
  ACTIVITY_LABELS,
  ACTIVITY_LIST,
  type ActivityCategory,
  type Person,
} from "@/lib/types";

interface Props {
  initial?: Person;
}

export function PersonForm({ initial }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { refresh } = useArchive();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [activities, setActivities] = useState<ActivityCategory[]>(
    initial?.activities?.length ? initial.activities : ["dubbing"]
  );

  if (!user) {
    return <p className="notice">יש להתחבר כדי להוסיף או לערוך אישים.</p>;
  }

  function toggleActivity(cat: ActivityCategory) {
    setActivities((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) {
      setError("שם הוא שדה חובה");
      setSaving(false);
      return;
    }
    if (activities.length === 0) {
      setError("בחרו לפחות קטגוריית פעילות אחת");
      setSaving(false);
      return;
    }

    const customId = String(form.get("id") || "").trim();
    const id = initial?.id || slugify(customId || name);
    const now = new Date().toISOString();
    const person: Person = {
      id,
      name,
      nameOriginal: String(form.get("nameOriginal") || "").trim() || undefined,
      nicknames: String(form.get("nicknames") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      birthDate: String(form.get("birthDate") || "") || undefined,
      deathDate: String(form.get("deathDate") || "") || undefined,
      bio: String(form.get("bio") || "").trim(),
      imageUrl,
      tags: String(form.get("tags") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      activities,
      createdAt: initial?.createdAt || now,
      updatedAt: now,
      createdBy: initial?.createdBy || user!.uid,
      updatedBy: user!.uid,
    };

    try {
      await savePerson(person, {
        userId: user!.uid,
        userName: user!.displayName || undefined,
        isNew: !initial,
      });
      // Cache already updated — don't force a Firestore reload
      await refresh(false);
      router.push(`/people/${encodeURIComponent(person.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="edit-form" onSubmit={onSubmit}>
      <label>
        שם
        <input name="name" defaultValue={initial?.name} required />
      </label>
      {!initial && (
        <label>
          מזהה URL באנגלית (אופציונלי)
          <input name="id" placeholder="למשל tamirosh" dir="ltr" />
        </label>
      )}
      <label>
        שם מקורי
        <input name="nameOriginal" defaultValue={initial?.nameOriginal} />
      </label>
      <label>
        כינויים (מופרדים בפסיק)
        <input name="nicknames" defaultValue={initial?.nicknames.join(", ")} />
      </label>
      <div className="form-row">
        <label>
          תאריך לידה
          <input type="date" name="birthDate" defaultValue={initial?.birthDate} />
        </label>
        <label>
          תאריך פטירה
          <input type="date" name="deathDate" defaultValue={initial?.deathDate} />
        </label>
      </div>

      <fieldset className="activity-fieldset">
        <legend>קטגוריות פעילות</legend>
        <p className="muted">סרטים, דיבוב, מחזמר, קלטות, הופעות ועוד</p>
        <div className="chip-row">
          {ACTIVITY_LIST.map((cat) => (
            <label key={cat} className={`chip-check ${activities.includes(cat) ? "on" : ""}`}>
              <input
                type="checkbox"
                checked={activities.includes(cat)}
                onChange={() => toggleActivity(cat)}
              />
              {ACTIVITY_LABELS[cat]}
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        תגיות (מופרדות בפסיק)
        <input name="tags" defaultValue={initial?.tags.join(", ")} />
      </label>

      <ImageDropzone
        value={imageUrl}
        onChange={setImageUrl}
        label="תמונה (בחירה / גרירה / הדבקה)"
      />

      <label>
        ביוגרפיה
        <textarea name="bio" rows={8} defaultValue={initial?.bio} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? "שומר…" : initial ? "עדכון אישיות" : "הוספת אישיות לארכיון"}
      </button>
    </form>
  );
}
