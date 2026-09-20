import { NextResponse } from "next/server";
import {
  getCachedFirestoreArchive,
  warmFirebaseConnection,
} from "@/lib/archive-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cold-start warmer for Vercel cron — touches Admin/Firestore (or no-op when unset)
 * and keeps the archive cache entry warm.
 */
export async function GET() {
  const started = Date.now();

  try {
    const warm = await warmFirebaseConnection();
    // Best-effort: populate unstable_cache for subsequent /api/archive hits
    if (warm.mode !== "unset") {
      void getCachedFirestoreArchive().catch(() => undefined);
    }

    return NextResponse.json({
      ok: true,
      warm: warm.mode,
      ms: Date.now() - started,
    });
  } catch (error) {
    console.warn("/api/ping warm failed", error);
    return NextResponse.json({
      ok: true,
      warm: "error",
      ms: Date.now() - started,
    });
  }
}
