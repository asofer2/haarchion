"use client";

import { FormEvent, useMemo, useState } from "react";
import { saveCreditsForProduction } from "@/lib/data";
import type { ArchiveData, Credit, CreditRole } from "@/lib/types";
import { CREDIT_ROLE_LABELS } from "@/lib/types";

interface Props {
  productionId: string;
  data: ArchiveData;
  onSaved?: () => void;
}

export function CreditsEditor({ productionId, data, onSaved }: Props) {
  const initial = useMemo(
    () => data.credits.filter((c) => c.productionId === productionId),
    [data.credits, productionId]
  );
  const [rows, setRows] = useState<Credit[]>(
    initial.length
      ? initial
      : [{ personId: data.people[0]?.id || "", productionId, role: "actor" }]
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateRow(index: number, patch: Partial<Credit>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const cleaned = rows.filter((r) => r.personId && r.role);
      await saveCreditsForProduction(productionId, cleaned);
      setMessage("הקרדיטים נשמרו");
      onSaved?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="edit-form" onSubmit={onSubmit} style={{ marginTop: "1.5rem" }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-rubik)" }}>קרדיטים</h2>
      <p className="muted">קישור דו־כיווני לאישים בהפקה.</p>
      {rows.map((row, index) => (
        <div className="form-row" key={`${row.personId}-${index}`}>
          <label>
            אישיות
            <select
              value={row.personId}
              onChange={(e) => updateRow(index, { personId: e.target.value })}
            >
              {data.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            תפקיד
            <select
              value={row.role}
              onChange={(e) =>
                updateRow(index, { role: e.target.value as CreditRole })
              }
            >
              {(Object.keys(CREDIT_ROLE_LABELS) as CreditRole[]).map((role) => (
                <option key={role} value={role}>
                  {CREDIT_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>
          <label>
            דמות (אופציונלי)
            <input
              value={row.characterName || ""}
              onChange={(e) => updateRow(index, { characterName: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
          >
            הסרה
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                personId: data.people[0]?.id || "",
                productionId,
                role: "actor",
              },
            ])
          }
        >
          + קרדיט
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "שומר…" : "שמירת קרדיטים"}
        </button>
      </div>
      {message && <p className="muted">{message}</p>}
    </form>
  );
}
