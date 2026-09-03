import { wuxingRelation } from "./calendar";
import {
  BRANCH_CHONG,
  BRANCH_ELEMENT,
  BRANCH_HAI,
  BRANCH_SIX_HE,
  SELF_XING,
  STEM_CHONG,
  STEM_ELEMENT,
  STEM_HE,
  XING_GROUPS,
} from "./constants";
import type { Palace, QimenChart, ScoreFactor } from "./types";

export const PILLAR_ROLE: Record<"year" | "month" | "day" | "hour", { name: string; who: string; scale: number }> = {
  year: { name: "年", who: "长者、领导、主考官", scale: 0.72 },
  month: { name: "月", who: "朋友、亲戚、同僚", scale: 0.88 },
  day: { name: "日", who: "自己、当事主体", scale: 1.18 },
  hour: { name: "时", who: "事情顺逆、当下气机", scale: 1.28 },
};

const PILLAR_KEYS = ["year", "month", "day", "hour"] as const;

export function isXing(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return SELF_XING.has(a);
  return XING_GROUPS.some((g) => g.includes(a) && g.includes(b));
}

function earthBranches(palace: Palace): string[] {
  const set = new Set<string>();
  if (palace.branch) set.add(palace.branch);
  for (const b of palace.branches ?? []) if (b) set.add(b);
  return [...set];
}

export const PILLAR_FEATURE_NAMES = [
  "年支合地盘",
  "年支冲地盘",
  "年支刑地盘",
  "月支合地盘",
  "月支冲地盘",
  "月支刑地盘",
  "日支合地盘",
  "日支冲地盘",
  "日支刑地盘",
  "时支合地盘",
  "时支冲地盘",
  "时支刑地盘",
  "日时支合",
  "日时支冲",
  "日时支刑",
  "日时支害",
  "日干合地盘",
  "日干克地盘",
  "时干合地盘",
  "时干克地盘",
] as const;
