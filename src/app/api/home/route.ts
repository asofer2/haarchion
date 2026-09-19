import { NextResponse } from "next/server";
import { getCachedHomeSummary } from "@/lib/home-summary";
import { ARCHIVE_REVALIDATE_SECONDS } from "@/lib/archive-server";

export const runtime = "nodejs";
export const revalidate = 3600;

/** Lightweight homepage widgets for CDN / client fallback. */
export async function GET() {
  try {
    const summary = await getCachedHomeSummary();
    return NextResponse.json(summary, {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${ARCHIVE_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  } catch (error) {
    console.warn("/api/home failed", error);
    return NextResponse.json(
      { error: "home_unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
