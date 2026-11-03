import { NextRequest, NextResponse } from "next/server";
import { getCachedFirestoreArchive } from "@/lib/archive-server";
import { searchArchive } from "@/lib/search";
import type { Person, Production } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 3600;
export const maxDuration = 60;

const LIMIT = 40;

function slimPerson(person: Person): Person {
  return {
    id: person.id,
    name: person.name,
    nameOriginal: person.nameOriginal,
    nicknames: person.nicknames || [],
    bio: person.bio || "",
    tags: person.tags || [],
    activities: person.activities || [],
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    imageUrl: person.imageUrl,
    ishimClassic: person.ishimClassic,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  };
}

function slimProduction(production: Production): Production {
  return {
    id: production.id,
    title: production.title,
    originalTitle: production.originalTitle,
    year: production.year,
    endYear: production.endYear,
    kind: production.kind,
    summary: production.summary || "",
    genres: production.genres || [],
    channel: production.channel,
    imageUrl: production.imageUrl,
    ishimClassic: production.ishimClassic,
    createdAt: production.createdAt,
    updatedAt: production.updatedAt,
  };
}

/**
 * Search the full catalog on the server.
 * The browser's first copy is the small seed, which does not include
 * classic titles such as כנפי הרעם.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json(
      { people: [], productions: [] },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }

  try {
    const data = await getCachedFirestoreArchive();
    const found = searchArchive(data, q);
    const productions = [
      ...found.films,
      ...found.series,
      ...found.productions,
    ].slice(0, LIMIT);
    return NextResponse.json(
      {
        people: found.people.slice(0, LIMIT).map(slimPerson),
        productions: productions.map(slimProduction),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.warn("/api/search failed", error);
    return NextResponse.json(
      { error: "search_unavailable", people: [], productions: [] },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
