import type { Person, Production, ProductionKind } from "./types";

export type IshimDirectoryItem = {
  label: string;
  addHref: string;
  listHref: string;
  kinds?: ProductionKind[];
  people?: boolean;
};

/** Classic ishim «הוספה» / homepage directory, in that order. */
export const ISHIM_DIRECTORY: IshimDirectoryItem[] = [
  {
    label: "סדרת טלוויזיה",
    addHref: "/productions/new?kind=tv_series",
    listHref: "/productions?kind=tv_series",
    kinds: ["tv_series", "series", "miniseries"],
  },
  {
    label: "תוכנית טלוויזיה",
    addHref: "/productions/new?kind=tv_program",
    listHref: "/productions?kind=tv_program",
    kinds: ["tv_program"],
  },
  {
    label: "סרט טלוויזיה",
    addHref: "/productions/new?kind=film_tv",
    listHref: "/productions?kind=film_tv",
    kinds: ["film_tv"],
  },
  {
    label: "סרט קולנוע",
    addHref: "/productions/new?kind=film_cinema",
    listHref: "/productions?kind=film_cinema",
    kinds: ["film_cinema", "film"],
  },
  {
    label: "תוכנית רדיו",
    addHref: "/productions/new?kind=radio_program",
    listHref: "/productions?kind=radio_program",
    kinds: ["radio_program", "radio"],
  },
  {
    label: "סרט סטודנטים",
    addHref: "/productions/new?kind=film_student",
    listHref: "/productions?kind=film_student",
    kinds: ["film_student"],
  },
  {
    label: "קלטת ילדים",
    addHref: "/productions/new?kind=cassette_kids",
    listHref: "/productions?kind=cassette_kids",
    kinds: ["cassette_kids", "cassette"],
  },
  {
    label: "הרכב",
    addHref: "/productions/new?kind=ensemble",
    listHref: "/productions?kind=ensemble",
    kinds: ["ensemble"],
  },
  {
    label: "אדם",
    addHref: "/people/new",
    listHref: "/people",
    people: true,
  },
  {
    label: "סדרה זרה מדובבת",
    addHref: "/productions/new?kind=series_dubbed_foreign",
    listHref: "/productions?kind=series_dubbed_foreign",
    kinds: ["series_dubbed_foreign"],
  },
  {
    label: "סרט זר מדובב",
    addHref: "/productions/new?kind=film_dubbed_foreign",
    listHref: "/productions?kind=film_dubbed_foreign",
    kinds: ["film_dubbed_foreign"],
  },
  {
    label: "סדרה ישראלית עם קטעים זרים מדובבים",
    addHref: "/productions/new?kind=series_israeli_foreign_dubbed",
    listHref: "/productions?kind=series_israeli_foreign_dubbed",
    kinds: ["series_israeli_foreign_dubbed"],
  },
];

export function directoryCount(
  item: IshimDirectoryItem,
  people: Person[],
  productions: Production[]
): number {
  if (item.people) return people.length;
  if (!item.kinds) return 0;
  return productions.filter((p) => item.kinds!.includes(p.kind)).length;
}

export function productionsForKindParam(
  productions: Production[],
  kindParam: string | null
): Production[] | null {
  if (!kindParam) return null;
  const item = ISHIM_DIRECTORY.find((entry) =>
    entry.addHref.includes(`kind=${kindParam}`)
  );
  if (item?.kinds) {
    return productions.filter((p) => item.kinds!.includes(p.kind));
  }
  return productions.filter((p) => p.kind === kindParam);
}

export function isProductionKindParam(value: string | null): value is ProductionKind {
  if (!value) return false;
  return ISHIM_DIRECTORY.some((item) =>
    item.addHref.includes(`kind=${value}`)
  );
}

export function loginOr(href: string, signedIn: boolean): string {
  if (signedIn) return href;
  return `/auth?next=${encodeURIComponent(href)}`;
}

export function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/me";
  }
  return raw;
}
