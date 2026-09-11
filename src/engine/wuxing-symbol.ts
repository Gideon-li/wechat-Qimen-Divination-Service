import { wuxingRelation } from "./calendar";
import {
  BRANCH_ELEMENT,
  GATE_ELEMENT,
  GOD_ELEMENT,
  JI_GOD,
  JI_MEN,
  STAR_ELEMENT,
  STEM_ELEMENT,
  XIONG_MEN,
} from "./constants";
import type { GanzhiFlag, Palace, QimenChart } from "./types";

export const XIONG_GOD = new Set(["腾蛇", "白虎", "玄武"]);
export const JI_STAR = new Set(["天辅", "天心", "天任", "天禽", "天冲"]);
export const XIONG_STAR = new Set(["天蓬", "天芮", "天柱"]);

export type SymbolKind = "神" | "门" | "星";
export type Polarity = "吉" | "凶" | "中";
export type Tone = "吉" | "小吉" | "小凶" | "凶" | "平";

export function polarityOf(kind: SymbolKind, name: string | null | undefined): Polarity {
  if (!name) return "中";
  if (kind === "神") {
    if (JI_GOD.has(name)) return "吉";
    if (XIONG_GOD.has(name)) return "凶";
    return "中";
  }
  if (kind === "门") {
    if (JI_MEN.has(name)) return "吉";
    if (XIONG_MEN.has(name)) return "凶";
    return "中";
  }
  if (JI_STAR.has(name)) return "吉";
  if (XIONG_STAR.has(name)) return "凶";
  return "中";
}

export function elementOf(kind: SymbolKind, name: string | null | undefined): string {
  if (!name) return "";
  if (kind === "神") return GOD_ELEMENT[name] ?? "";
  if (kind === "门") return GATE_ELEMENT[name] ?? "";
  return STAR_ELEMENT[name] ?? "";
}

export function toneOf(polarity: Polarity, rel: "生我" | "克我" | "我生" | "我克" | "同我" | null): Tone {
  if (!rel || rel === "同我" || rel === "我生") return "平";
  if (polarity === "吉" && rel === "生我") return "吉";
  if (polarity === "吉" && rel === "克我") return "小吉";
  if (polarity === "吉" && rel === "我克") return "小吉";
  if (polarity === "凶" && rel === "生我") return "小凶";
  if (polarity === "凶" && rel === "克我") return "凶";
  if (polarity === "凶" && rel === "我克") return "小凶";
  if (polarity === "中" && rel === "生我") return "小吉";
  if (polarity === "中" && rel === "克我") return "小凶";
  return "平";
}

function weightOf(polarity: Polarity, rel: "生我" | "克我" | "我生" | "我克" | "同我" | null, scale: number): number {
  if (!rel || rel === "同我") return 0;
  let raw = 0;
  if (polarity === "吉") {
    if (rel === "生我") raw = 9;
    else if (rel === "克我") raw = -3;
    else if (rel === "我克") raw = 3;
    else if (rel === "我生") raw = 1;
  } else if (polarity === "凶") {
    if (rel === "生我") raw = -4;
    else if (rel === "克我") raw = -11;
    else if (rel === "我克") raw = -6;
    else if (rel === "我生") raw = -2;
  } else {
    if (rel === "生我") raw = 3;
    else if (rel === "克我") raw = -3;
    else if (rel === "我克") raw = 1;
  }
  return Math.round(raw * scale);
}

type Agent = { label: string; glyph: string; element: string; scale: number; who: string };

function agents(chart: QimenChart, palace: Palace): Agent[] {
  const { year, month, day, hour } = chart.pillars;
  const earthBr = palace.branch || palace.branches[0] || "";
  return [
    { label: "日干", glyph: day.stem, element: STEM_ELEMENT[day.stem] ?? "", scale: 1, who: "自己" },
    { label: "日支", glyph: day.branch, element: BRANCH_ELEMENT[day.branch] ?? "", scale: 1, who: "自己" },
    { label: "时干", glyph: hour.stem, element: STEM_ELEMENT[hour.stem] ?? "", scale: 0.85, who: "当下顺逆" },
    { label: "时支", glyph: hour.branch, element: BRANCH_ELEMENT[hour.branch] ?? "", scale: 0.9, who: "当下顺逆" },
    { label: "地盘干", glyph: palace.earthStem, element: STEM_ELEMENT[palace.earthStem] ?? "", scale: 0.7, who: "用神宫地盘" },
    { label: "地盘支", glyph: earthBr, element: BRANCH_ELEMENT[earthBr] ?? "", scale: 0.7, who: "用神宫地盘" },
    { label: "月干", glyph: month.stem, element: STEM_ELEMENT[month.stem] ?? "", scale: 0.55, who: "亲友同僚" },
    { label: "月支", glyph: month.branch, element: BRANCH_ELEMENT[month.branch] ?? "", scale: 0.55, who: "亲友同僚" },
    { label: "年干", glyph: year.stem, element: STEM_ELEMENT[year.stem] ?? "", scale: 0.45, who: "长者领导主考" },
    { label: "年支", glyph: year.branch, element: BRANCH_ELEMENT[year.branch] ?? "", scale: 0.45, who: "长者领导主考" },
  ];
}

function verb(rel: "生我" | "克我" | "我生" | "我克" | "同我"): string {
  if (rel === "生我") return "生";
  if (rel === "克我") return "克";
  if (rel === "我生") return "反生";
  if (rel === "我克") return "反克";
  return "同";
}

function explain(polarity: Polarity, rel: "生我" | "克我" | "我生" | "我克" | "同我", tone: Tone): string {
  if (polarity === "吉" && rel === "生我") return "吉神得生而旺，事偏吉";
  if (polarity === "吉" && rel === "克我") return "吉神被克，吉气打折，只作小吉，克重可滑向小凶";
  if (polarity === "吉" && rel === "我克") return "吉神制住对方，小吉，能用得上";
  if (polarity === "凶" && rel === "生我") return "凶神被生，灾是明的，反而成小凶，能看见、好防";
  if (polarity === "凶" && rel === "克我") return "凶神被克，灾压在暗处，更隐蔽也更凶";
  if (polarity === "凶" && rel === "我克") return "凶神去克干支，明处冲撞，偏小凶";
  if (polarity === "中" && rel === "生我") return "中神得生，所主之事略显";
  if (polarity === "中" && rel === "克我") return "中神被克，所主之事发力不足";
  return `关系为${rel}，断为${tone}`;
}

export type SymbolHit = {
  kind: SymbolKind;
  name: string;
  element: string;
  polarity: Polarity;
  agent: string;
  glyph: string;
  agentEl: string;
  rel: "生我" | "克我" | "我生" | "我克" | "同我";
  tone: Tone;
  weight: number;
  detail: string;
};

export function symbolWuxingHits(chart: QimenChart, palace: Palace): SymbolHit[] {
  const specs: { kind: SymbolKind; name: string | null }[] = [
    { kind: "神", name: palace.god },
    { kind: "门", name: palace.gate },
    { kind: "星", name: palace.star },
  ];
  const out: SymbolHit[] = [];
  for (const spec of specs) {
    if (!spec.name) continue;
    const el = elementOf(spec.kind, spec.name);
    const pol = polarityOf(spec.kind, spec.name);
    if (!el) continue;
    for (const a of agents(chart, palace)) {
      if (!a.element || !a.glyph) continue;
      const rel = wuxingRelation(el, a.element);
      if (!rel || rel === "同我" || rel === "我生") continue;
      const tone = toneOf(pol, rel);
      const weight = weightOf(pol, rel, a.scale);
      if (!weight) continue;
      out.push({
        kind: spec.kind,
        name: spec.name,
        element: el,
        polarity: pol,
        agent: a.label,
        glyph: a.glyph,
        agentEl: a.element,
        rel,
        tone,
        weight,
        detail: `${a.label}${a.glyph}（${a.element}）${verb(rel)}${spec.kind}${spec.name}（${el}，${pol}）。${a.who}这边：${explain(pol, rel, tone)}`,
      });
    }
  }
  return out;
}

export function symbolWuxingFlags(chart: QimenChart, palace: Palace): GanzhiFlag[] {
  return symbolWuxingHits(chart, palace).map((h) => ({
    label: `${h.kind}${h.name}${h.rel === "生我" ? "被生" : h.rel === "克我" ? "被克" : h.rel === "我克" ? "反克" : h.rel}`,
    kind: h.rel === "克我" || h.rel === "我克" ? "克" : "生",
    detail: h.detail,
    weight: h.weight,
  }));
}

export function wuxingPlainLines(chart: QimenChart, palace: Palace, limit = 6): string[] {
  return symbolWuxingHits(chart, palace)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, limit)
    .map((h) => h.detail);
}

export const SYMBOL_WXING_FEATURE_NAMES = [
  "神_吉被生",
  "神_吉被克",
  "神_凶被生",
  "神_凶被克",
  "门_吉被生",
  "门_吉被克",
  "门_凶被生",
  "门_凶被克",
  "星_吉被生",
  "星_吉被克",
  "星_凶被生",
  "星_凶被克",
] as const;

export function extractSymbolWuxingFeatures(chart: QimenChart, palace: Palace): number[] {
  const x = Array.from({ length: SYMBOL_WXING_FEATURE_NAMES.length }, () => 0);
  const primary = new Set(["日干", "日支", "时干", "时支"]);
  for (const h of symbolWuxingHits(chart, palace)) {
    if (!primary.has(h.agent)) continue;
    if (h.rel !== "生我" && h.rel !== "克我") continue;
    const base = h.kind === "神" ? 0 : h.kind === "门" ? 4 : 8;
    let off = -1;
    if (h.polarity === "吉" && h.rel === "生我") off = 0;
    else if (h.polarity === "吉" && h.rel === "克我") off = 1;
    else if (h.polarity === "凶" && h.rel === "生我") off = 2;
    else if (h.polarity === "凶" && h.rel === "克我") off = 3;
    if (off >= 0) x[base + off] = 1;
  }
  return x;
}
