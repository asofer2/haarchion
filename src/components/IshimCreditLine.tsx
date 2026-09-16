import Link from "next/link";

type IshimCreditLineProps = {
  href: string;
  lead: string;
  characters?: string;
  /** שנה / טווח שנים בתחילת השורה (מימין בשורה אחת) */
  year?: number | string;
};

/** שורת קרדיט אחת: שנה · שם/כותרת · דמויות — הכל בשורה אחת */
export function IshimCreditLine({
  href,
  lead,
  characters,
  year,
}: IshimCreditLineProps) {
  return (
    <li className="ishim-credit-row">
      <Link href={href} className="ishim-credit-line">
        {year !== undefined && year !== "" ? (
          <span className="ishim-year">{year}</span>
        ) : null}
        <span className="ishim-credit-title">{lead}</span>
        {characters ? <span className="ishim-chars">{characters}</span> : null}
      </Link>
    </li>
  );
}
