"use client";

import { useMemo } from "react";
import type { ArchiveData, ActivityCategory } from "@/lib/types";
import { ACTIVITY_LABELS, primaryActivityForCredit } from "@/lib/types";

export type CategoryCreditRow = {
  key: string;
  title: string;
  year: string;
  characterName: string;
};

export function emptyRow(): CategoryCreditRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    year: "",
    characterName: "",
  };
}

export function rowsFromArchive(
  personId: string,
  activities: ActivityCategory[],
  data: ArchiveData
): Partial<Record<ActivityCategory, CategoryCreditRow[]>> {
  const grouped: Partial<Record<ActivityCategory, CategoryCreditRow[]>> = {};
  for (const activity of activities) grouped[activity] = [];

  const credits = data.credits.filter((c) => c.personId === personId);
  for (const credit of credits) {
    const production = data.productions.find((p) => p.id === credit.productionId);
    if (!production) continue;
    const bucket = primaryActivityForCredit(credit.role, production.kind, activities);
    if (!activities.includes(bucket)) continue;
    const list = grouped[bucket] || [];
    list.push({
      key: `${credit.productionId}-${credit.role}`,
      title: production.title,
      year: production.year ? String(production.year) : "",
      characterName: credit.characterName || "",
    });
    grouped[bucket] = list;
  }

  for (const activity of activities) {
    if (!grouped[activity]?.length) grouped[activity] = [emptyRow()];
  }
  return grouped;
}

interface Props {
  activities: ActivityCategory[];
  rows: Partial<Record<ActivityCategory, CategoryCreditRow[]>>;
  onChange: (rows: Partial<Record<ActivityCategory, CategoryCreditRow[]>>) => void;
  productions: ArchiveData["productions"];
}

export function PersonCategoryCredits({
  activities,
  rows,
  onChange,
  productions,
}: Props) {
  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    return productions
      .map((p) => p.title)
      .filter((title) => {
        if (seen.has(title)) return false;
        seen.add(title);
        return true;
      })
      .slice(0, 400);
  }, [productions]);

  function updateRow(
    activity: ActivityCategory,
    index: number,
    patch: Partial<CategoryCreditRow>
  ) {
    const list = [...(rows[activity] || [])];
    list[index] = { ...list[index]!, ...patch };
    onChange({ ...rows, [activity]: list });
  }

  function addRow(activity: ActivityCategory) {
    onChange({ ...rows, [activity]: [...(rows[activity] || []), emptyRow()] });
  }

  function removeRow(activity: ActivityCategory, index: number) {
    const list = (rows[activity] || []).filter((_, i) => i !== index);
    onChange({ ...rows, [activity]: list.length ? list : [emptyRow()] });
  }

  if (activities.length === 0) return null;

  return (
    <fieldset className="person-category-credits">
      <legend>פעילויות לפי קטגוריה</legend>
      <p className="muted">
        הוסיפו הפקות לכל קטגוריה בנפרד. הן יופיעו בסוף דף האישיות לפי תפקיד וסוג.
      </p>
      {activities.map((activity) => (
        <div key={activity} className="category-credit-block">
          <h3>
            {ACTIVITY_LABELS[activity]}
            <span className="meta">
              {" "}
              ({(rows[activity] || []).filter((r) => r.title.trim()).length})
            </span>
          </h3>
          {(rows[activity] || []).map((row, index) => (
            <div className="category-credit-row" key={row.key}>
              <label>
                שם ההפקה
                <input
                  list="archive-production-titles"
                  value={row.title}
                  onChange={(e) =>
                    updateRow(activity, index, { title: e.target.value })
                  }
                  placeholder="למשל פאודה"
                />
              </label>
              <label>
                שנה
                <input
                  type="number"
                  value={row.year}
                  onChange={(e) =>
                    updateRow(activity, index, { year: e.target.value })
                  }
                  placeholder="2015"
                />
              </label>
              <label>
                דמות / פירוט
                <input
                  value={row.characterName}
                  onChange={(e) =>
                    updateRow(activity, index, {
                      characterName: e.target.value,
                    })
                  }
                  placeholder="אופציונלי"
                />
              </label>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeRow(activity, index)}
              >
                הסרה
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addRow(activity)}
          >
            + הוספה ל{ACTIVITY_LABELS[activity]}
          </button>
        </div>
      ))}
      <datalist id="archive-production-titles">
        {suggestions.map((title) => (
          <option key={title} value={title} />
        ))}
      </datalist>
    </fieldset>
  );
}
