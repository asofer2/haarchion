import { NextRequest, NextResponse } from "next/server";
import { getPersonFilmography } from "@/lib/archive-server";

export const runtime = "nodejs";
export const revalidate = 3600;
export const maxDuration = 60;

/**
 * One person's roles from the full Ishim catalog.
 * The browser must not wait for the ~40MB /api/archive download to show them.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const bundle = await getPersonFilmography(id);
    if (!bundle) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.json(bundle, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.warn("/api/people failed", error);
    return NextResponse.json(
      { error: "person_unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }
}
