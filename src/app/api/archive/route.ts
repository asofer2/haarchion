import { NextResponse } from "next/server";
import { seedArchiveBaseline } from "@/lib/data";

export const runtime = "nodejs";
/** Must be a literal for Next segment config analysis. */
export const revalidate = 3600;

/**
 * Lean archive snapshot only (seed baseline).
 * Never dumps full ishim / full Firestore — keeps cold starts fast.
 * Explicit client refresh (admin) still gets this lean shape.
 */
export async function GET() {
  try {
    const data = seedArchiveBaseline();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.warn("/api/archive failed", error);
    return NextResponse.json(
      { error: "archive_unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }
}
