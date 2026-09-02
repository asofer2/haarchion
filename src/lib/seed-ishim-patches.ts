import type { ArchiveData } from "./types";
import { applyIshimChnnGoldblatt } from "./seed-ishim-chnn-goldblatt";
import { applyIshimGadiPor } from "./seed-ishim-gadi-por";

/** ערכי אישים שלא בארכיון הגדול — מיושמים אחרי applyIshimArchive */
export function applyIshimPersonPatches(data: ArchiveData): ArchiveData {
  return applyIshimChnnGoldblatt(applyIshimGadiPor(data));
}
