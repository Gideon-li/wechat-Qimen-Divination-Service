import {
  BRANCH_CHONG,
  CHANGSHENG_SCORE,
  GATE_ELEMENT,
  HOUR_NAMES,
  PALACE_META,
  STAR_ELEMENT,
  STEM_BASE,
} from "./constants";
import { GATE_BASE, GOD_BASE, STAR_BASE } from "./calibrated";
import { detectClassicPatterns, GATE_CLASSIC, STAR_SONG } from "./classic";
import {
  addCivilDays,
  hourCivil,
  HOUR_MIDPOINTS,
  hourToZhiIndex,
  monthBoundary,
  noonCivil,
  yearBoundary,
  yearMonthTerms,
  type CivilTime,
} from "./calendar";
import { buildChart, palaceOfEarthBranch } from "./chart";
import { natalFactors, natalView } from "./natal";
import { ganzhiFlags, luckLevel, probabilityOf, scoreAllEvents, type ScoreOpts } from "./score";
import type {
  EventScore,
  LuckLevel,
  Palace,
  PalaceId,
  QimenChart,
  ScoreFactor,
} from "./types";

export type FortuneKind = "year" | "month" | "day";

export type FortuneSlice = {
  id: string;
  name: string;
  score: number;
  probability: number;
  level: LuckLevel;
  current: boolean;
};

export type PeriodFortune = {
  kind: FortuneKind;
  title: string;
  subtitle: string;
  civil: CivilTime;
  chart: QimenChart;
  score: number;
  probability: number;
  level: LuckLevel;
  palaceId: PalaceId;
  phases: EventScore["phases"];
  factors: ScoreFactor[];
  patterns: string[];
  reading: string;
  associations: string[];
  omen: string;
  classicCite: string;
  events: EventScore[];
  slices: FortuneSlice[];
  marks: Partial<Record<PalaceId, string>>;
};

export type FortunePack = {
  year: PeriodFortune;
  month: PeriodFortune;
  day: PeriodFortune;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function phaseText(phase: "start" | "process" | "end", palace: Palace): string {
  if (phase === "start") {
    const map: Record<string, string> = {
      值符: "起势得令，宜主动、见贵",
      腾蛇: "起势多疑惊、虚惊反复",
      太阴: "宜暗处谋划，不宜张扬",
      六合: "因人成事，适合会合订约",
      白虎: "起手见刚猛、伤灾或刑克",
      玄武: "起手有暗昧、遗失、盗耗",
      九地: "宜守、宜缓、宜就地生发",
      九天: "宜高举远行、公开进取",
    };
    return map[palace.god ?? ""] ?? "气聚于中，起势不明";
  }
  if (phase === "process") {
    const map: Record<string, string> = {
      天蓬: "过程浊乱、费力，或有盗耗",
      天芮: "过程迟滞、病困、小人",
      天冲: "过程急躁冲动，宜决不宜拖",
      天辅: "过程得文昌、贵人、策略",
      天禽: "过程中正，枢纽在握",
      天心: "过程有谋、医、管理之象",
      天柱: "过程破耗、口舌、倒塌",
      天任: "过程稳实、可任可托",
      天英: "过程光鲜但火燥，宜防争",
    };
    return map[palace.star] ?? palace.star;
  }
  const map: Record<string, string> = {
    开门: "收局开畅，事业财路可成",
    休门: "收局得休息、贵人、求财平顺",
    生门: "收局有生机、财源、人口之喜",
    伤门: "收局见争伤、破耗，宜止不宜进",
    杜门: "收局闭藏、信息不通，或隐瞒",
    景门: "收局见文书、考试、名闻",
    死门: "收局阻滞、丧败，不宜求进",
    惊门: "收局惊扰反复、口舌不宁",
  };
  return map[palace.gate ?? ""] ?? "收束于中，结果含混";
}

function scoreSelf(
  chart: QimenChart,
  extra: ScoreFactor[],
): {
  score: number;
  probability: number;
  level: LuckLevel;
  palaceId: PalaceId;
  palace: Palace;
  phases: EventScore["phases"];
  factors: ScoreFactor[];
  patterns: string[];
} {
  const palaceId = chart.meta.zhiFuPalace;
  const palace = chart.palaces[palaceId];
  const factors: ScoreFactor[] = [];

  const godW = palace.god ? (GOD_BASE[palace.god] ?? 0) : 0;
  factors.push({
    key: "god",
    label: "神 · 开始",
    detail: palace.god ? `${palace.god}临${palace.bagua}` : "中宫无神",
    weight: godW,
    phase: "start",
  });
  const starW = STAR_BASE[palace.star] ?? 0;
  factors.push({
    key: "star",
    label: "星 · 过程",
    detail: `${palace.star}（${STAR_ELEMENT[palace.star] ?? ""}）`,
    weight: starW,
    phase: "process",
  });
  const gateW = palace.gate ? (GATE_BASE[palace.gate] ?? 0) : -4;
  factors.push({
    key: "gate",
    label: "门 · 结束",
    detail: palace.gate ? `${palace.gate}（${GATE_ELEMENT[palace.gate] ?? ""}）` : "中宫无门",
    weight: gateW,
    phase: "end",
  });
  factors.push({
    key: "stem",
    label: "天盘干",
    detail: `${palace.heavenStem}临${palace.bagua}，地盘${palace.earthStem}`,
    weight: STEM_BASE[palace.heavenStem] ?? 0,
    phase: "aux",
  });
  if (palace.changsheng) {
    factors.push({
      key: "cs",
      label: "十二长生",
      detail: `${palace.heavenStem}在${palace.branch}为${palace.changsheng}`,
      weight: CHANGSHENG_SCORE[palace.changsheng] ?? 0,
      phase: "process",
    });
  }
  for (const f of ganzhiFlags(chart, palace)) {
    factors.push({
      key: `gz-${f.label}`,
      label: f.label,
      detail: f.detail,
      weight: f.weight,
      phase: "aux",
    });
  }
  const patterns = detectClassicPatterns(chart, palace);
  for (const p of patterns) {
    factors.push({
      key: `pt-${p.name}`,
      label: p.name,
      detail: p.detail,
      weight: p.weight,
      phase: p.name === "伏吟" || p.name === "反吟" ? "process" : "end",
    });
  }
  factors.push(...extra);

  const start = factors.filter((f) => f.phase === "start").reduce((s, f) => s + f.weight, 0);
  const process = factors.filter((f) => f.phase === "process").reduce((s, f) => s + f.weight, 0);
  const end = factors.filter((f) => f.phase === "end").reduce((s, f) => s + f.weight, 0);
  const aux = factors.filter((f) => f.phase === "aux").reduce((s, f) => s + f.weight, 0);
  const raw = start * 0.25 + process * 0.35 + end * 0.4 + aux * 0.55;
  const score = Math.round(clamp(raw, -100, 100));
  return {
    score,
    probability: probabilityOf(score),
    level: luckLevel(score),
    palaceId,
    palace,
    phases: {
      start: { score: Math.round(start), summary: phaseText("start", palace) },
      process: { score: Math.round(process), summary: phaseText("process", palace) },
      end: { score: Math.round(end), summary: phaseText("end", palace) },
    },
    factors: factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
    patterns: patterns.map((p) => p.name),
  };
}

function quickScore(civil: CivilTime): { score: number; probability: number; level: LuckLevel } {
  const chart = buildChart(civil);
  const s = scoreSelf(chart, []);
  return { score: s.score, probability: s.probability, level: s.level };
}

function periodExtras(
  chart: QimenChart,
  kind: FortuneKind,
  opts?: { birthYear?: number | null },
): { extra: ScoreFactor[]; marks: Partial<Record<PalaceId, string>> } {
  const extra: ScoreFactor[] = [];
  const marks: Partial<Record<PalaceId, string>> = {};
  const self = chart.meta.zhiFuPalace;
  const yearBr = chart.pillars.year.branch;
  const monthBr = chart.pillars.month.branch;
  const dayBr = chart.pillars.day.branch;
  const taiSui = palaceOfEarthBranch(yearBr);
  const yueJian = palaceOfEarthBranch(monthBr);
  const riJian = palaceOfEarthBranch(dayBr);
  marks[taiSui] = "太岁";
  if (kind !== "year") marks[yueJian] = marks[yueJian] ? "太岁/月建" : "月建";
  if (kind === "day") marks[riJian] = marks[riJian] ? `${marks[riJian]}/日建` : "日建";

  if (self === taiSui) {
    extra.push({
      key: "taisui",
      label: "值符坐太岁",
      detail: `太岁${yearBr}在${PALACE_META[taiSui].bagua}宫，得岁气`,
      weight: kind === "year" ? 14 : 8,
      phase: "aux",
    });
  }
  const suiPo = palaceOfEarthBranch(BRANCH_CHONG[yearBr] ?? "");
  if (self === suiPo && suiPo !== 5) {
    extra.push({
      key: "suipo",
      label: "值符坐岁破",
      detail: `${yearBr}冲${BRANCH_CHONG[yearBr]}，一年多变动、迁移`,
      weight: kind === "year" ? -14 : -8,
      phase: "aux",
    });
  }
  if (kind !== "year" && self === yueJian) {
    extra.push({
      key: "yuejian",
      label: "值符坐月建",
      detail: `月建${monthBr}在${PALACE_META[yueJian].bagua}宫，得月令`,
      weight: 10,
      phase: "aux",
    });
  }
  const yuePo = palaceOfEarthBranch(BRANCH_CHONG[monthBr] ?? "");
  if (kind !== "year" && self === yuePo && yuePo !== 5) {
    extra.push({
      key: "yuepo",
      label: "值符坐月破",
      detail: `月建冲${BRANCH_CHONG[monthBr]}，月内反复`,
      weight: -10,
      phase: "aux",
    });
  }
  if (kind === "day" && self === riJian) {
    extra.push({
      key: "rijian",
      label: "值符坐日支",
      detail: `日支${dayBr}临用神，当日得地`,
      weight: 8,
      phase: "aux",
    });
  }
  if (opts?.birthYear) {
    extra.push(...natalFactors(chart, self, opts.birthYear));
    const nv = natalView(chart, opts.birthYear);
    for (const [k, v] of Object.entries(nv.marks)) {
      const id = Number(k) as PalaceId;
      marks[id] = marks[id] && marks[id] !== v ? `${marks[id]}/${v}` : v;
    }
  }
  return { extra, marks };
}

function composePeriodReading(
  kind: FortuneKind,
  chart: QimenChart,
  palace: Palace,
  score: number,
  level: LuckLevel,
  phases: EventScore["phases"],
  subject?: string,
): string {
  const label = kind === "year" ? "年运" : kind === "month" ? "月运" : "日运";
  const pillar =
    kind === "year" ? chart.pillars.year.name : kind === "month" ? chart.pillars.month.name : chart.pillars.day.name;
  const startTone = phases.start.score >= 4 ? "起势较顺" : phases.start.score <= -4 ? "起势不畅" : "起势平常";
  const midTone = phases.process.score >= 4 ? "过程可推进" : phases.process.score <= -4 ? "过程多阻" : "过程平平";
  const endTone = phases.end.score >= 4 ? "收局有望" : phases.end.score <= -4 ? "收局乏力" : "收局两可";
  const kong = palace.isKong ? "值符落空，名气易虚，宜待填实。" : "";
  const fu = chart.meta.fuYin ? "全盘伏吟，事多稽留反复。" : "";
  const fan = chart.meta.fanYin ? "全盘反吟，变动大、难安定。" : "";
  const me = subject ? `「${subject}」` : "「我」";
  return `${label}取${palace.bagua}${palace.id}宫值符为${me}，${palace.god ?? "无神"}、${palace.star}、${palace.gate ?? "无门"}。干支${pillar}。综合${level}（${score > 0 ? "+" : ""}${score}，顺利倾向 ${probabilityOf(score)}%）。神星门：${startTone}，${midTone}，${endTone}。${kong}${fu}${fan}分值算法与十二类事项相同：S 加权后 P=σ(S/22)。此为交节/日中盘面权衡，供学习，并非定论。`;
}

function associations(
  kind: FortuneKind,
  chart: QimenChart,
  palace: Palace,
  level: LuckLevel,
  slices: FortuneSlice[],
): string[] {
  const lucky = level.includes("吉");
  const bad = level.includes("凶");
  const items: string[] = [];
  const gate = palace.gate ?? "无门";
  if (kind === "year") {
    items.push(
      lucky
        ? `值符临${gate}，本年宜主动布局，名位、财源、人事以开畅为基。`
        : bad
          ? `值符临${gate}，本年宜守成、少开新盘，先稳根基再议进取。`
          : `本年起伏不大，宜择月而动，不必强求全年铺开。`,
    );
    const best = [...slices].sort((a, b) => b.score - a.score)[0];
    const worst = [...slices].sort((a, b) => a.score - b.score)[0];
    if (best) items.push(`十二节气里「${best.name}」分值最高（${best.score > 0 ? "+" : ""}${best.score}），大事宜落在这一段。`);
    if (worst && worst.score <= -6) items.push(`「${worst.name}」较弱，宜减开支、少争执、慎远行。`);
    items.push(`太岁在${PALACE_META[palaceOfEarthBranch(chart.pillars.year.branch)].bagua}宫，冲方为岁破，搬家、动土宜避开冲方。`);
  } else if (kind === "month") {
    items.push(
      lucky
        ? `本月${gate}得用，签约、求财、出行可择上中元顺势而为。`
        : `本月宜收束，文件、钱款、口舌多复核一遍。`,
    );
    const best = [...slices].sort((a, b) => b.score - a.score)[0];
    if (best) items.push(`月内「${best.name}」较顺，琐事可集中到这一旬处理。`);
    items.push(`月建${chart.pillars.month.branch}坐${PALACE_META[palaceOfEarthBranch(chart.pillars.month.branch)].bagua}宫，月破方少动土、少争讼。`);
  } else {
    const bestH = [...slices].sort((a, b) => b.score - a.score)[0];
    const worstH = [...slices].sort((a, b) => a.score - b.score)[0];
    items.push(
      lucky ? `今日值符临${gate}，宜办正事、见人、出门。` : `今日宜稳，文书钱款反复核对，少逞口舌。`,
    );
    if (bestH) items.push(`十二时辰里「${bestH.name}时」最顺（${bestH.score > 0 ? "+" : ""}${bestH.score}），约会、签约、求财优先此时。`);
    if (worstH && worstH.score <= -6) items.push(`「${worstH.name}时」较弱，宜避开争执、远行、手术类安排。`);
    items.push(`日支${chart.pillars.day.branch}在${PALACE_META[palaceOfEarthBranch(chart.pillars.day.branch)].bagua}宫，当日用事方向与日支生合为佳。`);
  }
  if (palace.god === "玄武") items.push("玄武临值符，防遗失、盗耗、暗昧，财物锁紧。");
  if (palace.god === "白虎") items.push("白虎临值符，防口舌伤灾，开车、手术、口角宜慎。");
  if (palace.god === "六合" || palace.god === "太阴") items.push("合、阴之神临身，利于约会、密议、中人撮合。");
  if (chart.meta.fuYin) items.push("伏吟之年/月/日，旧事重提、手续反复，宜补完再开新。");
  return items.slice(0, 6);
}

function finish(
  kind: FortuneKind,
  title: string,
  subtitle: string,
  civil: CivilTime,
  chart: QimenChart,
  opts: ScoreOpts | undefined,
  slices: FortuneSlice[],
): PeriodFortune {
  const { extra, marks } = periodExtras(chart, kind, opts);
  const self = scoreSelf(chart, extra);
  const events = scoreAllEvents(chart, opts);
  const reading = composePeriodReading(
    kind,
    chart,
    self.palace,
    self.score,
    self.level,
    self.phases,
    opts?.subjectLabel,
  );
  const assoc = associations(kind, chart, self.palace, self.level, slices);
  const omen = self.palace.god === "值符" ? "天乙在门，贵人车马" : self.palace.god === "腾蛇" ? "虚惊怪异，半途而回" : "";
  const classicCite = self.palace.gate
    ? GATE_CLASSIC[self.palace.gate]?.song ?? "刘基《奇门遁甲秘笈大全》"
    : STAR_SONG[self.palace.star] ?? "刘基《奇门遁甲总序》";
  return {
    kind,
    title,
    subtitle,
    civil,
    chart,
    score: self.score,
    probability: self.probability,
    level: self.level,
    palaceId: self.palaceId,
    phases: self.phases,
    factors: self.factors,
    patterns: self.patterns,
    reading,
    associations: assoc,
    omen,
    classicCite,
    events,
    slices,
    marks,
  };
}

export function buildFortunePack(civil: CivilTime, opts?: ScoreOpts): FortunePack {
  const yb = yearBoundary(civil);
  const mb = monthBoundary(civil);
  const yearChart = buildChart(yb.lichun);
  const monthChart = buildChart(mb.at);
  const dayAt = noonCivil(civil);
  const dayChart = buildChart(dayAt);

  const monthTerms = yearMonthTerms(yb.ganzhiYear);
  const yearSlices: FortuneSlice[] = monthTerms.map((t) => {
    const q = quickScore(t.at);
    return {
      id: t.branch,
      name: `${t.branch}月·${t.term}`,
      score: q.score,
      probability: q.probability,
      level: q.level,
      current: t.term === mb.term && t.ganzhiYear === mb.ganzhiYear,
    };
  });

  const monthSlices: FortuneSlice[] = [
    { id: "上元", name: "上旬·上元", at: mb.at },
    { id: "中元", name: "中旬·中元", at: addCivilDays(mb.at, 5) },
    { id: "下元", name: "下旬·下元", at: addCivilDays(mb.at, 10) },
  ].map((s) => {
    const q = quickScore(s.at);
    return {
      id: s.id,
      name: s.name,
      score: q.score,
      probability: q.probability,
      level: q.level,
      current: monthChart.ju.yuan === s.id,
    };
  });

  const zhiNow = hourToZhiIndex(civil.hour);
  const daySlices: FortuneSlice[] = HOUR_MIDPOINTS.map((h, i) => {
    const q = quickScore(hourCivil(civil, h));
    return {
      id: HOUR_NAMES[i]!,
      name: HOUR_NAMES[i]!,
      score: q.score,
      probability: q.probability,
      level: q.level,
      current: i === zhiNow,
    };
  });

  const yearTitle = `${yearChart.pillars.year.name}年`;
  const monthTitle = `${monthChart.pillars.month.name}月`;
  const dayTitle = `${dayChart.pillars.day.name}日`;

  return {
    year: finish(
      "year",
      `${yearTitle}运势`,
      `立春交节 ${yearChart.timeLabel} · ${yearChart.ju.label}`,
      yb.lichun,
      yearChart,
      opts ?? {},
      yearSlices,
    ),
    month: finish(
      "month",
      `${monthTitle}运势`,
      `${mb.term}交节 ${monthChart.timeLabel} · ${monthChart.ju.label}`,
      mb.at,
      monthChart,
      opts ?? {},
      monthSlices,
    ),
    day: finish(
      "day",
      `${dayTitle}运势`,
      `日中午时 ${dayChart.timeLabel} · ${dayChart.ju.label}`,
      dayAt,
      dayChart,
      opts ?? {},
      daySlices,
    ),
  };
}
