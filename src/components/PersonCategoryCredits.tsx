"use client";

import { useMemo } from "react";
import { ISHIM_CREDIT_SECTIONS, ishimRoleHeading } from "@/lib/ishim-person";
import type { ArchiveData, CreditRole } from "@/lib/types";

export type CategoryCreditRow = {
  key: string;
  title: string;
  year: string;
  characterName: string;
  role: CreditRole;
};

export function emptyRow(role: CreditRole): CategoryCreditRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    year: "",
    characterName: "",
    role,
  };
}

export function emptyIshimRows(): Record<string, CategoryCreditRow[]> {
  return Object.fromEntries(
    ISHIM_CREDIT_SECTIONS.map((section) => [
      section.heading,
      [emptyRow(section.roles[0])],
    ])
  );
}

export function rowsFromArchive(
  personId: string,
  data: ArchiveData
): Record<string, CategoryCreditRow[]> {
  const grouped = emptyIshimRows();

  const credits = data.credits.filter((c) => c.personId === personId);
  for (const credit of credits) {
    const production = data.productions.find((p) => p.id === credit.productionId);
    if (!production) continue;
    const heading = ishimRoleHeading(credit.role);
    const list = grouped[heading] || [];
    const filled = list.filter((row) => row.title.trim());
    filled.push({
      key: `${credit.productionId}-${credit.role}`,
      title: production.title,
      year: production.year ? String(production.year) : "",
      characterName: credit.characterName || "",
      role: credit.role,
    });
    grouped[heading] = filled.length ? filled : [emptyRow(credit.role)];
  }

  for (const section of ISHIM_CREDIT_SECTIONS) {
    if (!grouped[section.heading]?.length) {
      grouped[section.heading] = [emptyRow(section.roles[0])];
    }
  }
  return grouped;
}

interface Props {
  rows: Record<string, CategoryCreditRow[]>;
  onChange: (rows: Record<string, CategoryCreditRow[]>) => void;
  productions: ArchiveData["productions"];
}

export function PersonCategoryCredits({
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
    heading: string,
    index: number,
    patch: Partial<CategoryCreditRow>
  ) {
    const list = [...(rows[heading] || [])];
    list[index] = { ...list[index]!, ...patch };
    onChange({ ...rows, [heading]: list });
  }

  function addRow(heading: string, role: CreditRole) {
    onChange({ ...rows, [heading]: [...(rows[heading] || []), emptyRow(role)] });
  }

  function removeRow(heading: string, index: number, fallbackRole: CreditRole) {
    const list = (rows[heading] || []).filter((_, i) => i !== index);
    onChange({
      ...rows,
      [heading]: list.length ? list : [emptyRow(fallbackRole)],
    });
  }

  return (
    <fieldset className="person-category-credits">
      <legend>קרדיטים לפי תפקיד</legend>
      <p className="muted">
        כמו באתר אישים: שנה, שם הפקה עם קישור, ושם דמות בשורה אחת — לפי תפקיד
        (תסריטאי, שחקן, במאי דיבוב, מדבב…).
      </p>
      {ISHIM_CREDIT_SECTIONS.map((section) => (
        <div key={section.heading} className="category-credit-block">
          <h3>
            {section.heading}
            <span className="meta">
              {" "}
              ({(rows[section.heading] || []).filter((r) => r.title.trim()).length})
            </span>
          </h3>
          {(rows[section.heading]?.length
            ? rows[section.heading]!
            : [emptyRow(section.roles[0])]
          ).map((row, index) => (
            <div className="category-credit-row" key={row.key}>
              <label>
                שם ההפקה
                <input
                  list="archive-production-titles"
                  value={row.title}
                  onChange={(e) =>
                    updateRow(section.heading, index, { title: e.target.value })
                  }
                  placeholder="למשל פרפר נחמד"
                />
              </label>
              <label>
                שנה
                <input
                  type="number"
                  value={row.year}
                  onChange={(e) =>
                    updateRow(section.heading, index, { year: e.target.value })
                  }
                  placeholder="1989"
                />
              </label>
              <label>
                דמות / פירוט
                <input
                  value={row.characterName}
                  onChange={(e) =>
                    updateRow(section.heading, index, {
                      characterName: e.target.value,
                    })
                  }
                  placeholder="אופציונלי"
                />
              </label>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  removeRow(section.heading, index, section.roles[0])
                }
              >
                הסרה
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addRow(section.heading, section.roles[0])}
          >
            + הוספה ל{section.heading}
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
