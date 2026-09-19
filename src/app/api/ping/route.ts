import { NextResponse } from "next/server";
import { warmFirebaseConnection } from "@/lib/archive-server";
import { getCachedHomeSummary } from "@/lib/home-summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cold-start warmer for Vercel cron — touches Admin/Firestore (or no-op when unset)
 * and keeps the lightweight home summary warm. Does not pull the full archive.
 */
export async function GET() {
  const started = Date.now();

  try {
    const warm = await warmFirebaseConnection();
    if (warm.mode !== "unset") {
      void getCachedHomeSummary().catch(() => undefined);
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
