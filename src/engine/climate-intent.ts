/**
 * 按当地雨日率调整判定门槛与对外文案。
 * 不改各县已拟合的 31 维 w：湿润区本来就把阴雨类符号推正，干旱区推负。
 * 这里只改「多高才报雨 / 多低才报晴」，以及叙事用词。
 */
export type ClimateBand = "arid" | "dry" | "mid" | "humid" | "wet";
export type WeatherCall = "晴" | "阴" | "雨";

export type ClimateIntent = {
  band: ClimateBand;
  label: string;
  rainRate: number;
  rainThresholdScore: number;
  sunThresholdScore: number;
  majorityBaseline: number;
  rainAccTest?: number;
  skillOverBaseline?: number;
  note: string;
};

const BANDS: { id: ClimateBand; max: number; label: string; rain: number; sun: number }[] = [
  { id: "arid", max: 0.2, label: "干旱", rain: 12, sun: 0 },
  { id: "dry", max: 0.35, label: "偏干", rain: 8, sun: -4 },
  { id: "mid", max: 0.5, label: "过渡", rain: 6, sun: -6 },
  { id: "humid", max: 0.65, label: "偏湿", rain: 0, sun: -10 },
  { id: "wet", max: 1.01, label: "多雨", rain: -4, sun: -16 },
];

export function climateBandFromRainRate(rainRate: number): ClimateBand {
  const r = Number.isFinite(rainRate) ? rainRate : 0.45;
  return (BANDS.find((b) => r < b.max) ?? BANDS[2]!).id;
}

export function climateSpec(band: ClimateBand) {
  return BANDS.find((b) => b.id === band) ?? BANDS[2]!;
}

export function resolveClimateIntent(opts: {
  rainRate?: number;
  rainAccTest?: number;
}): ClimateIntent {
  const rainRate = Number.isFinite(opts.rainRate) ? Math.max(0, Math.min(1, opts.rainRate!)) : 0.45;
  const spec = climateSpec(climateBandFromRainRate(rainRate));
  const majorityBaseline = Math.max(rainRate, 1 - rainRate);
  const rainAccTest = opts.rainAccTest;
  const skillOverBaseline =
    rainAccTest != null ? Math.round((rainAccTest - majorityBaseline) * 1000) / 1000 : undefined;
  const note =
    spec.id === "wet" || spec.id === "humid"
      ? `本地雨日率 ${(rainRate * 100).toFixed(1)}%，属${spec.label}带。报雨门槛降到分值 ${spec.rain}（阴天倾向也可报雨）。请看相对「天天报雨」的技巧，不要只看准确率。`
      : spec.id === "arid" || spec.id === "dry"
        ? `本地雨日率 ${(rainRate * 100).toFixed(1)}%，属${spec.label}带。只有分值达到 ${spec.rain} 才报雨，避免把高云、扬沙说成落雨。`
        : `本地雨日率 ${(rainRate * 100).toFixed(1)}%，属过渡带。晴雨门槛仍用分值 ${spec.sun} / ${spec.rain}。`;
  return {
    band: spec.id,
    label: spec.label,
    rainRate,
    rainThresholdScore: spec.rain,
    sunThresholdScore: spec.sun,
    majorityBaseline: Math.round(majorityBaseline * 1000) / 1000,
    rainAccTest,
    skillOverBaseline,
    note,
  };
}

export function classifyByClimate(score: number, intent: ClimateIntent): WeatherCall {
  if (score >= intent.rainThresholdScore) return "雨";
  if (score <= intent.sunThresholdScore) return "晴";
  return "阴";
}

/** 叙事层：湿区把阴云升格成易成雨，旱区把大雨降成高云、难得成雨。 */
export function tonePhrase(
  name: string,
  weather: string,
  text: string,
  band: ClimateBand,
): { weather: string; text: string } {
  const wet = band === "wet" || band === "humid";
  const dry = band === "arid" || band === "dry";
  if (!wet && !dry) return { weather, text };
  const table: Record<string, { wetW: string; wetT: string; dryW: string; dryT: string }> = {
    太阴: {
      wetW: "阴转雨",
      wetT: "太阴在多雨区主阴云转雨、夜里更潮，容易下成可量的雨",
      dryW: "薄云露水",
      dryT: "太阴在干旱区多是薄云、露水，难得下成可量的雨",
    },
    玄武: {
      wetW: "阴雨潮湿",
      wetT: "玄武在多雨区主阴雨连绵，夜里、低洼更容易下透",
      dryW: "低云潮湿",
      dryT: "玄武在干旱区多是低云、地面潮，不代表能下透",
    },
    九地: {
      wetW: "低云成雨",
      wetT: "九地在多雨区主低云压湿，雾湿可转成雨",
      dryW: "沙尘薄雾",
      dryT: "九地在干旱区主沙尘、薄雾、地面干湿不均，难成雨",
    },
    天蓬: {
      wetW: "大雨",
      wetT: "天蓬在多雨区雨势偏大，水路低洼剖防",
      dryW: "高云水气",
      dryT: "天蓬在干旱区多见高云、水气过境，落下来的少",
    },
    天芮: {
      wetW: "连阴成雨",
      wetT: "天芮在多雨区主连阴、湿土，拖成可量的雨",
      dryW: "阴霾干土",
      dryT: "天芮在干旱区主阴霾、土气，日照差但不一定下雨",
    },
    休门: {
      wetW: "阴雨歇息",
      wetT: "休门在多雨区主阴雨、潮气，天像歇着却仍可能滴雨",
      dryW: "阴凉少雨",
      dryT: "休门在干旱区主阴凉、少出门，雨仍然稀",
    },
    杜门: {
      wetW: "阴云待雨",
      wetT: "杜门在多雨区阴云堵着，拖久了容易滴雨",
      dryW: "阴云不开",
      dryT: "杜门在干旱区阴云堵着不散，仍常是干阴",
    },
    壬: {
      wetW: "大雨",
      wetT: "壬水在多雨区主江河之雨，雨势偏大",
      dryW: "高空水气",
      dryT: "壬水在干旱区多是高空水气过境，落地的少",
    },
    癸: {
      wetW: "细雨成滴",
      wetT: "癸水在多雨区主细雨、阴雨，下得绵",
      dryW: "湿气细沫",
      dryT: "癸水在干旱区多是湿气、细沫，记不上雨量",
    },
  };
  const hit = table[name];
  if (!hit) return { weather, text };
  return wet ? { weather: hit.wetW, text: hit.wetT } : { weather: hit.dryW, text: hit.dryT };
}

export function scaleAspects<T extends Record<string, number>>(aspects: T, band: ClimateBand): T {
  const out = { ...aspects };
  const wet = band === "wet" || band === "humid";
  const dry = band === "arid" || band === "dry";
  if (wet) {
    if ("rain" in out) (out as Record<string, number>).rain *= 1.22;
    if ("fog" in out) (out as Record<string, number>).fog *= 1.08;
    if ("sun" in out) (out as Record<string, number>).sun *= 0.88;
  } else if (dry) {
    if ("rain" in out) (out as Record<string, number>).rain *= 0.62;
    if ("sun" in out) (out as Record<string, number>).sun *= 1.12;
    if ("fog" in out) (out as Record<string, number>).fog *= 0.9;
  }
  return out;
}
