import { NextResponse, type NextRequest } from "next/server";

/** In-memory sliding window — best-effort per edge isolate (not a full WAF). */
const hits = new Map<string, { count: number; resetAt: number }>();

const API_WINDOW_MS = 60_000;
const API_MAX_HITS = 60;
const SCRAPE_UA =
  /(?:scrapy|httplib|python-requests|curl\/|wget|libwww|httpclient|go-http-client|java\/|phantomjs|headlesschrome|bytespider|petalbot|ahrefsbot|semrushbot|mj12bot|dotbot|barkrowler)/i;
const GOOD_BOT =
  /(?:googlebot|bingbot|slurp|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|applebot|yandexbot)/i;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now >= row.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  row.count += 1;
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (now >= v.resetAt) hits.delete(k);
    }
  }
  return row.count > max;
}

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.headers.set("X-Robots-Tag", "all");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") || "";
  const ip = clientIp(req);

  // Soft-block aggressive scrapers on HTML pages (allow known search bots)
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    ua &&
    SCRAPE_UA.test(ua) &&
    !GOOD_BOT.test(ua)
  ) {
    return withSecurityHeaders(
      new NextResponse("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }

  // Rate-limit public image/proxy APIs
  if (pathname.startsWith("/api/")) {
    const key = `api:${ip}:${pathname.split("/", 3).slice(0, 3).join("/")}`;
    if (rateLimited(key, API_MAX_HITS, API_WINDOW_MS)) {
      return withSecurityHeaders(
        new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Retry-After": "60",
          },
        })
      );
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo-ishim.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
