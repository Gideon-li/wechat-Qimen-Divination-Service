import { HeavenStem, EarthBranch, SolarTime, SolarTerm } from "tyme4ts";
import { JU_BY_TERM } from "./constants";
import type { DunType, FourPillars, JuInfo, Pillar, Yuan } from "./types";

export type CivilTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function hourToZhiIndex(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2);
}

function pillarOf(cycle: {
  getName: () => string;
  getHeavenStem: () => { getName: () => string };
  getEarthBranch: () => { getName: () => string };
  getSound: () => { getName: () => string };
}): Pillar {
  return {
    stem: cycle.getHeavenStem().getName(),
    branch: cycle.getEarthBranch().getName(),
    name: cycle.getName(),
    nayin: cycle.getSound().getName(),
  };
}

export function getFourPillars(civil: CivilTime): FourPillars {
  const t = SolarTime.fromYmdHms(civil.year, civil.month, civil.day, civil.hour, civil.minute, 0);
  const eight = t.getLunarHour().getEightChar();
  return {
    year: pillarOf(eight.getYear()),
    month: pillarOf(eight.getMonth()),
    day: pillarOf(eight.getDay()),
    hour: pillarOf(eight.getHour()),
  };
}

export function getHourCycle(civil: CivilTime) {
  const t = SolarTime.fromYmdHms(civil.year, civil.month, civil.day, civil.hour, civil.minute, 0);
  return t.getLunarHour().getEightChar().getHour();
}

export function getJu(civil: CivilTime): JuInfo {
  const t = SolarTime.fromYmdHms(civil.year, civil.month, civil.day, civil.hour, civil.minute, 0);
  const termDay = t.getSolarDay().getTermDay();
  const term = termDay.getSolarTerm();
  const index = term.getIndex();
  const dayIndex = termDay.getDayIndex();
  const yuan: Yuan = dayIndex <= 4 ? "上元" : dayIndex <= 9 ? "中元" : "下元";
  const yuanIdx = yuan === "上元" ? 0 : yuan === "中元" ? 1 : 2;
  const ju = JU_BY_TERM[index][yuanIdx];
  const dun = index < 12 ? "yang" : "yin";
  const dunLabel = dun === "yang" ? "阳遁" : "阴遁";
  return {
    term: term.getName(),
    termDayIndex: dayIndex,
    yuan,
    dun,
    ju,
    label: `${term}${yuan} ${dunLabel}${ju}局`,
  };
}

/** 以月份近似阴阳遁：冬至后至夏至前为阳遁（12–5月），夏至后至冬至前为阴遁（6–11月）。 */
export function dunFromSolarMonth(month: number): DunType {
  return month >= 6 && month <= 11 ? "yin" : "yang";
}

export function getJuFromLots(month: number, ju: number): JuInfo {
  const clamped = Math.min(9, Math.max(1, Math.round(ju)));
  const dun = dunFromSolarMonth(month);
  const dunLabel = dun === "yang" ? "阳遁" : "阴遁";
  return {
    term: `${month}月`,
    termDayIndex: 0,
    yuan: "中元",
    dun,
    ju: clamped,
    label: `求签 · ${month}月${dunLabel}${clamped}局`,
  };
}

export const MONTH_NAMES = [
  "正月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
] as const;

export function getXun(civil: CivilTime): { xunShou: string; xunYi: string; xunKong: string[] } {
  const hour = getHourCycle(civil);
  const xunShou = hour.getTen().getName();
  const extra = hour.getExtraEarthBranches().map((b) => b.getName());
  const xunYiMap: Record<string, string> = {
    甲子: "戊",
    甲戌: "己",
    甲申: "庚",
    甲午: "辛",
    甲辰: "壬",
    甲寅: "癸",
  };
  return { xunShou, xunYi: xunYiMap[xunShou] ?? "戊", xunKong: extra };
}

export function changshengOf(stem: string, branch: string): string | null {
  if (!stem || !branch) return null;
  try {
    return HeavenStem.fromName(stem).getTerrain(EarthBranch.fromName(branch)).getName();
  } catch {
    return null;
  }
}

export function yearStemOf(year: number): string {
  const t = SolarTime.fromYmdHms(year, 6, 15, 12, 0, 0);
  return t.getLunarHour().getEightChar().getYear().getHeavenStem().getName();
}

export function applyTrueSolar(civil: CivilTime, longitude: number): CivilTime {
  const offsetMin = Math.round((longitude - 120) * 4);
  const date = new Date(Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour, civil.minute));
  date.setUTCMinutes(date.getUTCMinutes() + offsetMin);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

export function beijingNow(): CivilTime {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: g("year"), month: g("month"), day: g("day"), hour: g("hour"), minute: g("minute") };
}

export function formatCivil(c: CivilTime): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${c.year}-${p(c.month)}-${p(c.day)} ${p(c.hour)}:${p(c.minute)}`;
}

export function civilMs(c: CivilTime): number {
  return Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute);
}

export function addCivilDays(c: CivilTime, days: number): CivilTime {
  const d = new Date(civilMs(c) + days * 86400000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

export function addCivilMinutes(c: CivilTime, minutes: number): CivilTime {
  const d = new Date(civilMs(c) + minutes * 60000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** 二十四节气交节时刻（北京历面）。 */
export function solarTermCivil(year: number, name: string): CivilTime {
  const t = SolarTerm.fromName(year, name).getJulianDay().getSolarTime();
  const at = {
    year: t.getYear(),
    month: t.getMonth(),
    day: t.getDay(),
    hour: t.getHour(),
    minute: t.getMinute(),
  };
  // 交节瞬间干支尚未入新月/新年，排盘取交节后三分钟。
  return addCivilMinutes(at, 3);
}

/** 节（非气）起干支月：寅月立春 … 丑月小寒。 */
export const MONTH_JIE: { branch: string; term: string }[] = [
  { branch: "寅", term: "立春" },
  { branch: "卯", term: "惊蛰" },
  { branch: "辰", term: "清明" },
  { branch: "巳", term: "立夏" },
  { branch: "午", term: "芒种" },
  { branch: "未", term: "小暑" },
  { branch: "申", term: "立秋" },
  { branch: "酉", term: "白露" },
  { branch: "戌", term: "寒露" },
  { branch: "亥", term: "立冬" },
  { branch: "子", term: "大雪" },
  { branch: "丑", term: "小寒" },
];

export type YearBound = { ganzhiYear: number; lichun: CivilTime };

/** 立春为年界。所选时刻若在立春前，年运属上一年。 */
export function yearBoundary(civil: CivilTime): YearBound {
  const lichun = solarTermCivil(civil.year, "立春");
  if (civilMs(civil) < civilMs(lichun)) {
    return { ganzhiYear: civil.year - 1, lichun: solarTermCivil(civil.year - 1, "立春") };
  }
  return { ganzhiYear: civil.year, lichun };
}

export type MonthBound = {
  branch: string;
  term: string;
  at: CivilTime;
  ganzhiYear: number;
};

/** 某干支年内十二节气交节（寅月立春至翌年丑月小寒）。 */
export function yearMonthTerms(ganzhiYear: number): MonthBound[] {
  return MONTH_JIE.map((m) => {
    const y = m.branch === "丑" ? ganzhiYear + 1 : ganzhiYear;
    const at = solarTermCivil(y, m.term);
    return { ...m, at, ganzhiYear };
  });
}

/** 当前干支月：最近一个已交的节。 */
export function monthBoundary(civil: CivilTime): MonthBound {
  const yb = yearBoundary(civil);
  const terms = [
    ...yearMonthTerms(yb.ganzhiYear - 1),
    ...yearMonthTerms(yb.ganzhiYear),
    ...yearMonthTerms(yb.ganzhiYear + 1),
  ];
  const now = civilMs(civil);
  const past = terms.filter((t) => civilMs(t.at) <= now).sort((a, b) => civilMs(b.at) - civilMs(a.at));
  return past[0] ?? yearMonthTerms(yb.ganzhiYear)[0]!;
}

/** 日家取午时（日之中）为当日代表盘。 */
export function noonCivil(civil: CivilTime): CivilTime {
  return { year: civil.year, month: civil.month, day: civil.day, hour: 12, minute: 0 };
}

/** 十二时辰中点：子 0 时 … 亥 22 时。 */
export const HOUR_MIDPOINTS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] as const;

export function hourCivil(civil: CivilTime, hour: number): CivilTime {
  return { year: civil.year, month: civil.month, day: civil.day, hour, minute: 0 };
}

export function wuxingRelation(
  a: string,
  b: string,
): "生我" | "我生" | "克我" | "我克" | "同我" | null {
  if (!a || !b) return null;
  if (a === b) return "同我";
  const order = ["木", "火", "土", "金", "水"];
  const i = order.indexOf(a);
  const j = order.indexOf(b);
  if (i < 0 || j < 0) return null;
  if ((i + 1) % 5 === j) return "我生";
  if ((j + 1) % 5 === i) return "生我";
  if ((i + 2) % 5 === j) return "我克";
  if ((j + 2) % 5 === i) return "克我";
  return "同我";
}
