import Link from "next/link";

export default function QuestionsPage() {
  return (
    <div className="year-calendar">
      <h1 className="page-title">כל השאלות</h1>
      <p className="notice" style={{ marginBottom: "1.25rem" }}>
        באתר אישים הישן הייתה מערכת שאלות ותשובות. כאן עדיין אין מאגר שאלות
        מהקהילה — בינתיים כמה שאלות נפוצות על האתר.
      </p>

      <section className="year-section">
        <h2>איך מוצאים אישיות?</h2>
        <p>
          דרך <Link href="/search">חיפוש</Link> או רשימת{" "}
          <Link href="/people">אישים</Link>.
        </p>
      </section>

      <section className="year-section">
        <h2>איפה לוח השנה?</h2>
        <p>
          ברשימות בחרו «כל התאריכים», או פתחו את{" "}
          <Link href="/y">לוח השנה</Link> — מי שנולד ומי שנפטר בכל שנה.
        </p>
      </section>

      <section className="year-section">
        <h2>איך מוסיפים ערך?</h2>
        <p>
          <Link href="/add">הוספה</Link> — אחרי התחברות עם Google אפשר להוסיף
          אישיות או הפקה.
        </p>
      </section>
    </div>
  );
}
