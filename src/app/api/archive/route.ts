import { NextRequest, NextResponse } from "next/server";
import {
  getCachedFirestoreArchive,
  readFirestoreArchiveServer,
} from "@/lib/archive-server";

export const runtime = "nodejs";
/** Must be a literal for Next segment config analysis. */
export const revalidate = 3600;

/**
 * CDN-friendly archive snapshot.
 * Client `loadArchive` prefers this over four browser Firestore getDocs calls.
 */
export async function GET(request: NextRequest) {
  const fresh = request.nextUrl.searchParams.get("fresh") === "1";

  try {
    const data = fresh
      ? await readFirestoreArchiveServer()
      : await getCachedFirestoreArchive();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": fresh
          ? "private, no-store"
          : "public, s-maxage=3600, stale-while-revalidate=86400",
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
