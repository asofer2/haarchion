import { NextResponse } from "next/server";
import { getClassicPeople } from "@/lib/archive-server";

export const runtime = "nodejs";
export const revalidate = 3600;
export const maxDuration = 60;

/**
 * People from the classic Ishim archive.
 * The browser uses this list for the directory and search, then loads
 * each person's roles from /api/people/[id].
 */
export async function GET() {
  try {
    const people = await getClassicPeople();
    return NextResponse.json(
      { people },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.warn("/api/people list failed", error);
    return NextResponse.json(
      { error: "people_unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }
}
