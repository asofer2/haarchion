/** שדה סימוכין — מקור העדכון הנוכחי (אופציונלי). */
export function CitationField({
  defaultValue,
  required = false,
}: {
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <fieldset className="activity-fieldset">
      <legend>סימוכין</legend>
      <p className="muted">
        אופציונלי — מקור העדכון (קישור, ספר, ארכיון Wayback, כיתוב DVD וכו׳).
        אם ימולא, יופיע בהיסטוריית העדכונים של הערך.
      </p>
      <label>
        סימוכין
        <input
          name="citation"
          defaultValue={defaultValue}
          required={required}
          placeholder="למשל https://web.archive.org/… או ויקיפדיה / שם ספר"
        />
      </label>
    </fieldset>
  );
}
