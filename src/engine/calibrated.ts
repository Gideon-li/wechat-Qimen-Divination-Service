import {
  GATE_BASE as CLASSIC_GATE_BASE,
  GOD_BASE as CLASSIC_GOD_BASE,
  STAR_BASE as CLASSIC_STAR_BASE,
} from "./constants";
import { SCORE_FEATURE_NAMES } from "./unified";
import calJson from "./event-calibration.json";

type Cal = {
  globalScale: number;
  meanXunAcc: number;
  method: string;
  pooledLogit: { name: string; logit: number; score: number }[];
  god: Record<string, number>;
  gate: Record<string, number>;
  star: Record<string, number>;
};

const cal = calJson as Cal;

/** 全国区县天气逻辑回归校准后的事项权重（符号仍依人事吉凶）。 */
export const GATE_BASE = cal.gate;
export const GOD_BASE = cal.god;
export const STAR_BASE = cal.star;

export const EVENT_CALIBRATION = {
  ...cal,
  classicGate: CLASSIC_GATE_BASE,
  classicGod: CLASSIC_GOD_BASE,
  classicStar: CLASSIC_STAR_BASE,
};

export type EventBases = {
  god: Record<string, number>;
  gate: Record<string, number>;
  star: Record<string, number>;
  how: string;
  place: string;
};

export const NATIONAL_BASES: EventBases = {
  god: GOD_BASE,
  gate: GATE_BASE,
  star: STAR_BASE,
  how: "全国平均",
  place: "全国",
};

export function pickBases(opts?: { bases?: EventBases } | null): EventBases {
  return opts?.bases ?? NATIONAL_BASES;
}

/**
 * 用该区县天气逻辑回归的 |β| 当信度，去乘刘伯温经典吉凶符号。
 * 与天气同一套 w，不把「有雨」的正负号抄到求财/事业。
 */
export function basesFromDistrictWeights(w: number[], meta: { how: string; place: string }): EventBases {
  const abs = w.map((v) => Math.abs(v ?? 0));
  const sorted = [...abs].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)] || 0.01;
  const scale = cal.globalScale || 1;
  const mix = (classic: Record<string, number>, prefix: string) => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(classic)) {
      const j = (SCORE_FEATURE_NAMES as readonly string[]).indexOf(`${prefix}_${k}`);
      const beta = j >= 0 ? (w[j] ?? 0) : 0;
      const rel = Math.max(0.55, Math.min(1.35, 0.75 + 0.5 * (Math.abs(beta) / (med * 3 + 1e-6))));
      out[k] = Math.round(v * rel * scale);
    }
    return out;
  };
  return {
    god: mix(CLASSIC_GOD_BASE, "神"),
    gate: mix(CLASSIC_GATE_BASE, "门"),
    star: mix(CLASSIC_STAR_BASE, "星"),
    how: meta.how,
    place: meta.place,
  };
}
