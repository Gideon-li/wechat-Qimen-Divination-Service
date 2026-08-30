import { BRANCH_CHONG, BRANCH_SIX_HE, OPPOSITE, PALACE_META } from "./constants";
import { getFourPillars, solarTermCivil } from "./calendar";
import { findStemOnHeaven, palaceOfEarthBranch } from "./chart";
import type { PalaceId, Pillar, QimenChart, ScoreFactor } from "./types";

/** 只知出生年时，以该年立春后的年柱为生肖年命。 */
export function natalPillar(birthYear: number): Pillar {
  return getFourPillars(solarTermCivil(birthYear, "立春")).year;
}

export type NatalView = {
  year: number;
  pillar: Pillar;
  benming: boolean;
  chongTaiSui: boolean;
  heTaiSui: boolean;
  stemPalace: PalaceId;
  branchPalace: PalaceId;
  summary: string;
  tags: string[];
  marks: Partial<Record<PalaceId, string>>;
};

function baguaOf(id: PalaceId) {
  return PALACE_META[id].bagua;
}

export function natalView(chart: QimenChart, birthYear: number): NatalView {
  const pillar = natalPillar(birthYear);
  const yearBr = chart.pillars.year.branch;
  const benming = pillar.branch === yearBr;
  const chongTaiSui = BRANCH_CHONG[pillar.branch] === yearBr;
  const heTaiSui = BRANCH_SIX_HE[pillar.branch] === yearBr;
  const stemPalace = findStemOnHeaven(chart, pillar.stem);
  const branchPalace = palaceOfEarthBranch(pillar.branch);
  const tags: string[] = [];
  if (benming) tags.push("本命年");
  if (chongTaiSui) tags.push("冲太岁");
  if (heTaiSui) tags.push("生肖合岁");
  tags.push(`命干${pillar.stem}·${baguaOf(stemPalace)}宫`);
  tags.push(`命支${pillar.branch}·${baguaOf(branchPalace)}宫`);
  let summary: string;
  if (benming) {
    summary = `${birthYear} ${pillar.name}，生肖${pillar.branch}值年（本命年），太岁压身，宜守成、少开新。命干落${baguaOf(stemPalace)}宫，命支落${baguaOf(branchPalace)}宫。`;
  } else if (chongTaiSui) {
    summary = `${birthYear} ${pillar.name}，生肖${pillar.branch}冲太岁${yearBr}，一年多迁移、争执。命干落${baguaOf(stemPalace)}宫。`;
  } else if (heTaiSui) {
    summary = `${birthYear} ${pillar.name}，生肖${pillar.branch}合太岁${yearBr}，人事可借岁气。命干落${baguaOf(stemPalace)}宫。`;
  } else {
    summary = `${birthYear} ${pillar.name}，命干${pillar.stem}在${baguaOf(stemPalace)}宫、命支${pillar.branch}在${baguaOf(branchPalace)}宫。十二类用神已另计本命生克，不改原用神取宫。`;
  }
  const marks: Partial<Record<PalaceId, string>> = {};
  marks[stemPalace] = "命干";
  marks[branchPalace] = stemPalace === branchPalace ? "命干/命支" : "命支";
  return {
    year: birthYear,
    pillar,
    benming,
    chongTaiSui,
    heTaiSui,
    stemPalace,
    branchPalace,
    summary,
    tags,
    marks,
  };
}

/** 本命对某一用神宫的加性分。符号仍依人事吉凶，不把岁运直接抄成事项吉凶。 */
export function natalFactors(chart: QimenChart, yongShen: PalaceId, birthYear: number): ScoreFactor[] {
  const n = natalView(chart, birthYear);
  const extra: ScoreFactor[] = [];
  if (n.benming) {
    extra.push({
      key: "benming",
      label: "生肖本命年",
      detail: `属${n.pillar.branch}值年，太岁压身，宜检点、守成`,
      weight: -8,
      phase: "aux",
    });
  } else if (n.chongTaiSui) {
    extra.push({
      key: "chongtai",
      label: "生肖冲太岁",
      detail: `${n.pillar.branch}冲${chart.pillars.year.branch}，变动、远行、争执较多`,
      weight: -10,
      phase: "aux",
    });
  } else if (n.heTaiSui) {
    extra.push({
      key: "hetai",
      label: "生肖合太岁",
      detail: `${n.pillar.branch}合${chart.pillars.year.branch}，人事可借岁气`,
      weight: 6,
      phase: "aux",
    });
  }
  if (n.stemPalace === yongShen) {
    extra.push({
      key: "minggan",
      label: "命干临用神",
      detail: `命干${n.pillar.stem}落用神宫，事体与本人紧贴、可担`,
      weight: 8,
      phase: "aux",
    });
  }
  if (n.branchPalace === yongShen) {
    extra.push({
      key: "mingzhi",
      label: "命支临用神",
      detail: `生肖${n.pillar.branch}落用神宫，得地`,
      weight: 6,
      phase: "aux",
    });
  }
  if (n.stemPalace !== yongShen && OPPOSITE[n.stemPalace] === yongShen && n.stemPalace !== 5) {
    extra.push({
      key: "mingchong",
      label: "命干宫冲用神",
      detail: "命宫与用神对冲，本人与事体拉锯",
      weight: -6,
      phase: "aux",
    });
  }
  return extra;
}

export function mergeMarks(
  a: Partial<Record<PalaceId, string>> = {},
  b: Partial<Record<PalaceId, string>> = {},
): Partial<Record<PalaceId, string>> {
  const out: Partial<Record<PalaceId, string>> = { ...a };
  for (const key of Object.keys(b) as unknown as PalaceId[]) {
    const id = Number(key) as PalaceId;
    const v = b[id];
    if (!v) continue;
    out[id] = out[id] && out[id] !== v ? `${out[id]}/${v}` : v;
  }
  return out;
}
