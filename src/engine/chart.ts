import {
  BRANCH_CHONG,
  GATE_ELEMENT,
  GODS_YANG,
  GODS_YIN,
  OPPOSITE,
  PALACE_META,
  QI_YI,
  RING,
  STEM_ELEMENT,
} from "./constants";
import { changshengOf, formatCivil, getFourPillars, getJu, getXun, hourToZhiIndex, type CivilTime } from "./calendar";
import type { ChartMeta, JuInfo, Palace, PalaceId, QimenChart } from "./types";

function rotatePalace(from: PalaceId, steps: number, yang: boolean): PalaceId {
  if (from === 5) return 5;
  const i = RING.indexOf(from);
  const dir = yang ? 1 : -1;
  return RING[(i + dir * steps + 16) % 8]!;
}

function stepsBetween(from: PalaceId, to: PalaceId, yang: boolean): number {
  const a = from === 5 ? from : from;
  const b = to === 5 ? to : to;
  if (a === 5 || b === 5) return 0;
  const fi = RING.indexOf(a);
  const ti = RING.indexOf(b);
  if (yang) return (ti - fi + 8) % 8;
  return (fi - ti + 8) % 8;
}

function lodge(palace: PalaceId, yang: boolean): PalaceId {
  if (palace !== 5) return palace;
  return yang ? 2 : 8;
}

function findStemPalace(earth: Record<PalaceId, string>, stem: string, yang: boolean): PalaceId {
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9] as PalaceId[]) {
    if (earth[id] === stem) return lodge(id, yang);
  }
  return yang ? 2 : 8;
}

function maBranchOf(branch: string): string {
  const groups: Record<string, string> = {
    申: "寅",
    子: "寅",
    辰: "寅",
    寅: "申",
    午: "申",
    戌: "申",
    亥: "巳",
    卯: "巳",
    未: "巳",
    巳: "亥",
    酉: "亥",
    丑: "亥",
  };
  return groups[branch] ?? "寅";
}

function palaceOfBranch(branch: string): PalaceId | null {
  const map: Record<string, PalaceId> = {
    子: 1,
    未: 2,
    申: 2,
    卯: 3,
    辰: 4,
    巳: 4,
    戌: 6,
    亥: 6,
    酉: 7,
    丑: 8,
    寅: 8,
    午: 9,
  };
  return map[branch] ?? null;
}

export function palaceOfEarthBranch(branch: string): PalaceId {
  return palaceOfBranch(branch) ?? 5;
}

function isXing(a: string, b: string): boolean {
  if (a === b) return ["辰", "午", "酉", "亥"].includes(a);
  const groups = [
    ["寅", "巳", "申"],
    ["丑", "戌", "未"],
    ["子", "卯"],
  ];
  return groups.some((g) => g.includes(a) && g.includes(b));
}

function wuxingKe(a: string, b: string): boolean {
  const order = ["木", "火", "土", "金", "水"];
  const i = order.indexOf(a);
  const j = order.indexOf(b);
  if (i < 0 || j < 0) return false;
  return (i + 2) % 5 === j;
}

export function buildChart(civil: CivilTime, juOverride?: JuInfo): QimenChart {
  const pillars = getFourPillars(civil);
  const ju = juOverride ?? getJu(civil);
  const { xunShou, xunYi, xunKong } = getXun(civil);
  const yang = ju.dun === "yang";
  const hourStem = pillars.hour.stem;
  const hourBranch = pillars.hour.branch;

  const earth = {} as Record<PalaceId, string>;
  let p = ju.ju as PalaceId;
  for (let i = 0; i < 9; i++) {
    earth[p] = QI_YI[i]!;
    p = (yang ? (p === 9 ? 1 : p + 1) : p === 1 ? 9 : p - 1) as PalaceId;
  }

  const zhiFuOrigin = findStemPalace(earth, xunYi, yang);
  let zhiFuPalace: PalaceId;
  if (hourStem === "甲") {
    zhiFuPalace = zhiFuOrigin;
  } else {
    zhiFuPalace = findStemPalace(earth, hourStem, yang);
  }

  const originRing = lodge(zhiFuOrigin, yang);
  const destRing = lodge(zhiFuPalace, yang);
  const steps = stepsBetween(originRing, destRing, yang);

  const heaven = {} as Record<PalaceId, string>;
  heaven[5] = earth[5];
  for (const pal of RING) {
    const dest = rotatePalace(pal, steps, yang);
    heaven[dest] = earth[pal]!;
  }

  const stars = {} as Record<PalaceId, string>;
  stars[5] = "天禽";
  for (const pal of RING) {
    const dest = rotatePalace(pal, steps, yang);
    stars[dest] = PALACE_META[pal].homeStar;
  }
  if (zhiFuOrigin === 5) {
    stars[destRing] = "天禽";
  }

  const gates = {} as Record<PalaceId, string | null>;
  gates[5] = null;
  for (const pal of RING) {
    const dest = rotatePalace(pal, steps, yang);
    gates[dest] = PALACE_META[pal].homeGate;
  }

  const gods = {} as Record<PalaceId, string | null>;
  gods[5] = null;
  const godSeq = yang ? GODS_YANG : GODS_YIN;
  const start = RING.indexOf(destRing);
  for (let i = 0; i < 8; i++) {
    const pal = RING[(start + i + 8) % 8]!;
    gods[pal] = godSeq[i]!;
  }

  const zhiFuStar = PALACE_META[zhiFuOrigin].homeStar;
  const zhiShiGate = PALACE_META[lodge(zhiFuOrigin, yang)].homeGate ?? "休门";

  const ma = maBranchOf(hourBranch);
  const maPalace = palaceOfBranch(ma);
  const fuYin = originRing === destRing;
  const fanYin = destRing === OPPOSITE[originRing];

  const palaces = {} as Record<PalaceId, Palace>;
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9] as PalaceId[]) {
    const meta = PALACE_META[id];
    const hStem = heaven[id]!;
    const eStem = earth[id]!;
    const gate = gates[id] ?? null;
    const cs = meta.branch ? changshengOf(hStem, meta.branch) : null;
    const kong = meta.branches.some((b) => xunKong.includes(b));
    const menEl = gate ? GATE_ELEMENT[gate] : "";
    const palEl = meta.element;
    palaces[id] = {
      id,
      bagua: meta.bagua,
      direction: meta.direction,
      element: palEl,
      branch: meta.branch,
      branches: meta.branches,
      earthStem: eStem,
      heavenStem: hStem,
      star: stars[id]!,
      gate,
      god: gods[id] ?? null,
      changsheng: cs,
      isKong: kong,
      isZhiFu: id === destRing || (id === 5 && zhiFuOrigin === 5),
      isZhiShi: gate === zhiShiGate && id !== 5,
      isMa: maPalace === id,
      fuYin: hStem === eStem,
      fanYin: Boolean(
        hStem && BRANCH_CHONG[meta.branch] && STEM_ELEMENT[hStem] && fanYin && id === destRing,
      ),
      menPo: Boolean(gate && wuxingKe(menEl, palEl)),
      gongPo: Boolean(gate && wuxingKe(palEl, menEl)),
      ruMu: cs === "墓" || cs === "死" || cs === "绝",
      jiXing: Boolean(gate && meta.branch && isXing(meta.branch, hourBranch)),
    };
  }

  // palace-level 反吟: 天盘干落到对宫
  for (const id of RING) {
    palaces[id].fanYin =
      palaces[id].heavenStem !== palaces[id].earthStem &&
      fuYin === false &&
      OPPOSITE[id] !== 5 &&
      palaces[id].heavenStem === earth[OPPOSITE[id]];
  }

  const meta: ChartMeta = {
    zhiFuOrigin,
    zhiFuPalace: destRing,
    zhiFuStar,
    zhiShiGate,
    xunShou,
    xunYi,
    xunKong,
    maBranch: ma,
    maPalace,
    fuYin,
    fanYin,
  };

  const zhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"][hourToZhiIndex(civil.hour)];

  return {
    beijing: civil,
    timeLabel: formatCivil(civil),
    hourName: `${zhi}时`,
    pillars,
    ju,
    palaces,
    meta,
  };
}

export function findPalaceBy(
  chart: QimenChart,
  kind: "gate" | "star" | "god",
  name: string,
): PalaceId {
  for (const id of RING) {
    const p = chart.palaces[id];
    if (kind === "gate" && p.gate === name) return id;
    if (kind === "star" && p.star === name) return id;
    if (kind === "god" && p.god === name) return id;
  }
  return chart.meta.zhiFuPalace;
}

export function findStemOnHeaven(chart: QimenChart, stem: string): PalaceId {
  if (stem === "甲") return chart.meta.zhiFuPalace;
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9] as PalaceId[]) {
    if (chart.palaces[id].heavenStem === stem) return lodge(id, chart.ju.dun === "yang");
  }
  return chart.meta.zhiFuPalace;
}
