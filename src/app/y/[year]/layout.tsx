import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return {
    title: year,
    description: `אישים שנולדו ושנפטרו ב-${year}`,
  };
}

export default function YearLayout({ children }: { children: ReactNode }) {
  return children;
}
