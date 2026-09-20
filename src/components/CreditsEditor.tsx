"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import { CitationField } from "@/components/CitationField";
import { PersonTypeahead } from "@/components/PersonTypeahead";
import { isSiteAdmin, SITE_ADMIN_NAME } from "@/lib/admin";
import {
  PENDING_NOTICE,
  requestOrApplyProductionCredits,
} from "@/lib/change-requests";
import {
  assignBillingOrders,
  compareCreditsForDisplay,
} from "@/lib/credit-order";
import type { ArchiveData, Credit, CreditRole } from "@/lib/types";
import { CREDIT_ROLE_LABELS } from "@/lib/types";

interface Props {
  productionId: string;
  productionTitle: string;
  data: ArchiveData;
  onSaved?: () => void;
}

type CreditRow = Credit & { rowKey: string };

function newRowKey() {
  return `cr-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyCredit(productionId: string): CreditRow {
  return { personId: "", productionId, role: "actor", rowKey: newRowKey() };
}

function toRows(credits: Credit[], productionId: string): CreditRow[] {
  if (!credits.length) return [emptyCredit(productionId)];
  return [...credits]
    .sort(compareCreditsForDisplay)
    .map((c) => ({ ...c, rowKey: newRowKey() }));
}

function rowIndexFromPoint(clientX: number, clientY: number): number | null {
  const el = document.elementFromPoint(clientX, clientY);
  const row = el?.closest<HTMLElement>("[data-credit-row-index]");
  if (!row) return null;
  const idx = Number(row.dataset.creditRowIndex);
  return Number.isFinite(idx) ? idx : null;
}

export function CreditsEditor({
  productionId,
  productionTitle,
  data,
  onSaved,
}: Props) {
  const { user } = useAuth();
  const admin = isSiteAdmin(user);
  const initial = useMemo(
    () => data.credits.filter((c) => c.productionId === productionId),
    [data.credits, productionId]
  );
  const [rows, setRows] = useState<CreditRow[]>(() =>
    toRows(initial, productionId)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragFrom = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const people = data.people;

  useEffect(() => {
    if (dragIndex === null) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = prev;
    };
  }, [dragIndex]);

  function updateRow(index: number, patch: Partial<Credit>) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function moveRow(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    setRows((prev) => {
      if (from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function endDrag(clientX: number, clientY: number) {
    const from = dragFrom.current;
    const to = rowIndexFromPoint(clientX, clientY);
    if (from !== null && to !== null) moveRow(from, to);
    dragFrom.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }

  function onHandlePointerDown(index: number, e: ReactPointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragFrom.current = index;
    setDragIndex(index);
    setOverIndex(index);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHandlePointerMove(e: ReactPointerEvent) {
    if (dragFrom.current === null) return;
    const to = rowIndexFromPoint(e.clientX, e.clientY);
    if (to !== null && to !== overIndex) setOverIndex(to);
  }

  function onHandlePointerUp(e: ReactPointerEvent) {
    if (dragFrom.current === null) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    endDrag(e.clientX, e.clientY);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (!user) {
        setMessage("יש להתחבר כדי לשמור קרדיטים");
        return;
      }
      const form = e.currentTarget as HTMLFormElement;
      const citation = String(new FormData(form).get("citation") || "").trim();
      const cleaned = assignBillingOrders(
        rows
          .filter((r) => r.personId && r.role)
          .map(({ rowKey: _rowKey, ...credit }) => credit)
      );
      const result = await requestOrApplyProductionCredits(
        {
          uid: user.uid,
          displayName: user.displayName || undefined,
          email: user.email,
        },
        productionId,
        productionTitle,
        cleaned,
        citation
      );
      setMessage(result.pending ? PENDING_NOTICE : "הקרדיטים נשמרו");
      if (!result.pending) onSaved?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="edit-form"
      onSubmit={onSubmit}
      style={{ marginTop: "1.5rem" }}
    >
      <h2 style={{ margin: 0, fontFamily: "var(--font-rubik)" }}>קרדיטים</h2>
      <p className="muted">
        חיפוש אישיות לפי שם — הקלידו לבחירה מהרשימה. גררו את ידית ⋮⋮ (או לחצו ↑↓)
        כדי לשנות סדר שחקנים/מדבבים בתוך הקבוצה; הסדר נשמר בלחיצה על שמירה.
        {!admin && ` השינוי יישלח לאישור ${SITE_ADMIN_NAME}.`}
      </p>
      <div
        ref={listRef}
        className={
          dragIndex !== null ? "credit-list-editor is-reordering" : "credit-list-editor"
        }
      >
        {rows.map((row, index) => (
          <div
            className={[
              "form-row",
              "credit-row",
              dragIndex === index ? "credit-row-dragging" : "",
              overIndex === index && dragIndex !== index
                ? "credit-row-drop-target"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={row.rowKey}
            data-credit-row-index={index}
          >
            <span
              role="button"
              tabIndex={0}
              className="credit-drag-handle"
              aria-label={`גרירת שורה ${index + 1} לשינוי סדר`}
              title="גררו לשינוי סדר"
              onPointerDown={(e) => onHandlePointerDown(index, e)}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  moveRow(index, index - 1);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  moveRow(index, index + 1);
                }
              }}
            >
              ⋮⋮
            </span>
            <label>
              אישיות
              <PersonTypeahead
                people={people}
                value={row.personId}
                onChange={(personId) => updateRow(index, { personId })}
              />
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
                onChange={(e) =>
                  updateRow(index, { characterName: e.target.value })
                }
              />
            </label>
            <div className="credit-row-actions">
              <button
                type="button"
                className="btn btn-ghost credit-move-btn"
                aria-label="הזזה למעלה"
                disabled={index === 0}
                onClick={() => moveRow(index, index - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-ghost credit-move-btn"
                aria-label="הזזה למטה"
                disabled={index === rows.length - 1}
                onClick={() => moveRow(index, index + 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() =>
                  setRows((prev) => prev.filter((_, i) => i !== index))
                }
              >
                הסרה
              </button>
            </div>
          </div>
        ))}
      </div>
      <CitationField />
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            setRows((prev) => [...prev, emptyCredit(productionId)])
          }
        >
          + קרדיט
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "שומר…" : admin ? "שמירת קרדיטים" : "שליחת בקשה לאישור"}
        </button>
      </div>
      {message && <p className="muted">{message}</p>}
    </form>
  );
}
