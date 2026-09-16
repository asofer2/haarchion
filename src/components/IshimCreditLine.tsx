import Link from "next/link";

type IshimCreditLineProps = {
  href: string;
  lead: string;
  characters?: string;
  /** שנה / טווח שנים — ללא סוגריים מרובעים (דף אישיות) או עם `[…]` (דף הפקה) */
  year?: number | string;
  /**
   * Classic production cast: year after name/character → visually LEFT in RTL
   * (`שם דמות [2009]`). Default keeps year at the start (person pages).
   */
  yearAtEnd?: boolean;
};

/** שורת קרדיט אחת: שם · דמויות · שנה — כמו באישים הקלאסי */
export function IshimCreditLine({
  href,
  lead,
  characters,
  year,
  yearAtEnd = false,
}: IshimCreditLineProps) {
  const yearEl =
    year !== undefined && year !== "" ? (
      <span className={`ishim-year${yearAtEnd ? " ishim-year-end" : ""}`}>
        {year}
      </span>
    ) : null;

  return (
    <li className="ishim-credit-row">
      {!yearAtEnd ? yearEl : null}
      <Link href={href} className="ishim-credit-line">
        <span className="ishim-credit-title">{lead}</span>
      </Link>
      {characters ? <span className="ishim-chars">{characters}</span> : null}
      {yearAtEnd ? yearEl : null}
    </li>
  );
}
