/**
 * 给其它本地项目直接 import 的函数接口。
 * GitHub 只托管源码与模型，不对外提供在线调用。
 */
import { loadConfig, publicConfig, saveConfig, type AppConfig, type LlmConfig } from "./config";
import { composeAssociation, consultChart } from "./consult";
import { digitRootToJu } from "./engine/classic";
import { EVENTS } from "./engine/constants";
import { ACTIVITY_META } from "./engine/direction";
import { SUBJECT_OPTIONS, displayEvent, subjectPrompt } from "./engine/subject";
import { SYMBOL_LIB } from "./engine/symbols";
import { describeWeather } from "./engine/weather-detail";
import { loadDistrictWeights } from "./engine/district-model";
import {
  packChart,
  packDirections,
  packEvent,
  packEvents,
  packExtract,
  packFortune,
  packNatal,
  packPeople,
  packWeather,
  readyQuery,
  resolveQuery,
  type QueryBody,
} from "./kernel";

export type { QueryBody, AppConfig, LlmConfig };
export { EVENTS, ACTIVITY_META, SUBJECT_OPTIONS, SYMBOL_LIB, displayEvent, digitRootToJu, describeWeather };

async function withChart(body: QueryBody = {}) {
  const r = await readyQuery(body);
  return { r, base: packChart(r) };
}

/** 本地配置大模型 Key / 地址 / 模型名，写入 data/config.json */
export async function configure(patch: Parameters<typeof saveConfig>[0]) {
  return publicConfig(await saveConfig(patch));
}

export async function getConfig() {
  return publicConfig(await loadConfig());
}

/** 只排盘 */
export function chart(body: QueryBody = {}) {
  return packChart(resolveQuery(body));
}

/** 十二类事项（与该地天气同一套区县模型） */
export async function events(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  return { ...base, events: packEvents(r) };
}

/** 单事项 */
export async function event(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  return { ...base, event: packEvent(r) };
}

/** 人事六亲 */
export async function people(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  return { ...base, people: packPeople(r), zhiFu: r.chart.palaces[r.chart.meta.zhiFuPalace] };
}

/** 八门方位 */
export async function directions(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  return { ...base, directions: packDirections(r) };
}

/** 年 / 月 / 日运 */
export async function fortune(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  return { ...base, fortune: packFortune(r) };
}

/** 本命年（需 birthYear） */
export async function natal(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  return { ...base, ...packNatal(r) };
}

/** 区县天气（本地权重） */
export async function weather(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  return { ...base, weather: await packWeather(r) };
}

/** 三位数求局 */
export function lots(code: string) {
  const r = digitRootToJu(String(code ?? ""));
  return { code: r.source, ju: r.ju, steps: r.steps };
}

/** 全盘：盘 + 事项 + 人事 + 方位 + 运势 + 天气 + 本命 */
export async function scan(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  return {
    ...base,
    events: packEvents(r),
    focus: packEvent(r),
    people: packPeople(r),
    directions: packDirections(r),
    fortune: packFortune(r),
    natal: packNatal(r).natal,
    weather: await packWeather(r),
  };
}

export const divination = scan;

/** 智断：组一件具体的事（需本地已配置大模型 Key） */
export async function consultCompose(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  const extracted = packExtract(r);
  const score = extracted.score;
  const result = await composeAssociation({
    question: String(body.question ?? `请就「${score.name}」围绕「${r.who}」联想一件最合理的具体事情。`),
    eventName: score.name,
    level: score.level,
    score: score.score,
    pack: extracted.pack.prompt,
    brief: extracted.pack.brief,
    person: r.who,
    gender: r.gender,
    location: r.scope,
    subjectLine: subjectPrompt(r.subjectKind, r.who, r.scope),
  });
  if (!result.ok) throw new Error(result.error);
  return { ...base, event: score, tokens: extracted.pack.tokens, scene: result.result };
}

/** 智断：追问盘面（含白话吉凶第三段） */
export async function consultAsk(body: QueryBody = {}) {
  const { r, base } = await withChart(body);
  const extracted = packExtract(r);
  const score = extracted.score;
  const palace = r.chart.palaces[score.palaceId];
  const result = await consultChart({
    question: String(body.question ?? ""),
    pack: extracted.pack.prompt,
    brief: extracted.pack.brief,
    history: Array.isArray(body.history) ? body.history : [],
    person: r.who,
    location: r.scope,
    subjectLine: subjectPrompt(r.subjectKind, r.who, r.scope),
    luck: {
      eventName: score.name,
      subject: r.who,
      level: score.level,
      score: score.score,
      probability: score.probability,
      bagua: palace.bagua,
      god: palace.god,
      star: palace.star,
      gate: palace.gate,
      kong: palace.isKong,
      fuYin: r.chart.meta.fuYin,
      fanYin: r.chart.meta.fanYin,
      patterns: score.patterns,
    },
  });
  if (!result.ok) throw new Error(result.error);
  return { ...base, event: score, text: result.text };
}

export async function models() {
  const pack = await loadDistrictWeights();
  const cfg = await getConfig();
  return {
    engine: "chao-bu qimen + additive S, P=σ(S/22), SCORE_SCALE=22",
    local: {
      districtWeather: {
        file: "models/qimen-district-weights-2020-2026.json",
        nDistricts: pack.nDistricts,
        nCities: pack.nCities,
        nProvinces: pack.nProvinces,
        start: pack.start,
        end: pack.end,
        trainUntil: pack.trainUntil,
        method: pack.method,
        ml: pack.ml,
      },
      climateBands: "src/engine/weather-weights.json",
      eventCalibration: "src/engine/event-calibration.json",
      symbols: SYMBOL_LIB.length,
    },
    llm: cfg.llm,
  };
}

export const qimen = {
  configure,
  getConfig,
  chart,
  events,
  event,
  people,
  directions,
  fortune,
  natal,
  weather,
  lots,
  scan,
  divination,
  consultCompose,
  consultAsk,
  models,
};
