import type { ArchiveData } from "./types";
import { applyIshimMagicSchoolBus } from "./seed-ishim-avtvbvs-hksmym";
import { applyIshimHaPigamot } from "./seed-ishim-ha-pigamot";
import { applyIshimKesemHaMagi } from "./seed-ishim-ksm-hmgy";
import { applyIshimHopTamirOct } from "./seed-ishim-hoptamir-oct";
import { applyIshimKassaiLeuk } from "./seed-ishim-ksay-lvk-vmrnh";
import { applyIshimHopLionAndBears } from "./seed-ishim-hop-lion-bears";
import { applyIshimLionKing3 } from "./seed-ishim-mlk-haryvt-3";
import { applyIshimTimonPumbaa } from "./seed-ishim-tymvn-vpvmbh";
import { applyIshimAnvrShtgrAzra } from "./seed-ishim-anvr-shtgr-azra";
import { applyIshimAzraHs } from "./seed-ishim-azra-hs";
import { applyIshimChnhDrvryKshy } from "./seed-ishim-chnh-drvry-kshy";
import { applyIshimChnnGoldblatt } from "./seed-ishim-chnn-goldblatt";
import { applyIshimGadiPor } from "./seed-ishim-gadi-por";
import { applyIshimGuyFriedman } from "./seed-ishim-guy-friedman";
import { applyIshimBeautyBeast1992 } from "./seed-ishim-hyph-vhchyh-1992";
import { applyIshimJungleCity2006 } from "./seed-ishim-gvngl-syty";
import { applyIshimHyhHyhDvagymLkdvrHartz } from "./seed-ishim-hyh-hyh-dvagym-lkdvr-hartz";
import { applyIshimHyhHyhHadm } from "./seed-ishim-hyh-hyh-hadm";
import { applyIshimKopyko2009 } from "./seed-ishim-kopyko-2009";
import { applyIshimNalvlym } from "./seed-ishim-nalvlym";
import { applyIshimPeterPan } from "./seed-ishim-peter-pan";
import { applyIshimPinocchioAdventures1993 } from "./seed-ishim-pinocchio-adventures";
import { applyIshimSavriMaranan } from "./seed-ishim-savri-maranan";
import { applyIshimMomiLevy } from "./seed-ishim-momi-levy";
import { applyIshimNicoBar } from "./seed-ishim-nico-bar";
import { applyIshimTuviaTsafir } from "./seed-ishim-tuvia-tsafir";
import { applyIshimYaakovShemTov } from "./seed-ishim-yaakov-shem-tov";
import { applyIshimNchshvn } from "./seed-ishim-nchshvn";
import { applyIshimAvplBvpl } from "./seed-ishim-avpl-bvpl";
import { applyIshimBsktyrs } from "./seed-ishim-bsktyrs";
import { applyIshimBazShnvtAvr } from "./seed-ishim-baz-shnvt-avr";
import { applyIshimHercules1997 } from "./seed-ishim-hrqvls-1997";

/** ערכי אישים/הפקות שלא בארכיון הגדול — מיושמים אחרי applyIshimArchive */
export function applyIshimPersonPatches(data: ArchiveData): ArchiveData {
  return applyIshimHercules1997(
    applyIshimBazShnvtAvr(
    applyIshimBsktyrs(
      applyIshimAvplBvpl(
        applyIshimNchshvn(
          applyIshimJungleCity2006(
            applyIshimBeautyBeast1992(
              applyIshimGuyFriedman(
                applyIshimKesemHaMagi(
                  applyIshimHaPigamot(
                    applyIshimHopTamirOct(
                      applyIshimKassaiLeuk(
                        applyIshimHopLionAndBears(
                          applyIshimLionKing3(
                            applyIshimTimonPumbaa(
                              applyIshimMagicSchoolBus(
                                applyIshimNicoBar(
                                  applyIshimMomiLevy(
                                    applyIshimSavriMaranan(
                                      applyIshimPinocchioAdventures1993(
                                        applyIshimYaakovShemTov(
                                          applyIshimKopyko2009(
                                            applyIshimHyhHyhDvagymLkdvrHartz(
                                              applyIshimPeterPan(
                                                applyIshimAnvrShtgrAzra(
                                                  applyIshimChnhDrvryKshy(
                                                    applyIshimNalvlym(
                                                      applyIshimHyhHyhHadm(
                                                        applyIshimChnnGoldblatt(
                                                          applyIshimTuviaTsafir(
                                                            applyIshimGadiPor(
                                                              applyIshimAzraHs(data)
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
