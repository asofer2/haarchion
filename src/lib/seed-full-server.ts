import "server-only";

import { SEED } from "@/lib/seed";
import { applyIshimArchive } from "@/lib/seed-ishim-archive";
import { applyIshimPersonPatches } from "@/lib/seed-ishim-patches";
import { normalizeArchiveData } from "@/lib/data";
import type { ArchiveData } from "@/lib/types";

let cached: ArchiveData | null = null;

/**
 * Full catalog for server routes (includes classic ishim scrape).
 * Kept out of the client bundle — the JSON is ~35MB.
 */
export function fullSeedArchive(): ArchiveData {
  if (cached) return cached;
  cached = normalizeArchiveData(
    applyIshimPersonPatches(applyIshimArchive(structuredClone(SEED)))
  );
  return cached;
}
