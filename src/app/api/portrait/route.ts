import { NextRequest, NextResponse } from "next/server";
import {
  PORTRAIT_UA,
  resolvePortraitDeep,
  resolvePortraitFast,
} from "@/lib/portrait-resolve";

/** Server-only image proxy — keep fetch/UA logic here, not in the client bundle. */
export const runtime = "nodejs";
export const revalidate = 86400;

/** In-memory cache for this Node process (huge win during grid loads) */
const memCache = new Map<string, { url: string | null; at: number }>();
const MEM_TTL_MS = 1000 * 60 * 60 * 12;

async function proxyImage(source: string): Promise<NextResponse> {
  const imageRes = await fetch(source, {
    headers: {
      "User-Agent": PORTRAIT_UA,
      Referer: "https://he.wikipedia.org/",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 86400 },
  });
  if (!imageRes.ok || !imageRes.body) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(imageRes.body, {
    status: 200,
    headers: {
      "Content-Type": imageRes.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
    },
  });
}

function svgAvatar(name: string): NextResponse {
  const letter = name.trim().slice(0, 1) || "?";
  const safeName = name
    .slice(0, 28)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const safeLetter = letter
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a3a6b"/>
      <stop offset="100%" stop-color="#008000"/>
    </linearGradient>
  </defs>
  <rect width="640" height="800" fill="url(#g)"/>
  <circle cx="320" cy="300" r="120" fill="rgba(255,252,247,0.18)"/>
  <text x="320" y="340" text-anchor="middle" font-size="140" fill="#fffcf7"
        font-family="Arial, sans-serif">${safeLetter}</text>
  <text x="320" y="520" text-anchor="middle" font-size="28" fill="#fffcf7"
        font-family="Arial, sans-serif" opacity="0.9">${safeName}</text>
</svg>`;
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  const also = request.nextUrl.searchParams.get("also")?.trim() || null;
  const title = request.nextUrl.searchParams.get("title")?.trim();
  const kind = request.nextUrl.searchParams.get("kind")?.trim() || null;
  const deep = request.nextUrl.searchParams.get("deep") === "1";
  const meta = request.nextUrl.searchParams.get("meta") === "1";
  const query = name || title;

  if (!query) {
    return NextResponse.json({ error: "missing name" }, { status: 400 });
  }

  const cacheKey = `${query}|${also || ""}|${kind || ""}|${deep ? "d" : "f"}`;
  const cached = memCache.get(cacheKey);
  if (cached && Date.now() - cached.at < MEM_TTL_MS) {
    if (meta) {
      return NextResponse.json({
        found: Boolean(cached.url),
        url: cached.url,
        cached: true,
      });
    }
    if (cached.url) return proxyImage(cached.url);
    return svgAvatar(query);
  }

  try {
    const source = deep
      ? await resolvePortraitDeep(query, also, kind)
      : await resolvePortraitFast(query, also, kind);
    memCache.set(cacheKey, { url: source, at: Date.now() });
    if (meta) {
      return NextResponse.json({
        found: Boolean(source),
        url: source,
        cached: false,
      });
    }
    if (source) return proxyImage(source);
    return svgAvatar(query);
  } catch {
    memCache.set(cacheKey, { url: null, at: Date.now() });
    if (meta) {
      return NextResponse.json({ found: false, url: null, cached: false });
    }
    return svgAvatar(query);
  }
}
