import { applyTrueSolar, beijingNow, getJuFromLots, type CivilTime } from "./engine/calendar";
import { digitRootToJu } from "./engine/classic";
import { buildChart } from "./engine/chart";
import { DEFAULT_LOCATION, locationLng, areasOf, citiesOf, provinces } from "./engine/china";
import { peopleRelations, scoreAllEvents, scoreEvent, type ScoreOpts } from "./engine/score";
import { natalView } from "./engine/natal";
import { ACTIVITY_META, bestDirection, scoreDirections, type DirectionActivity } from "./engine/direction";
import { buildFortunePack } from "./engine/fortune";
import { displayEvent, isPlaceSubject, subjectName, subjectPrompt, subjectScope, type SubjectKind } from "./engine/subject";
import { EVENTS } from "./engine/constants";
import { extractSymbolPack } from "./engine/extract";
import { forecastDistrictWeather, loadDistrictWeights, eventBasesForLocation } from "./engine/district-model";
import { forecastWeather } from "./engine/weather-model";
import { regionForProvince } from "./engine/regions";
import type { EventId, Gender, QimenChart } from "./engine/types";

export { digitRootToJu, EVENTS, ACTIVITY_META, displayEvent, subjectPrompt };

export type QueryBody = {
  civil?: Partial<CivilTime>;
  trueSolar?: boolean;
  casting?: "chaibu" | "lots";
  lotsMonth?: number;
  lotsJu?: number;
  lotsCode?: string;
  subjectKind?: SubjectKind;
  personName?: string;
  gender?: Gender;
  birthYear?: number | null;
  location?: {
    province?: string;
    city?: string;
    district?: string;
    provinceCode?: string;
    cityCode?: string;
    districtCode?: string;
  };
  eventId?: EventId;
  activity?: DirectionActivity;
  question?: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

export type Resolved = {
  civil: CivilTime;
  chart: QimenChart;
  opts: ScoreOpts;
  who: string;
  scope: string;
  subjectKind: SubjectKind;
  eventId: EventId;
  activity: DirectionActivity;
  loc: {
    province: string;
    city: string;
    district: string;
    provinceCode: string;
    cityCode: string;
    districtCode: string;
  };
  gender: Gender;
  birthYear: number | null;
};

function num(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveLocation(body: QueryBody) {
  const loc = body.location ?? {};
  let provinceCode = loc.provinceCode || DEFAULT_LOCATION.provinceCode;
  let cityCode = loc.cityCode || DEFAULT_LOCATION.cityCode;
  let districtCode = loc.districtCode || DEFAULT_LOCATION.districtCode;
  if (loc.province && !loc.provinceCode) {
    const p = provinces().find((x) => x.n === loc.province || x.n.includes(loc.province!));
    if (p) provinceCode = p.code;
  }
  const pnode = provinces().find((x) => x.code === provinceCode);
  if (loc.city && !loc.cityCode) {
    const c = citiesOf(provinceCode).find((x) => x.n === loc.city || x.n.includes(loc.city!));
    if (c) cityCode = c.code;
  }
  if (loc.district && !loc.districtCode) {
    const a = areasOf(provinceCode, cityCode).find((x) => x.n === loc.district || x.n.includes(loc.district!));
    if (a) districtCode = a.code;
  }
  const cnode = citiesOf(provinceCode).find((x) => x.code === cityCode) ?? citiesOf(provinceCode)[0];
  if (cnode) cityCode = cnode.code;
  const anode = areasOf(provinceCode, cityCode).find((x) => x.code === districtCode) ?? areasOf(provinceCode, cityCode)[0];
  if (anode) districtCode = anode.code;
  return {
    province: loc.province || pnode?.n || DEFAULT_LOCATION.province,
    city: loc.city || cnode?.n || DEFAULT_LOCATION.city,
    district: loc.district || anode?.n || DEFAULT_LOCATION.district,
    provinceCode,
    cityCode,
    districtCode,
  };
}

export function resolveQuery(body: QueryBody = {}): Resolved {
  const now = beijingNow();
  let civil: CivilTime = {
    year: num(body.civil?.year, now.year),
    month: num(body.civil?.month, now.month),
    day: num(body.civil?.day, now.day),
    hour: num(body.civil?.hour, now.hour),
    minute: num(body.civil?.minute, now.minute),
  };
  const loc = resolveLocation(body);
  if (body.trueSolar) {
    const lng = locationLng(loc.provinceCode, loc.districtCode);
    civil = applyTrueSolar(civil, lng);
  }
  let juOverride = undefined;
  if (body.casting === "lots") {
    let ju = num(body.lotsJu, 5);
    if (body.lotsCode) {
      const r = digitRootToJu(String(body.lotsCode));
      if (r.source) ju = r.ju;
    }
    juOverride = getJuFromLots(num(body.lotsMonth, civil.month), ju);
  }
  const chart = buildChart(civil, juOverride);
  const subjectKind: SubjectKind = body.subjectKind ?? "person";
  const personName = body.personName?.trim() ?? "";
  const who = subjectName(subjectKind, { personName, ...loc });
  const place = isPlaceSubject(subjectKind);
  const birthYearRaw = !place && body.birthYear ? Number(body.birthYear) : null;
  const birthYear = birthYearRaw && birthYearRaw >= 1920 && birthYearRaw <= 2030 ? birthYearRaw : null;
  const gender: Gender = body.gender === "female" ? "female" : "male";
  const opts: ScoreOpts = {
    gender,
    birthYear,
    subjectKind,
    subjectLabel: who,
  };
  const eventId = (EVENTS.some((e) => e.id === body.eventId) ? body.eventId : "wealth") as EventId;
  const activity = (ACTIVITY_META.some((a) => a.id === body.activity) ? body.activity : "commerce") as DirectionActivity;
  return {
    civil,
    chart,
    opts,
    who,
    scope: subjectScope(subjectKind, loc),
    subjectKind,
    eventId,
    activity,
    loc,
    gender,
    birthYear,
  };
}

export async function attachDistrictBases(r: Resolved): Promise<Resolved> {
  const pack = await loadDistrictWeights();
  const bases = eventBasesForLocation(pack, r.loc);
  return { ...r, opts: { ...r.opts, bases } };
}

export async function readyQuery(body: QueryBody = {}) {
  return attachDistrictBases(resolveQuery(body));
}

function doyOf(c: CivilTime) {
  return Math.floor((Date.UTC(c.year, c.month - 1, c.day) - Date.UTC(c.year, 0, 1)) / 86400000) + 1;
}

function slimChart(chart: QimenChart) {
  return {
    timeLabel: chart.timeLabel,
    hourName: chart.hourName,
    beijing: chart.beijing,
    pillars: chart.pillars,
    ju: chart.ju,
    meta: chart.meta,
    palaces: Object.fromEntries(
      Object.entries(chart.palaces).map(([id, p]) => [
        id,
        {
          id: p.id,
          bagua: p.bagua,
          direction: p.direction,
          earthStem: p.earthStem,
          heavenStem: p.heavenStem,
          star: p.star,
          gate: p.gate,
          god: p.god,
          changsheng: p.changsheng,
          isKong: p.isKong,
          isZhiFu: p.isZhiFu,
          isZhiShi: p.isZhiShi,
          isMa: p.isMa,
          fuYin: p.fuYin,
          fanYin: p.fanYin,
          menPo: p.menPo,
          gongPo: p.gongPo,
          ruMu: p.ruMu,
          jiXing: p.jiXing,
        },
      ]),
    ),
  };
}

export function packChart(r: Resolved) {
  return {
    subject: { kind: r.subjectKind, name: r.who, scope: r.scope, gender: r.gender, birthYear: r.birthYear },
    location: r.loc,
    civil: r.civil,
    chart: slimChart(r.chart),
    model: r.opts.bases
      ? { shared: "weather+events", how: r.opts.bases.how, place: r.opts.bases.place }
      : { shared: "national-fallback", how: "全国平均", place: "全国" },
  };
}

export function packEvents(r: Resolved) {
  return scoreAllEvents(r.chart, r.opts);
}

export function packEvent(r: Resolved, eventId?: EventId) {
  return scoreEvent(r.chart, eventId ?? r.eventId, r.opts);
}

export function packPeople(r: Resolved) {
  return peopleRelations(r.chart, r.gender, r.opts.bases);
}

export function packDirections(r: Resolved) {
  return {
    activity: r.activity,
    ranked: scoreDirections(r.chart, r.activity),
    overall: bestDirection(r.chart),
  };
}

export function packNatal(r: Resolved) {
  if (!r.birthYear) return { natal: null, note: "仅个人对象且填写出生年（1920–2030）时计算本命。" };
  return { natal: natalView(r.chart, r.birthYear) };
}

export function packFortune(r: Resolved) {
  return buildFortunePack(r.civil, r.opts);
}

export async function packWeather(r: Resolved) {
  const pack = await loadDistrictWeights();
  const district = forecastDistrictWeather(r.chart, doyOf(r.civil), r.loc, pack);
  const regionId = regionForProvince(r.loc.provinceCode);
  const climate = forecastWeather(r.chart, r.civil.month, doyOf(r.civil), regionId);
  return {
    district,
    climateBand: climate,
    sketch: district.detail,
    model: {
      nDistricts: pack.nDistricts,
      start: pack.start,
      end: pack.end,
      trainUntil: pack.trainUntil,
      method: pack.method,
    },
  };
}

export function packExtract(r: Resolved, eventId?: EventId) {
  const score = scoreEvent(r.chart, eventId ?? r.eventId, r.opts);
  const palace = r.chart.palaces[score.palaceId];
  return {
    score,
    pack: extractSymbolPack(r.chart, palace, score.eventId, score.level, {
      subjectLine: subjectPrompt(r.subjectKind, r.who, r.scope),
      eventTitle: score.name,
    }),
  };
}
