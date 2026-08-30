import { PALACE_META, RING } from "./constants";
import type { Palace, PalaceId, QimenChart } from "./types";

/** 古法八门用事。据《烟波钓叟赋》《奇门法窍》门旨归纳。 */
export const GATE_USES: Record<
  string,
  { suit: string[]; avoid: string[]; classic: string }
> = {
  开门: {
    suit: ["开张经营", "求财放债", "远行见贵", "嫁娶入宅", "上官赴任"],
    avoid: ["安葬", "捕猎行刑"],
    classic: "开门为金，乾宫本门。宜开张、求财、远行、见贵、嫁娶、入宅。",
  },
  休门: {
    suit: ["休养治病", "求财婚姻", "公事谒贵", "修造安床"],
    avoid: ["出师征战", "词讼争斗"],
    classic: "休门为水，坎宫本门。宜治病、休息、求财、婚姻、公事。",
  },
  生门: {
    suit: ["求财开业", "种植生产", "嫁娶上官", "安葬造葬亦有生发"],
    avoid: ["词讼争斗", "出师血光"],
    classic: "生门为土，艮宫本门。八门最吉，宜求财、生产、开业、嫁娶。",
  },
  伤门: {
    suit: ["出师捕猎", "索债讨捕", "修造破土"],
    avoid: ["婚姻嫁娶", "安葬入宅", "求医疗病"],
    classic: "伤门为木，震宫本门。宜渔猎、捕捉、讨债；不宜婚姻、安葬。",
  },
  杜门: {
    suit: ["躲灾避难", "捕盗塞穴", "修筑隐藏", "遁迹不出"],
    avoid: ["求谋见贵", "开张远行"],
    classic: "杜门为木，巽宫本门。宜躲藏、避难、修筑；不宜求见、开张。",
  },
  景门: {
    suit: ["上书科甲", "文书谒贵", "火烛文明", "求名考试"],
    avoid: ["争讼动武", "安葬"],
    classic: "景门为火，离宫本门。宜上书、考试、求名、谒贵、文书。",
  },
  死门: {
    suit: ["丧葬安葬", "捕猎行刑", "破土修坟"],
    avoid: ["求财婚姻", "开张入宅", "求医疗病"],
    classic: "死门为土，坤宫本门。古法用于丧葬、行刑、捕猎；求财婚姻大忌。",
  },
  惊门: {
    suit: ["词讼捕捉", "惊扰出师", "口舌是非中取胜"],
    avoid: ["安床入宅", "婚姻嫁娶", "安葬"],
    classic: "惊门为金，兑宫本门。宜捕猎、词讼、惊扰；不宜安床、入宅。",
  },
};

export type DirectionActivity =
  | "commerce"
  | "travel"
  | "exam"
  | "marriage"
  | "healing"
  | "hide"
  | "funeral"
  | "lawsuit"
  | "hunt"
  | "build";

export const ACTIVITY_META: {
  id: DirectionActivity;
  name: string;
  prefer: string[];
  avoid: string[];
}[] = [
  { id: "commerce", name: "经商开张", prefer: ["开门", "生门", "休门"], avoid: ["死门", "杜门", "伤门"] },
  { id: "travel", name: "远行出门", prefer: ["开门", "生门", "景门"], avoid: ["杜门", "死门"] },
  { id: "exam", name: "考试求名", prefer: ["景门", "开门", "生门"], avoid: ["死门", "伤门"] },
  { id: "marriage", name: "嫁娶婚姻", prefer: ["生门", "休门", "开门"], avoid: ["伤门", "死门", "惊门"] },
  { id: "healing", name: "治病休养", prefer: ["休门", "生门"], avoid: ["伤门", "死门", "惊门"] },
  { id: "hide", name: "避难隐藏", prefer: ["杜门", "休门"], avoid: ["开门", "景门"] },
  { id: "funeral", name: "丧葬安葬", prefer: ["死门", "开门"], avoid: ["生门", "伤门"] },
  { id: "lawsuit", name: "词讼捕捉", prefer: ["惊门", "伤门"], avoid: ["休门", "生门"] },
  { id: "hunt", name: "捕猎出师", prefer: ["伤门", "死门", "惊门"], avoid: ["休门"] },
  { id: "build", name: "修造入宅", prefer: ["开门", "生门", "休门"], avoid: ["死门", "惊门", "伤门"] },
];

export type DirectionScore = {
  palaceId: PalaceId;
  bagua: string;
  direction: string;
  gate: string | null;
  star: string;
  god: string | null;
  score: number;
  level: string;
  suit: string[];
  avoid: string[];
  classic: string;
  note: string;
};

function gateScore(gate: string | null, activity: DirectionActivity): number {
  if (!gate) return -4;
  const meta = ACTIVITY_META.find((a) => a.id === activity)!;
  if (meta.prefer.includes(gate)) return 16;
  if (meta.avoid.includes(gate)) return -16;
  return 0;
}

function extras(p: Palace): number {
  let n = 0;
  if (p.god === "值符" || p.god === "九天" || p.god === "六合" || p.god === "太阴") n += 6;
  if (p.god === "白虎" || p.god === "玄武" || p.god === "腾蛇") n -= 5;
  if (p.star === "天心" || p.star === "天任" || p.star === "天辅") n += 4;
  if (p.star === "天蓬" || p.star === "天芮" || p.star === "天柱") n -= 4;
  if (p.isKong) n -= 8;
  if (p.menPo || p.gongPo) n -= 6;
  if (p.ruMu) n -= 5;
  if (p.fuYin) n -= 3;
  if (p.fanYin) n -= 4;
  return n;
}

export function scoreDirections(chart: QimenChart, activity: DirectionActivity): DirectionScore[] {
  return RING.map((id) => {
    const p = chart.palaces[id];
    const gate = p.gate;
    const uses = gate ? GATE_USES[gate] : null;
    const score = gateScore(gate, activity) + extras(p);
    const level =
      score >= 16 ? "大宜" : score >= 6 ? "宜" : score >= -5 ? "平" : score >= -16 ? "不宜" : "大忌";
    const meta = PALACE_META[id];
    const note = `${meta.direction}${meta.bagua}宫临${gate ?? "无门"}、${p.star}、${p.god ?? "无神"}。${uses?.classic ?? "中宫寄宫，不以门论。"}`;
    return {
      palaceId: id,
      bagua: meta.bagua,
      direction: meta.direction,
      gate,
      star: p.star,
      god: p.god,
      score,
      level,
      suit: uses?.suit ?? [],
      avoid: uses?.avoid ?? [],
      classic: uses?.classic ?? "",
      note,
    };
  }).sort((a, b) => b.score - a.score);
}

export function bestDirection(chart: QimenChart): DirectionScore[] {
  return RING.map((id) => {
    const p = chart.palaces[id];
    const uses = p.gate ? GATE_USES[p.gate] : null;
    let score = 0;
    if (p.gate === "生门" || p.gate === "开门" || p.gate === "休门") score += 12;
    if (p.gate === "景门") score += 6;
    if (p.gate === "杜门") score += 2;
    if (p.gate === "伤门" || p.gate === "惊门") score -= 4;
    if (p.gate === "死门") score -= 10;
    score += extras(p);
    const meta = PALACE_META[id];
    const level = score >= 14 ? "大吉方" : score >= 6 ? "吉方" : score >= -4 ? "平" : "凶方";
    return {
      palaceId: id,
      bagua: meta.bagua,
      direction: meta.direction,
      gate: p.gate,
      star: p.star,
      god: p.god,
      score,
      level,
      suit: uses?.suit ?? [],
      avoid: uses?.avoid ?? [],
      classic: uses?.classic ?? "",
      note: `${meta.direction}宜：${(uses?.suit ?? ["中宫不论"]).slice(0, 3).join("、")}`,
    };
  }).sort((a, b) => b.score - a.score);
}
