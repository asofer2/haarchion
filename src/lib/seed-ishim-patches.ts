import type { ArchiveData } from "./types";
import { applyIshimAnvrShtgrAzra } from "./seed-ishim-anvr-shtgr-azra";
import { applyIshimAzraHs } from "./seed-ishim-azra-hs";
import { applyIshimChnhDrvryKshy } from "./seed-ishim-chnh-drvry-kshy";
import { applyIshimChnnGoldblatt } from "./seed-ishim-chnn-goldblatt";
import { applyIshimGadiPor } from "./seed-ishim-gadi-por";
import { applyIshimHyhHyhHadm } from "./seed-ishim-hyh-hyh-hadm";
import { applyIshimKopyko2009 } from "./seed-ishim-kopyko-2009";
import { applyIshimNalvlym } from "./seed-ishim-nalvlym";
import { applyIshimPeterPan } from "./seed-ishim-peter-pan";
import { applyIshimPinocchioAdventures1993 } from "./seed-ishim-pinocchio-adventures";
import { applyIshimSavriMaranan } from "./seed-ishim-savri-maranan";
import { applyIshimTuviaTsafir } from "./seed-ishim-tuvia-tsafir";
import { applyIshimYaakovShemTov } from "./seed-ishim-yaakov-shem-tov";

/** ערכי אישים/הפקות שלא בארכיון הגדול — מיושמים אחרי applyIshimArchive */
export function applyIshimPersonPatches(data: ArchiveData): ArchiveData {
  return applyIshimSavriMaranan(
    applyIshimPinocchioAdventures1993(
      applyIshimYaakovShemTov(
        applyIshimKopyko2009(
          applyIshimPeterPan(
            applyIshimAnvrShtgrAzra(
              applyIshimChnhDrvryKshy(
                applyIshimNalvlym(
                  applyIshimHyhHyhHadm(
                    applyIshimChnnGoldblatt(
                      applyIshimTuviaTsafir(
                        applyIshimGadiPor(applyIshimAzraHs(data))
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}
