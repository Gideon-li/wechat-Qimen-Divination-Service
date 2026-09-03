import { GATES, GODS_YANG, SCORE_SCALE, STARS } from "./constants";
import { PILLAR_FEATURE_NAMES, extractPillarFeatures } from "./pillar-earth";
import type { QimenChart } from "./types";

export { SCORE_SCALE };

/** 天气用神取坎宫（水、北）。事项用神仍按事件取宫。同一套神/星/门加性分值。 */
export const SCORE_FEATURE_NAMES = [
  ...GODS_YANG.map((g) => `神_${g}`),
  ...GATES.map((g) => `门_${g}`),
  ...STARS.map((s) => `星_${s}`),
  "阴遁",
  "伏吟",
  "反吟",
  "坎空",
  "年积日sin",
  "年积日cos",
  ...PILLAR_FEATURE_NAMES,
] as const;

export type ScoreVec = number[];

export function extractScoreFeatures(chart: QimenChart, doy: number): ScoreVec {
  const kan = chart.palaces[1];
  const x = Array.from({ length: SCORE_FEATURE_NAMES.length }, () => 0);
  const godI = kan.god ? (GODS_YANG as readonly string[]).indexOf(kan.god) : -1;
  if (godI >= 0) x[godI] = 1;
  const gateI = kan.gate ? (GATES as readonly string[]).indexOf(kan.gate) : -1;
  if (gateI >= 0) x[GODS_YANG.length + gateI] = 1;
  const starI = (STARS as readonly string[]).indexOf(kan.star);
  if (starI >= 0) x[GODS_YANG.length + GATES.length + starI] = 1;
  const b = GODS_YANG.length + GATES.length + STARS.length;
  x[b] = chart.ju.dun === "yin" ? 1 : 0;
  x[b + 1] = chart.meta.fuYin ? 1 : 0;
  x[b + 2] = chart.meta.fanYin ? 1 : 0;
  x[b + 3] = kan.isKong ? 1 : 0;
  x[b + 4] = Math.sin((2 * Math.PI * doy) / 365.25);
  x[b + 5] = Math.cos((2 * Math.PI * doy) / 365.25);
  const pillar = extractPillarFeatures(chart, kan);
  for (let i = 0; i < pillar.length; i++) x[b + 6 + i] = pillar[i]!;
  return x;
}

/** 区县旧模型只有前 31 维时，把气候带训出的四柱层加到 logit。 */
export function logitWithOptionalTail(
  w: number[],
  b: number,
  x: number[],
  tail?: { offset: number; w: number[] } | null,
): number {
  let z = b;
  for (let j = 0; j < w.length; j++) z += w[j]! * (x[j] ?? 0);
  if (tail && w.length <= tail.offset) {
    for (let j = 0; j < tail.w.length; j++) z += tail.w[j]! * (x[tail.offset + j] ?? 0);
  }
  return z;
}

export function sigmoid(z: number): number {
  if (z > 20) return 1;
  if (z < -20) return 0;
  return 1 / (1 + Math.exp(-z));
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** 与事项预测同一变换：分值 S → 百分比。 */
export function scoreToPercent(score: number): number {
  return Math.round(clamp(sigmoid(score / SCORE_SCALE), 0.04, 0.96) * 100);
}

export function logitToScore(logit: number): number {
  return logit * SCORE_SCALE;
}

export function rainLevel(score: number): string {
  if (score >= 42) return "大雨势";
  if (score >= 20) return "雨势";
  if (score >= 6) return "小雨势";
  if (score > -6) return "中平";
  if (score > -20) return "偏晴";
  if (score > -42) return "晴势";
  return "大晴势";
}

export function factorBreakdown(
  x: number[],
  w: number[],
  b: number,
): { key: string; label: string; weight: number }[] {
  const out: { key: string; label: string; weight: number }[] = [
    { key: "intercept", label: "截距", weight: Math.round(b * SCORE_SCALE * 10) / 10 },
  ];
  for (let j = 0; j < x.length; j++) {
    const contrib = w[j]! * x[j]! * SCORE_SCALE;
    if (Math.abs(contrib) < 0.05) continue;
    out.push({
      key: SCORE_FEATURE_NAMES[j]!,
      label: SCORE_FEATURE_NAMES[j]!,
      weight: Math.round(contrib * 10) / 10,
    });
  }
  return out.sort((a, c) => Math.abs(c.weight) - Math.abs(a.weight));
}
