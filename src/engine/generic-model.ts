import { NATIONAL_BASES, type EventBases } from "./calibrated";
import { extractScoreFeatures, factorBreakdown, rainLevel, scoreToPercent, SCORE_SCALE } from "./unified";
import { ancientWeather, TRAINED_WEIGHTS, WEATHER_CLASSES, type WeatherForecast } from "./weather-model";
import { describeWeather } from "./weather-detail";
import type { QimenChart } from "./types";

/** English / non-China path: one pooled climate-band vector, no county, no province. */
export const GENERIC_BASES: EventBases = {
  god: NATIONAL_BASES.god,
  gate: NATIONAL_BASES.gate,
  star: NATIONAL_BASES.star,
  how: "generic pooled (no geography)",
  place: "worldwide",
};

function pooledRain() {
  const regs = TRAINED_WEIGHTS.regions;
  const f = regs[0]!.scoreModel.w.length;
  const w = Array.from({ length: f }, () => 0);
  let b = 0;
  const dw = [Array.from({ length: f }, () => 0), Array.from({ length: f }, () => 0), Array.from({ length: f }, () => 0)];
  const db = [0, 0, 0];
  for (const r of regs) {
    b += r.scoreModel.b;
    for (let j = 0; j < f; j++) w[j] += r.scoreModel.w[j]!;
    for (let c = 0; c < 3; c++) {
      db[c] += r.daily3.b[c]!;
      for (let j = 0; j < f; j++) dw[c]![j] += r.daily3.w[c]![j]!;
    }
  }
  const n = regs.length;
  return {
    w: w.map((x) => x / n),
    b: b / n,
    dailyW: dw.map((row) => row.map((x) => x / n)),
    dailyB: db.map((x) => x / n),
  };
}

const POOLED = pooledRain();

function softmax(z: number[]) {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export function forecastGenericWeather(
  chart: QimenChart,
  month: number,
  doy: number,
  locale: "zh" | "en" = "en",
): WeatherForecast {
  const x = extractScoreFeatures(chart, doy);
  const logit = POOLED.b + POOLED.w.reduce((s, wj, j) => s + wj * (x[j] ?? 0), 0);
  const score = Math.round(logit * SCORE_SCALE);
  const rainProb = scoreToPercent(score);
  const ancient = ancientWeather(chart);
  let cls: "晴" | "阴" | "雨" = "阴";
  if (score >= 6) cls = "雨";
  else if (score <= -6) cls = "晴";
  const p3raw = POOLED.dailyW.map((row, c) => row.reduce((s, wj, j) => s + wj * (x[j] ?? 0), 0) + POOLED.dailyB[c]!);
  const p3 = softmax(p3raw);
  const level = rainLevel(score);
  const place = locale === "en" ? "worldwide (generic pooled)" : "通用（十二气候带平均）";
  const detail = describeWeather(chart, {
    cls,
    score,
    rainProb,
    level,
    place,
    month,
    locale,
  });
  const reading = `${detail.headline}. ${detail.advice}`;
  const clsLabel = locale === "en" ? { 晴: "Clear", 阴: "Cloudy", 雨: "Rain" }[cls] : cls;
  return {
    cls,
    score,
    probability: rainProb,
    level,
    factors: factorBreakdown(x, POOLED.w, POOLED.b).slice(0, 8),
    probs: WEATHER_CLASSES.map((name, i) => ({ name, p: Math.round((p3[i] ?? 0) * 100) })),
    rainProb,
    ancient,
    reading,
    sourceNote:
      locale === "en"
        ? `Generic pooled model · mean of 12 climate-band logits · no county geography · S=22×logit · class ${clsLabel}.`
        : `通用模型 · 十二气候带平均 · 不分县 · S=22×logit · 报「${cls}」。`,
    detail,
  };
}

export function isGenericLocale(locale: "zh" | "en") {
  return locale === "en";
}
