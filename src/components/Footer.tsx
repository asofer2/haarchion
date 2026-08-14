import Link from "next/link";
import { FooterA11yLink } from "@/components/FooterA11yLink";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-ishim.png"
            alt="אישים — לוגו האתר"
            className="footer-logo"
            width={120}
            height={40}
          />
          <p>
            מאגר מקושר של אישים והפקות ישראליים — דיבוב, מחזמר, קולנוע וקלטות.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/people">אישים</Link>
          <Link href="/productions">הפקות</Link>
          <Link href="/search">חיפוש</Link>
          <FooterA11yLink />
        </div>
        <p className="footer-a11y-note">
          האתר מותאם לכבדי ראייה — לחצו „נגישות” לשינוי גודל טקסט, ניגודיות
          ועוד.
        </p>
      </div>
    </footer>
  );
}
