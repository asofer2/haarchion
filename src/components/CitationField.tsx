/** שדה סימוכין — מקור העדכון הנוכחי (חובה בעריכות). */
export function CitationField({
  defaultValue,
  required = true,
}: {
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <fieldset className="activity-fieldset">
      <legend>סימוכין</legend>
      <p className="muted">
        ציינו את מקור העדכון — קישור, ספר, ארכיון Wayback, כיתוב DVD וכו׳.
        יופיע בהיסטוריית העדכונים של הערך.
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
