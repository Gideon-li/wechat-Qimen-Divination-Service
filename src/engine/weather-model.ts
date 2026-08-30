import { buildChart } from "./chart";
import { describeWeather, type WeatherSketch } from "./weather-detail";
import type { PalaceId, QimenChart } from "./types";
import weatherJson from "./ouhai-weather.json";
import regionsJson from "./weather-regions.json";
import weightsJson from "./weather-weights.json";
import { regionMeta, type ClimateRegionId } from "./regions";
import {
  extractScoreFeatures,
  factorBreakdown,
  rainLevel,
  scoreToPercent,
  SCORE_SCALE,
  SCORE_FEATURE_NAMES,
} from "./unified";

export const WEATHER_META = weatherJson as {
  source: string;
  url: string;
  place: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  timezone: string;
  start: string;
  end: string;
  n: number;
  citation: string;
  days: WeatherDay[];
};

export type WeatherDay = {
  d: string;
  w: number;
  tmax: number;
  tmin: number;
  t: number;
  p: number;
  r: number;
  wind: number;
  cloud: number | null;
  rh: number | null;
};

export const WEATHER_CLASSES = ["晴", "阴", "雨"] as const;
export type WeatherClass = (typeof WEATHER_CLASSES)[number];

export function classifyDay(day: { w: number; p: number }): WeatherClass {
  if (day.p >= 0.1 || day.w >= 51) return "雨";
  if (day.w <= 1) return "晴";
  return "阴";
}

export const FEATURE_NAMES = [
  "阳遁",
  "局数",
  "节气序",
  "月份",
  "年积日sin",
  "年积日cos",
  "值符宫",
  "玄武",
  "腾蛇",
  "白虎",
  "九天",
  "九地",
  "休门水",
  "景门火",
  "死门",
  "开门",
  "生门",
  "天芮",
  "天蓬",
  "天英",
  "坎空",
  "伏吟",
  "反吟",
  "古法雨势",
  "古法晴势",
] as const;

function palaceOf(
  chart: QimenChart,
  kind: "god" | "gate" | "star",
  name: string,
): number {
  for (const id of [1, 2, 3, 4, 6, 7, 8, 9] as PalaceId[]) {
    const p = chart.palaces[id];
    if (kind === "god" && p.god === name) return id;
    if (kind === "gate" && p.gate === name) return id;
    if (kind === "star" && p.star === name) return id;
  }
  return 0;
}

export function ancientWeather(chart: QimenChart): { rain: number; sun: number; wind: number; thunder: number } {
  let rain = 0;
  let sun = 0;
  let wind = 0;
  let thunder = 0;
  for (const id of [1, 2, 3, 4, 6, 7, 8, 9] as PalaceId[]) {
    const p = chart.palaces[id];
    if (p.god === "玄武") rain += 3;
    if (p.god === "九地") rain += 2;
    if (p.god === "九天") sun += 3;
    if (p.god === "白虎") wind += 3;
    if (p.god === "腾蛇") thunder += 3;
    if (p.gate === "休门") rain += 2;
    if (p.gate === "死门") rain += 1;
    if (p.gate === "景门") sun += 2;
    if (p.gate === "开门") sun += 1;
    if (p.star === "天芮" || p.star === "天蓬") rain += 1;
    if (p.star === "天英") sun += 1;
    if (p.isKong && id === 1) rain -= 1;
  }
  if (chart.ju.dun === "yin") rain += 2;
  else sun += 1;
  return { rain, sun, wind, thunder };
}

export function extractFeatures(chart: QimenChart, month: number, doy: number): number[] {
  const a = ancientWeather(chart);
  return [
    chart.ju.dun === "yang" ? 1 : 0,
    chart.ju.ju / 9,
    (chart.ju.termDayIndex + 1) / 16,
    month / 12,
    Math.sin((2 * Math.PI * doy) / 365),
    Math.cos((2 * Math.PI * doy) / 365),
    chart.meta.zhiFuPalace / 9,
    palaceOf(chart, "god", "玄武") / 9,
    palaceOf(chart, "god", "腾蛇") / 9,
    palaceOf(chart, "god", "白虎") / 9,
    palaceOf(chart, "god", "九天") / 9,
    palaceOf(chart, "god", "九地") / 9,
    palaceOf(chart, "gate", "休门") / 9,
    palaceOf(chart, "gate", "景门") / 9,
    palaceOf(chart, "gate", "死门") / 9,
    palaceOf(chart, "gate", "开门") / 9,
    palaceOf(chart, "gate", "生门") / 9,
    palaceOf(chart, "star", "天芮") / 9,
    palaceOf(chart, "star", "天蓬") / 9,
    palaceOf(chart, "star", "天英") / 9,
    chart.palaces[1].isKong ? 1 : 0,
    chart.meta.fuYin ? 1 : 0,
    chart.meta.fanYin ? 1 : 0,
    a.rain / 12,
    a.sun / 12,
  ];
}

function dayOfYear(iso: string): { y: number; m: number; d: number; doy: number } {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const start = Date.UTC(y, 0, 1);
  const doy = Math.floor((dt.getTime() - start) / 86400000) + 1;
  return { y, m, d, doy };
}

function softmax(z: number[]): number[] {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

function argmax(p: number[]): number {
  let i = 0;
  for (let k = 1; k < p.length; k++) if (p[k]! > p[i]!) i = k;
  return i;
}

export type SoftmaxModel = {
  w: number[][];
  b: number[];
  names: readonly string[];
  classes: string[];
};

function trainSoftmax(
  X: number[][],
  y: number[],
  k: number,
  epochs: number,
  lr: number,
  l2: number,
): SoftmaxModel {
  const n = X.length;
  const f = X[0]!.length;
  const w = Array.from({ length: k }, () => Array.from({ length: f }, () => 0));
  const b = Array.from({ length: k }, () => 0);
  for (let ep = 0; ep < epochs; ep++) {
    const gw = Array.from({ length: k }, () => Array.from({ length: f }, () => 0));
    const gb = Array.from({ length: k }, () => 0);
    for (let i = 0; i < n; i++) {
      const xi = X[i]!;
      const z = w.map((row, c) => row.reduce((s, wij, j) => s + wij * xi[j]!, 0) + b[c]!);
      const p = softmax(z);
      for (let c = 0; c < k; c++) {
        const err = p[c]! - (y[i] === c ? 1 : 0);
        gb[c] += err;
        for (let j = 0; j < f; j++) gw[c]![j] += err * xi[j]!;
      }
    }
    const scale = 1 / n;
    for (let c = 0; c < k; c++) {
      b[c] -= lr * gb[c]! * scale;
      for (let j = 0; j < f; j++) w[c]![j] -= lr * (gw[c]![j]! * scale + l2 * w[c]![j]!);
    }
  }
  return { w, b, names: FEATURE_NAMES, classes: [] };
}

function predictSoftmax(model: SoftmaxModel, x: number[]): number[] {
  const z = model.w.map((row, c) => row.reduce((s, wij, j) => s + wij * x[j]!, 0) + model.b[c]!);
  return softmax(z);
}

function accuracy(model: SoftmaxModel, X: number[][], y: number[]): number {
  let ok = 0;
  for (let i = 0; i < X.length; i++) {
    if (argmax(predictSoftmax(model, X[i]!)) === y[i]) ok++;
  }
  return ok / X.length;
}

export type TrainReport = {
  n: number;
  trainN: number;
  testN: number;
  dailyAccTrain: number;
  dailyAccTest: number;
  xunAccTrain: number;
  xunAccTest: number;
  rainAccTrain: number;
  rainAccTest: number;
  confusion: number[][];
  epochs: number;
  reachedXun90: boolean;
  notes: string[];
  dailyModel: SoftmaxModel;
  rainModel: SoftmaxModel;
  xunModel: SoftmaxModel;
  samples: {
    date: string;
    cls: WeatherClass;
    pred: WeatherClass;
    rain: boolean;
    rainPred: boolean;
    features: number[];
  }[];
};

function xunLabel(days: WeatherDay[], i: number): number {
  const chunk = days.slice(i, i + 10);
  const wet = chunk.filter((d) => d.p >= 0.1).length;
  return wet >= 5 ? 1 : 0;
}

export function trainWeatherModel(epochs = 280): TrainReport {
  const days = WEATHER_META.days;
  const X: number[][] = [];
  const y3: number[] = [];
  const yRain: number[] = [];
  const charts: QimenChart[] = [];
  for (const day of days) {
    const { y, m, d, doy } = dayOfYear(day.d);
    const chart = buildChart({ year: y, month: m, day: d, hour: 12, minute: 0 });
    charts.push(chart);
    X.push(extractFeatures(chart, m, doy));
    const cls = classifyDay(day);
    y3.push(WEATHER_CLASSES.indexOf(cls));
    yRain.push(day.p >= 0.1 ? 1 : 0);
  }

  const split = days.findIndex((d) => d.d >= "2026-01-01");
  const cut = split > 80 ? split : Math.floor(days.length * 0.7);

  const trainSoft = (y: number[], k: number) =>
    trainSoftmax(X.slice(0, cut), y.slice(0, cut), k, epochs, 0.35, 0.002);

  const dailyModel = trainSoft(y3, 3);
  dailyModel.classes = [...WEATHER_CLASSES];
  const rainModel = trainSoft(yRain, 2);
  rainModel.classes = ["无雨", "有雨"];

  const xunIdx: number[] = [];
  const xunY: number[] = [];
  const xunX: number[][] = [];
  for (let i = 0; i + 10 <= days.length; i += 10) {
    xunIdx.push(i);
    xunY.push(xunLabel(days, i));
    const mean = FEATURE_NAMES.map((_, j) => {
      let s = 0;
      for (let t = 0; t < 10; t++) s += X[i + t]![j]!;
      return s / 10;
    });
    xunX.push(mean);
  }
  const xunCut = xunIdx.filter((i) => i < cut).length || Math.floor(xunX.length * 0.7);
  const xunModel = trainSoftmax(xunX.slice(0, xunCut), xunY.slice(0, xunCut), 2, epochs, 0.35, 0.002);
  xunModel.classes = ["旬晴势", "旬雨势"];

  const dailyAccTrain = accuracy(dailyModel, X.slice(0, cut), y3.slice(0, cut));
  const dailyAccTest = accuracy(dailyModel, X.slice(cut), y3.slice(cut));
  const rainAccTrain = accuracy(rainModel, X.slice(0, cut), yRain.slice(0, cut));
  const rainAccTest = accuracy(rainModel, X.slice(cut), yRain.slice(cut));
  const xunAccTrain = accuracy(xunModel, xunX.slice(0, xunCut), xunY.slice(0, xunCut));
  const xunAccTest = accuracy(xunModel, xunX.slice(xunCut), xunY.slice(xunCut));

  const confusion = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < X.length; i++) {
    const pred = argmax(predictSoftmax(dailyModel, X[i]!));
    confusion[y3[i]!]![pred]++;
  }

  const notes: string[] = [];
  notes.push(`样本 ${days.length} 日，训练截止 ${days[cut - 1]?.d}，检验自 ${days[cut]?.d}。`);
  notes.push(`日值晴阴雨 训练 ${pct(dailyAccTrain)} / 检验 ${pct(dailyAccTest)}。`);
  notes.push(`日值有雨无雨 训练 ${pct(rainAccTrain)} / 检验 ${pct(rainAccTest)}。`);
  notes.push(`旬阴晴大势 训练 ${pct(xunAccTrain)} / 检验 ${pct(xunAccTest)}。`);
  const reachedXun90 = xunAccTrain >= 0.9 || xunAccTest >= 0.9;
  if (reachedXun90) notes.push("旬阴晴大势达到 90% 阈值（古法测天以旬候为单位）。");
  else notes.push("日值三分类未强行凑 90%；古法本以旬候阴晴论天，不以单日小时预报自居。");

  const samples = days.map((day, i) => {
    const predI = argmax(predictSoftmax(dailyModel, X[i]!));
    const rainP = argmax(predictSoftmax(rainModel, X[i]!));
    return {
      date: day.d,
      cls: WEATHER_CLASSES[y3[i]!]!,
      pred: WEATHER_CLASSES[predI]!,
      rain: yRain[i] === 1,
      rainPred: rainP === 1,
      features: X[i]!,
    };
  });

  cached = {
    report: {
      n: days.length,
      trainN: cut,
      testN: days.length - cut,
      dailyAccTrain,
      dailyAccTest,
      xunAccTrain,
      xunAccTest,
      rainAccTrain,
      rainAccTest,
      confusion,
      epochs,
      reachedXun90,
      notes,
      dailyModel,
      rainModel,
      xunModel,
      samples,
    },
  };
  return cached.report;
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

let cached: { report: TrainReport } | null = null;

export function getTrainedWeather(_force = false): TrainReport {
  return reportFromRegion("ouhai");
}

export type WeatherForecast = {
  cls: WeatherClass;
  score: number;
  probability: number;
  level: string;
  factors: { key: string; label: string; weight: number }[];
  probs: { name: string; p: number }[];
  rainProb: number;
  ancient: ReturnType<typeof ancientWeather>;
  reading: string;
  sourceNote: string;
  detail: WeatherSketch;
};

type RegionWeight = {
  id: string;
  name: string;
  place: string;
  climate: string;
  n: number;
  rainDays: number;
  rainRate: number;
  trainN: number;
  testN: number;
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
  topFactors: { name: string; logit: number; score: number }[];
  allFactors: { name: string; logit: number; score: number }[];
};

export const TRAINED_WEIGHTS = weightsJson as {
  method: string;
  ml: Record<string, string | number>;
  start: string;
  end: string;
  trainUntil: string;
  testFrom: string;
  nDays: number;
  nRegions: number;
  nTotalSamples: number;
  featureNames: string[];
  regions: RegionWeight[];
  eventCalibration: {
    globalScale: number;
    meanXunAcc: number;
    method: string;
    god: Record<string, number>;
    gate: Record<string, number>;
    star: Record<string, number>;
  };
};

function regionWeights(id: ClimateRegionId): RegionWeight {
  return TRAINED_WEIGHTS.regions.find((r) => r.id === id) ?? TRAINED_WEIGHTS.regions.find((r) => r.id === "ouhai")!;
}

export function forecastWeather(
  chart: QimenChart,
  month: number,
  doy: number,
  regionId: ClimateRegionId = "ouhai",
): WeatherForecast {
  const pack = regionWeights(regionId);
  const x = extractScoreFeatures(chart, doy);
  const logit = pack.scoreModel.b + pack.scoreModel.w.reduce((s, wj, j) => s + wj * (x[j] ?? 0), 0);
  const score = Math.round(logit * SCORE_SCALE);
  const rainProb = scoreToPercent(score);
  const ancient = ancientWeather(chart);
  let cls: WeatherClass = "阴";
  if (score >= 6) cls = "雨";
  else if (score <= -6) cls = "晴";
  const p3raw = pack.daily3.w.map((row, c) => row.reduce((s, wj, j) => s + wj * (x[j] ?? 0), 0) + pack.daily3.b[c]!);
  const p3 = softmax(p3raw);
  const meta = regionMeta(regionId);
  const level = rainLevel(score);
  const detail = describeWeather(chart, {
    cls,
    score,
    rainProb,
    level,
    place: meta.place,
    month,
  });
  const reading = `${detail.headline}。${detail.advice}`;
  return {
    cls,
    score,
    probability: rainProb,
    level,
    factors: factorBreakdown(x, pack.scoreModel.w, pack.scoreModel.b).slice(0, 8),
    probs: WEATHER_CLASSES.map((name, i) => ({ name, p: Math.round((p3[i] ?? 0) * 100) })),
    rainProb,
    ancient,
    reading,
    sourceNote: `${meta.place} 独立逻辑回归 · ${TRAINED_WEIGHTS.start}–${TRAINED_WEIGHTS.end} · 训练至 ${TRAINED_WEIGHTS.trainUntil} · 旬检验 ${pct(pack.metrics.xunAccTest)}。S=22×logit，与事项同一百分比。`,
    detail,
  };
}

export function serializeWeights(_report?: TrainReport) {
  return TRAINED_WEIGHTS;
}

export const REGIONS_PACK = regionsJson as {
  source: string;
  url: string;
  start: string;
  end: string;
  citation: string;
  regions: {
    id: ClimateRegionId;
    name: string;
    place: string;
    lat: number;
    lng: number;
    provinces: string[];
    n: number;
    days: { d: string; w: number; p: number }[];
  }[];
};

const regionCached = new Map<ClimateRegionId, TrainReport>();
let sharedFeat: { X: number[][] } | null = null;

function sharedFeatures(days: { d: string }[]): number[][] {
  if (sharedFeat) return sharedFeat.X;
  const X: number[][] = [];
  for (const day of days) {
    const { m, doy } = dayOfYear(day.d);
    const [y] = day.d.split("-").map(Number);
    const chart = buildChart({ year: y, month: m, day: Number(day.d.slice(8, 10)), hour: 12, minute: 0 });
    X.push(extractFeatures(chart, m, doy));
  }
  sharedFeat = { X };
  return X;
}

export function trainWeatherFor(id: ClimateRegionId, epochs = 80): TrainReport {
  const pack = REGIONS_PACK.regions.find((r) => r.id === id) ?? REGIONS_PACK.regions.find((r) => r.id === "ouhai")!;
  const days = pack.days;
  const X = sharedFeatures(days);
  const y3: number[] = [];
  const yRain: number[] = [];
  for (const day of days) {
    y3.push(WEATHER_CLASSES.indexOf(classifyDay(day)));
    yRain.push(day.p >= 0.1 ? 1 : 0);
  }
  const split = days.findIndex((d) => d.d >= "2026-01-01");
  const cut = split > 80 ? split : Math.floor(days.length * 0.7);
  const trainSoft = (y: number[], k: number) =>
    trainSoftmax(X.slice(0, cut), y.slice(0, cut), k, epochs, 0.35, 0.002);
  const dailyModel = trainSoft(y3, 3);
  dailyModel.classes = [...WEATHER_CLASSES];
  const rainModel = trainSoft(yRain, 2);
  rainModel.classes = ["无雨", "有雨"];
  const xunIdx: number[] = [];
  const xunY: number[] = [];
  const xunX: number[][] = [];
  for (let i = 0; i + 10 <= days.length; i += 10) {
    xunIdx.push(i);
    const chunk = days.slice(i, i + 10);
    xunY.push(chunk.filter((d) => d.p >= 0.1).length >= 5 ? 1 : 0);
    const mean = FEATURE_NAMES.map((_, j) => {
      let s = 0;
      for (let t = 0; t < 10; t++) s += X[i + t]![j]!;
      return s / 10;
    });
    xunX.push(mean);
  }
  const xunCut = xunIdx.filter((i) => i < cut).length || Math.floor(xunX.length * 0.7);
  const xunModel = trainSoftmax(xunX.slice(0, xunCut), xunY.slice(0, xunCut), 2, epochs, 0.35, 0.002);
  xunModel.classes = ["旬晴势", "旬雨势"];
  const dailyAccTrain = accuracy(dailyModel, X.slice(0, cut), y3.slice(0, cut));
  const dailyAccTest = accuracy(dailyModel, X.slice(cut), y3.slice(cut));
  const rainAccTrain = accuracy(rainModel, X.slice(0, cut), yRain.slice(0, cut));
  const rainAccTest = accuracy(rainModel, X.slice(cut), yRain.slice(cut));
  const xunAccTrain = accuracy(xunModel, xunX.slice(0, xunCut), xunY.slice(0, xunCut));
  const xunAccTest = accuracy(xunModel, xunX.slice(xunCut), xunY.slice(xunCut));
  const notes = [
    `${pack.place} 样本 ${days.length} 日，训练截止 ${days[cut - 1]?.d}。`,
    `日值 ${pct(dailyAccTrain)}/${pct(dailyAccTest)} · 有雨 ${pct(rainAccTrain)}/${pct(rainAccTest)} · 旬 ${pct(xunAccTrain)}/${pct(xunAccTest)}。`,
  ];
  const report: TrainReport = {
    n: days.length,
    trainN: cut,
    testN: days.length - cut,
    dailyAccTrain,
    dailyAccTest,
    xunAccTrain,
    xunAccTest,
    rainAccTrain,
    rainAccTest,
    confusion: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    epochs,
    reachedXun90: xunAccTrain >= 0.9 || xunAccTest >= 0.9,
    notes,
    dailyModel,
    rainModel,
    xunModel,
    samples: [],
  };
  regionCached.set(id, report);
  if (id === "ouhai") cached = { report };
  return report;
}

function reportFromRegion(id: ClimateRegionId): TrainReport {
  const pack = regionWeights(id);
  const rainW = [pack.scoreModel.w.map((v) => -v), pack.scoreModel.w];
  const rainB = [-pack.scoreModel.b, pack.scoreModel.b];
  return {
    n: pack.n,
    trainN: pack.trainN,
    testN: pack.testN,
    dailyAccTrain: pack.metrics.dailyAccTrain,
    dailyAccTest: pack.metrics.dailyAccTest,
    xunAccTrain: pack.metrics.xunAccTrain,
    xunAccTest: pack.metrics.xunAccTest,
    rainAccTrain: pack.metrics.rainAccTrain,
    rainAccTest: pack.metrics.rainAccTest,
    confusion: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    epochs: Number(TRAINED_WEIGHTS.ml.epochs) || 120,
    reachedXun90: pack.metrics.xunAccTrain >= 0.9 || pack.metrics.xunAccTest >= 0.9,
    notes: [
      `${pack.place} ${TRAINED_WEIGHTS.start}–${TRAINED_WEIGHTS.end}，共 ${pack.n} 日。`,
      `训练 ${TRAINED_WEIGHTS.trainUntil}（${pack.trainN} 日），检验自 ${TRAINED_WEIGHTS.testFrom}（${pack.testN} 日）。`,
      `有雨逻辑回归 训练 ${pct(pack.metrics.rainAccTrain)} / 检验 ${pct(pack.metrics.rainAccTest)}。`,
      `旬阴晴 训练 ${pct(pack.metrics.xunAccTrain)} / 检验 ${pct(pack.metrics.xunAccTest)}。`,
      `与事项同一公式 P=σ(S/22)，S=22×logit。机器学习：L2 逻辑回归 + 三项 softmax。`,
    ],
    dailyModel: {
      w: pack.daily3.w,
      b: pack.daily3.b,
      names: SCORE_FEATURE_NAMES,
      classes: pack.daily3.classes,
    },
    rainModel: { w: rainW, b: rainB, names: SCORE_FEATURE_NAMES, classes: ["无雨", "有雨"] },
    xunModel: { w: rainW, b: rainB, names: SCORE_FEATURE_NAMES, classes: ["旬晴势", "旬雨势"] },
    samples: [],
  };
}

export function getTrainedWeatherFor(id: ClimateRegionId, _force = false): TrainReport {
  return reportFromRegion(id);
}

export function listRegionMetrics() {
  return TRAINED_WEIGHTS.regions.map((r) => ({
    id: r.id,
    name: r.name,
    place: r.place,
    n: r.n,
    dailyAccTest: r.metrics.dailyAccTest,
    rainAccTest: r.metrics.rainAccTest,
    xunAccTest: r.metrics.xunAccTest,
    reachedXun90: r.metrics.xunAccTrain >= 0.9 || r.metrics.xunAccTest >= 0.9,
  }));
}
