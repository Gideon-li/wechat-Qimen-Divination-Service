import {
  CHANGSHENG_SCORE,
  EVENT_MAP,
  EVENTS,
  GATE_ELEMENT,
  JI_GOD,
  JI_MEN,
  PALACE_META,
  RING,
  SAN_QI,
  STAR_ELEMENT,
  STEM_BASE,
  STEM_CHONG,
  STEM_ELEMENT,
  STEM_HE,
  XING_GROUPS,
  SELF_XING,
  BRANCH_CHONG,
  BRANCH_HAI,
  BRANCH_SIX_HE,
  SCORE_SCALE,
} from "./constants";
import { GATE_BASE, GOD_BASE, STAR_BASE } from "./calibrated";
import { changshengOf, wuxingRelation } from "./calendar";
import { detectClassicPatterns } from "./classic";
import { enrichEventScore } from "./reading";
import { findPalaceBy } from "./chart";
import { natalFactors } from "./natal";
import { displayEvent, type SubjectKind } from "./subject";
import type {
  EventId,
  EventScore,
  GanzhiFlag,
  Gender,
  LuckLevel,
  Palace,
  PalaceId,
  PeopleLink,
  QimenChart,
  RelationKind,
  ScoreFactor,
} from "./types";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function luckLevel(score: number): LuckLevel {
  if (score >= 42) return "大吉";
  if (score >= 20) return "吉";
  if (score >= 6) return "小吉";
  if (score > -6) return "平";
  if (score > -20) return "小凶";
  if (score > -42) return "凶";
  return "大凶";
}

export function probabilityOf(score: number): number {
  const p = 1 / (1 + Math.exp(-score / SCORE_SCALE));
  return Math.round(clamp(p, 0.04, 0.96) * 100);
}

function isXing(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return SELF_XING.has(a);
  return XING_GROUPS.some((g) => g.includes(a) && g.includes(b));
}

function seasonWang(element: string, monthBranch: string): number {
  const map: Record<string, string> = {
    寅: "木",
    卯: "木",
    巳: "火",
    午: "火",
    申: "金",
    酉: "金",
    亥: "水",
    子: "水",
    辰: "土",
    戌: "土",
    丑: "土",
    未: "土",
  };
  const wang = map[monthBranch];
  if (!wang || !element) return 0;
  if (element === wang) return 10;
  const rel = wuxingRelation(element, wang);
  if (rel === "我生") return -4;
  if (rel === "生我") return 5;
  if (rel === "我克") return -2;
  if (rel === "克我") return -8;
  return 0;
}

export function ganzhiFlags(chart: QimenChart, palace: Palace): GanzhiFlag[] {
  const flags: GanzhiFlag[] = [];
  const { year, month, day, hour } = chart.pillars;
  const stems = [year.stem, month.stem, day.stem, hour.stem];
  const branches = [year.branch, month.branch, day.branch, hour.branch];
  const names = ["年", "月", "日", "时"];
  const pStem = palace.heavenStem;
  const pBranch = palace.branch;

  stems.forEach((s, i) => {
    if (STEM_HE[s] === pStem) {
      flags.push({
        label: `${names[i]}干合用神`,
        kind: "合",
        detail: `${s}${pStem}合，外助得力`,
        weight: i >= 2 ? 10 : 6,
      });
    }
    if (STEM_CHONG[s] === pStem) {
      flags.push({
        label: `${names[i]}干冲用神`,
        kind: "冲",
        detail: `${s}${pStem}冲，阻力或变动`,
        weight: i >= 2 ? -12 : -7,
      });
    }
    const rel = wuxingRelation(STEM_ELEMENT[pStem] ?? "", STEM_ELEMENT[s] ?? "");
    if (rel === "生我" && i >= 2) {
      flags.push({
        label: `${names[i]}干生用神`,
        kind: "生",
        detail: `${s}生${pStem}，得气`,
        weight: 6,
      });
    }
    if (rel === "克我" && i >= 2) {
      flags.push({
        label: `${names[i]}干克用神`,
        kind: "克",
        detail: `${s}克${pStem}，受制`,
        weight: -7,
      });
    }
  });

  branches.forEach((b, i) => {
    if (!pBranch) return;
    if (BRANCH_SIX_HE[b] === pBranch) {
      flags.push({
        label: `${names[i]}支合宫`,
        kind: "合",
        detail: `${b}${pBranch}六合，人事可成`,
        weight: i >= 2 ? 9 : 5,
      });
    }
    if (BRANCH_CHONG[b] === pBranch) {
      flags.push({
        label: `${names[i]}支冲宫`,
        kind: "冲",
        detail: `${b}${pBranch}冲，波动、移动、反复`,
        weight: i >= 2 ? -11 : -6,
      });
    }
    if (isXing(b, pBranch)) {
      flags.push({
        label: `${names[i]}支刑宫`,
        kind: "刑",
        detail: `${b}${pBranch}刑，纠葛、不顺`,
        weight: i >= 2 ? -9 : -5,
      });
    }
    if (BRANCH_HAI[b] === pBranch) {
      flags.push({
        label: `${names[i]}支害宫`,
        kind: "害",
        detail: `${b}${pBranch}害，暗损、猜疑`,
        weight: i >= 2 ? -7 : -4,
      });
    }
  });

  const dayCs = changshengOf(day.stem, hour.branch);
  if (dayCs) {
    const w = CHANGSHENG_SCORE[dayCs] ?? 0;
    flags.push({
      label: `日干长生在时`,
      kind: dayCs === "墓" || dayCs === "死" || dayCs === "绝" ? "墓" : "生",
      detail: `${day.stem}在${hour.branch}为${dayCs}`,
      weight: Math.round(w * 0.45),
    });
  }
  const hourCs = changshengOf(hour.stem, day.branch);
  if (hourCs) {
    const w = CHANGSHENG_SCORE[hourCs] ?? 0;
    flags.push({
      label: `时干长生在日`,
      kind: hourCs === "墓" || hourCs === "死" || hourCs === "绝" ? "墓" : "生",
      detail: `${hour.stem}在${day.branch}为${hourCs}`,
      weight: Math.round(w * 0.35),
    });
  }

  if (palace.isKong) {
    flags.push({
      label: "用神空亡",
      kind: "空",
      detail: `旬空${chart.meta.xunKong.join("")}，力量虚、事多空`,
      weight: -16,
    });
  }
  return flags;
}

function detectPatterns(palace: Palace): { name: string; weight: number; detail: string }[] {
  const out: { name: string; weight: number; detail: string }[] = [];
  const { heavenStem: gan, gate, god, star } = palace;
  if (gan && SAN_QI.has(gan) && gate && JI_MEN.has(gate) && god && JI_GOD.has(god)) {
    out.push({ name: "三奇得使", weight: 16, detail: `${gan}奇临${gate}、${god}，贵气成格` });
  }
  if (gan === "丙" && gate === "开门" && god === "九天") {
    out.push({ name: "天遁", weight: 14, detail: "丙奇开门九天，利于公开进取、名位" });
  }
  if (gan === "乙" && (gate === "生门" || god === "九地")) {
    out.push({ name: "地遁", weight: 10, detail: "乙奇得地，利于置业、藏形、求财落地" });
  }
  if (gan === "丁" && god === "太阴" && (gate === "休门" || gate === "开门")) {
    out.push({ name: "人遁", weight: 12, detail: "丁奇太阴，利于密谋、文书、求人" });
  }
  if (palace.fuYin) out.push({ name: "伏吟", weight: -8, detail: "天盘地盘同，事多稽留反复" });
  if (palace.fanYin) out.push({ name: "反吟", weight: -6, detail: "对冲之象，变动大、难安定" });
  if (palace.menPo) out.push({ name: "门迫", weight: -9, detail: "门克宫，行动受阻、力不从心" });
  if (palace.gongPo) out.push({ name: "宫迫", weight: -5, detail: "宫克门，环境压过行动" });
  if (palace.ruMu) out.push({ name: "入墓", weight: -10, detail: `${palace.changsheng}，气收藏、难发用` });
  if (palace.isMa) out.push({ name: "驿马", weight: 4, detail: "马星入宫，主移动、出行、变动" });
  if (star === "天辅" && gate === "景门") {
    out.push({ name: "文昌会景", weight: 8, detail: "利于考试、文书、发表" });
  }
  return out;
}

function healthInvert(palace: Palace, eventId: EventId): number {
  if (eventId !== "health") return 0;
  let n = 0;
  if (palace.star === "天芮" && (palace.isKong || palace.ruMu)) n += 12;
  if (palace.star === "天芮" && palace.changsheng === "帝旺") n -= 10;
  if (palace.gate === "生门") n += 8;
  if (palace.gate === "死门" && !palace.isKong) n -= 8;
  return n;
}

function romanceBath(palace: Palace, eventId: EventId): number {
  if (eventId !== "romance") return 0;
  if (palace.changsheng === "沐浴") return 10;
  if (palace.god === "六合" || palace.god === "太阴") return 0;
  return 0;
}

export type ScoreOpts = {
  gender?: Gender;
  birthYear?: number | null;
  subjectKind?: SubjectKind;
  subjectLabel?: string;
};

export function scoreEvent(
  chart: QimenChart,
  eventId: EventId,
  opts?: ScoreOpts,
): EventScore {
  const def = EVENT_MAP[eventId];
  const palaceId: PalaceId =
    def.yongShen === "zhifu"
      ? chart.meta.zhiFuPalace
      : findPalaceBy(chart, def.yongShen, def.target);
  const palace = chart.palaces[palaceId];
  const factors: ScoreFactor[] = [];

  const godW = (palace.god ? (GOD_BASE[palace.god] ?? 0) : 0) + (palace.god ? (def.godBias[palace.god] ?? 0) : 0);
  factors.push({
    key: "god",
    label: "神 · 开始",
    detail: palace.god ? `${palace.god}临${palace.bagua}` : "中宫无神",
    weight: godW,
    phase: "start",
  });

  const starW = (STAR_BASE[palace.star] ?? 0) + (def.starBias[palace.star] ?? 0);
  factors.push({
    key: "star",
    label: "星 · 过程",
    detail: `${palace.star}（${STAR_ELEMENT[palace.star] ?? ""}）`,
    weight: starW,
    phase: "process",
  });

  const gateW = palace.gate
    ? (GATE_BASE[palace.gate] ?? 0) + (def.gateBias[palace.gate] ?? 0)
    : -4;
  factors.push({
    key: "gate",
    label: "门 · 结束",
    detail: palace.gate ? `${palace.gate}（${GATE_ELEMENT[palace.gate]}）` : "中宫无门",
    weight: gateW,
    phase: "end",
  });

  const stemW = STEM_BASE[palace.heavenStem] ?? 0;
  factors.push({
    key: "stem",
    label: "天盘干",
    detail: `${palace.heavenStem}临${palace.bagua}，地盘${palace.earthStem}`,
    weight: stemW,
    phase: "aux",
  });

  if (palace.changsheng) {
    let cs = CHANGSHENG_SCORE[palace.changsheng] ?? 0;
    if (eventId === "romance" && palace.changsheng === "沐浴") cs = 8;
    factors.push({
      key: "cs",
      label: "十二长生",
      detail: `${palace.heavenStem}在${palace.branch}为${palace.changsheng}`,
      weight: cs,
      phase: "process",
    });
  }

  const wang = seasonWang(GATE_ELEMENT[palace.gate ?? ""] ?? palace.element, chart.pillars.month.branch);
  if (wang) {
    factors.push({
      key: "season",
      label: "月令旺衰",
      detail: `月支${chart.pillars.month.branch}，用神得令${wang > 0 ? "旺相" : "囚死"}`,
      weight: wang,
      phase: "aux",
    });
  }

  const flags = ganzhiFlags(chart, palace);
  for (const f of flags) {
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

  const hi = healthInvert(palace, eventId);
  if (hi) {
    factors.push({
      key: "health-inv",
      label: "病气旺衰",
      detail: hi > 0 ? "病星空墓，病气衰减，利于康复" : "病星得地，需防加重",
      weight: hi,
      phase: "process",
    });
  }
  const rb = romanceBath(palace, eventId);
  if (rb) {
    factors.push({
      key: "peach",
      label: "桃花沐浴",
      detail: "沐浴主桃花、情感流动",
      weight: rb,
      phase: "start",
    });
  }

  if (opts?.gender && eventId === "romance") {
    const want = opts.gender === "male" ? "兑" : "乾";
    if (palace.bagua === want || palace.bagua === (opts.gender === "male" ? "坤" : "坎")) {
      factors.push({
        key: "gender-gong",
        label: "宫位应人",
        detail: `${opts.gender === "male" ? "男测妻财看兑坤" : "女测官夫看乾坎"}，宫位相应`,
        weight: 6,
        phase: "aux",
      });
    }
  }

  if (opts?.birthYear) {
    factors.push(...natalFactors(chart, palaceId, opts.birthYear));
  }

  const start = factors.filter((f) => f.phase === "start").reduce((s, f) => s + f.weight, 0);
  const process = factors.filter((f) => f.phase === "process").reduce((s, f) => s + f.weight, 0);
  const end = factors.filter((f) => f.phase === "end").reduce((s, f) => s + f.weight, 0);
  const aux = factors.filter((f) => f.phase === "aux").reduce((s, f) => s + f.weight, 0);
  const raw = start * 0.25 + process * 0.35 + end * 0.4 + aux * 0.55;
  const score = Math.round(clamp(raw, -100, 100));

  const shown = displayEvent(eventId, opts?.subjectKind ?? "person");
  const subject = opts?.subjectLabel?.trim();
  const reading = composeReading(chart, palace, shown.name, factors, score, {
    start,
    process,
    end,
  }, subject);

  return enrichEventScore(
    chart,
    palace,
    eventId,
    {
      eventId,
      name: shown.name,
      brief: shown.brief,
      palaceId,
      score,
      probability: probabilityOf(score),
      level: luckLevel(score),
      phases: {
        start: { score: Math.round(start), summary: phaseText("start", palace) },
        process: { score: Math.round(process), summary: phaseText("process", palace) },
        end: { score: Math.round(end), summary: phaseText("end", palace) },
      },
      factors: factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
      patterns: patterns.map((p) => p.name),
      reading,
    },
    patterns,
    opts,
  );
}

function phaseText(phase: "start" | "process" | "end", palace: Palace): string {
  if (phase === "start") {
    const g = palace.god ?? "中宫";
    const map: Record<string, string> = {
      值符: "起事得令，宜主动、见贵",
      腾蛇: "起事多疑惊、虚惊反复",
      太阴: "宜暗处谋划，不宜张扬",
      六合: "因人成事，适合会合订约",
      白虎: "起手见刚猛、伤灾或刑克",
      玄武: "起手有暗昧、遗失、盗耗",
      九地: "宜守、宜缓、宜就地生发",
      九天: "宜高举远行、公开进取",
      中宫: "气聚于中，起势不明",
    };
    return map[g] ?? g;
  }
  if (phase === "process") {
    const map: Record<string, string> = {
      天蓬: "过程浊乱、费力、或有盗耗",
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
  const g = palace.gate ?? "无门";
  const map: Record<string, string> = {
    开门: "结局开畅，事业财路可成",
    休门: "结局得休息、贵人、求财平顺",
    生门: "结局有生机、财源、人口之喜",
    伤门: "结局见争伤、破耗，宜止不宜进",
    杜门: "结局闭藏、信息不通，或隐瞒",
    景门: "结局见文书、考试、名闻",
    死门: "结局阻滞、丧败，不宜求进",
    惊门: "结局惊扰反复、口舌不宁",
    无门: "收束于中，结果含混",
  };
  return map[g] ?? g;
}

function composeReading(
  chart: QimenChart,
  palace: Palace,
  eventName: string,
  factors: ScoreFactor[],
  score: number,
  phases: { start: number; process: number; end: number },
  subject?: string,
): string {
  const level = luckLevel(score);
  const top = factors.filter((f) => Math.abs(f.weight) >= 8).slice(0, 4);
  const pos = top.filter((f) => f.weight > 0).map((f) => f.detail);
  const neg = top.filter((f) => f.weight < 0).map((f) => f.detail);
  const kong = palace.isKong ? "用神落空，事易有名无实，宜待填实或改时。" : "";
  const startTone = phases.start >= 4 ? "开始较顺" : phases.start <= -4 ? "起手不畅" : "起手平常";
  const midTone = phases.process >= 4 ? "过程可推进" : phases.process <= -4 ? "过程多阻" : "过程平平";
  const endTone = phases.end >= 4 ? "收局有望" : phases.end <= -4 ? "收局乏力" : "收局两可";
  const help = pos.length ? `有利：${pos.join("；")}。` : "";
  const harm = neg.length ? `不利：${neg.join("；")}。` : "";
  const who = subject ? `以「${subject}」为「我」，问「${eventName}」` : `问「${eventName}」`;
  return `${who}，用神在${palace.bagua}${palace.id}宫（${palace.direction}），天${palace.heavenStem}地${palace.earthStem}，${palace.god ?? "无神"}、${palace.star}、${palace.gate ?? "无门"}。综合${level}（${score > 0 ? "+" : ""}${score}）。神星门分看：${startTone}，${midTone}，${endTone}。日柱${chart.pillars.day.name}、时柱${chart.pillars.hour.name}。${help}${harm}${kong}此为盘面权重模型，宜作决策参考，勿当作唯一依据。`;
}

export function scoreAllEvents(chart: QimenChart, opts?: ScoreOpts): EventScore[] {
  return EVENTS.map((e) => scoreEvent(chart, e.id, opts)).sort((a, b) => b.score - a.score);
}

const KIND_LABEL: Record<RelationKind, string> = {
  lover: "恋人/配偶",
  teacher: "老师/贵人",
  partner: "合伙人",
  parent: "父母长辈",
  child: "晚辈子女",
  boss: "上司领导",
  peer: "同僚朋友",
  subordinate: "下属",
};

export function peopleRelations(chart: QimenChart, gender: Gender): PeopleLink[] {
  const self = chart.palaces[chart.meta.zhiFuPalace];
  const selfEl = self.element;
  const links: PeopleLink[] = [];

  for (const id of RING) {
    if (id === self.id) continue;
    const p = chart.palaces[id];
    const rel = wuxingRelation(selfEl, p.element) ?? "同我";
    const kinds: RelationKind[] = [];
    if (rel === "生我") kinds.push("teacher", "parent", "boss");
    if (rel === "我生") kinds.push("child", "subordinate");
    if (rel === "我克") kinds.push(gender === "male" ? "lover" : "subordinate", "partner");
    if (rel === "克我") kinds.push(gender === "female" ? "lover" : "boss");
    if (rel === "同我") kinds.push("peer", "partner");

    if (p.bagua === "兑" || p.bagua === "离" || p.bagua === "坤") {
      if (gender === "male" && !kinds.includes("lover")) kinds.push("lover");
    }
    if (p.bagua === "乾" || p.bagua === "坎" || p.bagua === "震") {
      if (gender === "female" && !kinds.includes("lover")) kinds.push("lover");
    }
    if (p.bagua === "巽") kinds.push("teacher");
    if (p.bagua === "乾") kinds.push("boss", "parent");

    const gateW = p.gate ? (GATE_BASE[p.gate] ?? 0) : 0;
    const starW = STAR_BASE[p.star] ?? 0;
    const godW = p.god ? (GOD_BASE[p.god] ?? 0) : 0;
    const extra =
      (p.isKong ? -14 : 0) + (p.ruMu ? -8 : 0) + (p.menPo ? -6 : 0) + (p.fuYin ? -4 : 0);
    const he = BRANCH_SIX_HE[self.branch] === p.branch ? 10 : 0;
    const chong = BRANCH_CHONG[self.branch] === p.branch ? -12 : 0;
    const score = Math.round(clamp((gateW + starW + godW) * 0.45 + extra + he + chong, -80, 80));

    const sixKin =
      rel === "生我" ? "父母" : rel === "我生" ? "子孙" : rel === "克我" ? "官鬼" : rel === "我克" ? "妻财" : "兄弟";

    const summary = `${p.bagua}宫${PALACE_META[id].people}。与值符${rel}，六亲属${sixKin}。见${p.god ?? "—"}、${p.star}、${p.gate ?? "无门"}，关系倾向${luckLevel(score)}。${p.isKong ? "落空，关系虚、难落实。" : ""}${he ? "支合，易亲近成事。" : ""}${chong ? "支冲，易争执分离。" : ""}`;

    links.push({
      palaceId: id,
      bagua: p.bagua,
      role: PALACE_META[id].people,
      sixKin,
      relation: rel,
      kinds: [...new Set(kinds)],
      score,
      level: luckLevel(score),
      summary,
    });
  }
  return links.sort((a, b) => b.score - a.score);
}

export { KIND_LABEL };
