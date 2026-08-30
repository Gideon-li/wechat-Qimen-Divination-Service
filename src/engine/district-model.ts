import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractScoreFeatures, factorBreakdown, rainLevel, scoreToPercent, SCORE_SCALE } from "./unified";
import { ancientWeather, WEATHER_CLASSES, type WeatherForecast } from "./weather-model";
import type { QimenChart } from "./types";
import { regionForProvince, regionMeta } from "./regions";

export type DistrictCell = {
  lat: number;
  lng: number;
  nDistricts: number;
  code?: string;
  kind?: string;
  rainDays: number;
  rainRate: number;
  metrics: {
    rainAccTrain: number;
    rainAccTest: number;
    dailyAccTrain: number;
    dailyAccTest: number;
    xunAccTrain: number;
    xunAccTest: number;
    interceptScore: number;
  };
  scoreModel: { w: number[]; b: number; scale: number };
  daily3: { w: number[][]; b: number[]; classes: string[] };
};

export type DistrictPack = {
  method: string;
  ml: Record<string, string | number>;
  source: string;
  start: string;
  end: string;
  trainUntil: string;
  testFrom: string;
  nDays: number;
  nDistricts: number;
  nCities: number;
  nProvinces: number;
  nCells: number;
  nTotalSamples: number;
  nTrainDays?: number;
  nTestDays?: number;
  featureNames: string[];
  meanXunAcc: number;
  meanRainAccTest?: number;
  globalScale: number;
  cells: DistrictCell[];
  lookup: Record<string, number>;
  provinceMetrics?: { province: string; n: number; rainAccTest: number; xunAccTest: number; rainRate: number }[];
  districts: {
    code: string;
    name: string;
    province: string;
    city: string;
    lat: number;
    lng: number;
    cell: number | null;
  }[];
};

let cached: DistrictPack | null = null;
let loading: Promise<DistrictPack> | null = null;

function candidateWeightFiles(): string[] {
  const here = dirname(fileURLToPath(import.meta.url));
  const env = process.env.QIMEN_DISTRICT_WEIGHTS;
  return [
    env,
    join(process.cwd(), "models/qimen-district-weights-2020-2026.json"),
    join(here, "../../models/qimen-district-weights-2020-2026.json"),
    join(here, "../models/qimen-district-weights-2020-2026.json"),
    join(here, "district-weights.json"),
  ].filter((p): p is string => Boolean(p));
}

export function loadDistrictWeights(): Promise<DistrictPack> {
  if (cached) return Promise.resolve(cached);
  if (!loading) {
    loading = (async () => {
      const errors: string[] = [];
      for (const p of candidateWeightFiles()) {
        try {
          const raw = await readFile(p, "utf8");
          cached = JSON.parse(raw) as DistrictPack;
          return cached;
        } catch (e) {
          errors.push(`${p}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      throw new Error("区县权重未载入。" + errors.slice(0, 3).join("；"));
    })();
  }
  return loading;
}

function softmax(z: number[]): number[] {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

function pct(x: number) {
  return `${(x * 100).toFixed(1)}%`;
}

export function resolveCell(
  pack: DistrictPack,
  provinceCode: string,
  cityCode?: string,
  districtCode?: string,
): { cell: DistrictCell; index: number; how: string } | null {
  const L = pack.lookup;
  const tryCodes: [string, string][] = [];
  if (districtCode) tryCodes.push([districtCode, "区县"]);
  if (cityCode) tryCodes.push([cityCode, "城市"]);
  if (provinceCode) tryCodes.push([provinceCode, "省份"]);
  for (const [code, how] of tryCodes) {
    const idx = L[code];
    if (idx == null) continue;
    const cell = pack.cells[idx];
    if (cell) return { cell, index: idx, how };
  }
  return null;
}

export function forecastDistrictWeather(
  chart: QimenChart,
  doy: number,
  loc: {
    province: string;
    city: string;
    district: string;
    provinceCode: string;
    cityCode: string;
    districtCode: string;
  },
  pack: DistrictPack,
): WeatherForecast {
  const hit = resolveCell(pack, loc.provinceCode, loc.cityCode, loc.districtCode);
  const climate = regionMeta(regionForProvince(loc.provinceCode));
  if (!hit) {
    const x = extractScoreFeatures(chart, doy);
    return {
      cls: "阴",
      score: 0,
      probability: 50,
      level: "中平",
      factors: [],
      probs: WEATHER_CLASSES.map((name) => ({ name, p: 33 })),
      rainProb: 50,
      ancient: ancientWeather(chart),
      reading: `${loc.province}${loc.city}${loc.district} 暂无区县权重，回退气候带「${climate.place}」。`,
      sourceNote: `未匹配区县模型 · 气候带 ${climate.place}`,
    };
  }
  const cell = hit.cell;
  const x = extractScoreFeatures(chart, doy);
  const logit = cell.scoreModel.b + cell.scoreModel.w.reduce((s, wj, j) => s + wj * (x[j] ?? 0), 0);
  const score = Math.round(logit * SCORE_SCALE);
  const rainProb = scoreToPercent(score);
  const ancient = ancientWeather(chart);
  let cls: (typeof WEATHER_CLASSES)[number] = "阴";
  if (score >= 6) cls = "雨";
  else if (score <= -6) cls = "晴";
  const p3raw = cell.daily3.w.map((row, c) => row.reduce((s, wj, j) => s + wj * (x[j] ?? 0), 0) + cell.daily3.b[c]!);
  const p3 = softmax(p3raw);
  const level = rainLevel(score);
  const place = `${loc.province}${loc.city}${loc.district}`;
  const grid = `${cell.lat.toFixed(4)}°N ${cell.lng.toFixed(4)}°E`;
  const reading =
    cls === "雨"
      ? `坎宫用神分值 ${score > 0 ? "+" : ""}${score}（${level}），${place}估有雨 ${rainProb}%。`
      : cls === "晴"
        ? `坎宫用神分值 ${score}（${level}），${place}估有雨 ${rainProb}%。`
        : `分值 ${score} 近中平（${level}），${place}有雨 ${rainProb}%，宜持中。`;
  return {
    cls,
    score,
    probability: rainProb,
    level,
    factors: factorBreakdown(x, cell.scoreModel.w, cell.scoreModel.b).slice(0, 8),
    probs: WEATHER_CLASSES.map((name, i) => ({ name, p: Math.round((p3[i] ?? 0) * 100) })),
    rainProb,
    ancient,
    reading,
    sourceNote: `${place} · ${hit.how}独立模型 · 中心 ${grid} · ${pack.start}–${pack.end} · 训练至 ${pack.trainUntil} · 有雨检验 ${pct(cell.metrics.rainAccTest)} · 旬检验 ${pct(cell.metrics.xunAccTest)}。S=22×logit。NOAA CPC 0.5° 双线性插值到本区中心后单独拟合，不与邻区共享 w、b。`,
  };
}

export function provinceMetrics(pack: DistrictPack) {
  if (pack.provinceMetrics?.length) return pack.provinceMetrics;
  const acc = new Map<string, { n: number; rain: number; xun: number }>();
  for (const d of pack.districts) {
    if (d.cell == null) continue;
    const cell = pack.cells[d.cell];
    if (!cell) continue;
    const cur = acc.get(d.province) ?? { n: 0, rain: 0, xun: 0 };
    cur.n += 1;
    cur.rain += cell.metrics.rainAccTest;
    cur.xun += cell.metrics.xunAccTest;
    acc.set(d.province, cur);
  }
  return [...acc.entries()]
    .map(([province, v]) => ({
      province,
      n: v.n,
      rainAccTest: v.rain / v.n,
      xunAccTest: v.xun / v.n,
      rainRate: 0,
    }))
    .sort((a, b) => a.province.localeCompare(b.province, "zh"));
}
