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
import type { GanzhiFlag, Palace, QimenChart } from "./types";

export const PILLAR_ROLE: Record<"year" | "month" | "day" | "hour", { name: string; who: string; scale: number }> = {
  year: { name: "年", who: "长者、领导、主考官", scale: 0.72 },
  month: { name: "月", who: "朋友、亲戚、同僚", scale: 0.88 },
  day: { name: "日", who: "自己、当事主体", scale: 1.2 },
  hour: { name: "时", who: "事情顺逆、当下气机", scale: 1.32 },
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
  "日时支克",
  "日干合地盘",
  "日干克地盘",
  "时干合地盘",
  "时干克地盘",
] as const;

const BASE = { he: 10, chong: -12, xing: -10, hai: -8, ke: -9, sheng: 7 } as const;

function scaled(kind: keyof typeof BASE, pillar: (typeof PILLAR_KEYS)[number]): number {
  return Math.round(BASE[kind] * PILLAR_ROLE[pillar].scale);
}

function anyBranch(pred: (b: string) => boolean, earth: string[]): boolean {
  return earth.some(pred);
}

export function extractPillarFeatures(chart: QimenChart, palace: Palace): number[] {
  const earth = earthBranches(palace);
  const earthStem = palace.earthStem;
  const y = chart.pillars.year.branch;
  const m = chart.pillars.month.branch;
  const d = chart.pillars.day.branch;
  const h = chart.pillars.hour.branch;
  const dayStem = chart.pillars.day.stem;
  const hourStem = chart.pillars.hour.stem;
  const hit = (pillarBr: string, kind: "he" | "chong" | "xing") => {
    if (!earth.length || !pillarBr) return 0;
    if (kind === "he") return anyBranch((b) => BRANCH_SIX_HE[pillarBr] === b, earth) ? 1 : 0;
    if (kind === "chong") return anyBranch((b) => BRANCH_CHONG[pillarBr] === b, earth) ? 1 : 0;
    return anyBranch((b) => isXing(pillarBr, b), earth) ? 1 : 0;
  };
  const stemHe = (stem: string) => (earthStem && STEM_HE[stem] === earthStem ? 1 : 0);
  const stemKe = (stem: string) => {
    if (!earthStem) return 0;
    return wuxingRelation(STEM_ELEMENT[earthStem] ?? "", STEM_ELEMENT[stem] ?? "") === "克我" ? 1 : 0;
  };
  const dayEl = BRANCH_ELEMENT[d] ?? "";
  const hourEl = BRANCH_ELEMENT[h] ?? "";
  const dayHourKe =
    dayEl && hourEl && (wuxingRelation(dayEl, hourEl) === "我克" || wuxingRelation(dayEl, hourEl) === "克我") ? 1 : 0;
  return [
    hit(y, "he"),
    hit(y, "chong"),
    hit(y, "xing"),
    hit(m, "he"),
    hit(m, "chong"),
    hit(m, "xing"),
    hit(d, "he"),
    hit(d, "chong"),
    hit(d, "xing"),
    hit(h, "he"),
    hit(h, "chong"),
    hit(h, "xing"),
    d && h && BRANCH_SIX_HE[d] === h ? 1 : 0,
    d && h && BRANCH_CHONG[d] === h ? 1 : 0,
    d && h && isXing(d, h) ? 1 : 0,
    d && h && BRANCH_HAI[d] === h ? 1 : 0,
    dayHourKe,
    stemHe(dayStem),
    stemKe(dayStem),
    stemHe(hourStem),
    stemKe(hourStem),
  ];
}

export function pillarEarthFlags(chart: QimenChart, palace: Palace): GanzhiFlag[] {
  const flags: GanzhiFlag[] = [];
  const earth = earthBranches(palace);
  const earthStem = palace.earthStem;
  const earthLabel = `${earthStem || "—"}${earth.join("") || ""}`;

  for (const key of PILLAR_KEYS) {
    const role = PILLAR_ROLE[key];
    const pillar = chart.pillars[key];
    const br = pillar.branch;
    const st = pillar.stem;
    if (br && earth.length) {
      if (anyBranch((b) => BRANCH_SIX_HE[br] === b, earth)) {
        flags.push({
          label: `${role.name}支合地盘`,
          kind: "合",
          detail: `${role.name}支${br}合地盘${earthLabel}。${role.who}这边有助力、能说上话`,
          weight: scaled("he", key),
        });
      }
      if (anyBranch((b) => BRANCH_CHONG[br] === b, earth)) {
        flags.push({
          label: `${role.name}支冲地盘`,
          kind: "冲",
          detail: `${role.name}支${br}冲地盘${earthLabel}。${role.who}这边波动、对峙、事情易搬动`,
          weight: scaled("chong", key),
        });
      }
      if (anyBranch((b) => isXing(br, b), earth)) {
        flags.push({
          label: `${role.name}支刑地盘`,
          kind: "刑",
          detail: `${role.name}支${br}刑地盘${earthLabel}。${role.who}这边纠葛、别扭、不顺`,
          weight: scaled("xing", key),
        });
      }
      if (anyBranch((b) => BRANCH_HAI[br] === b, earth)) {
        flags.push({
          label: `${role.name}支害地盘`,
          kind: "害",
          detail: `${role.name}支${br}害地盘${earthLabel}。${role.who}这边暗损、猜疑`,
          weight: scaled("hai", key),
        });
      }
      for (const b of earth) {
        const rel = wuxingRelation(BRANCH_ELEMENT[b] ?? "", BRANCH_ELEMENT[br] ?? "");
        if (rel === "克我") {
          flags.push({
            label: `${role.name}支克地盘`,
            kind: "克",
            detail: `${role.name}支${br}克地盘${b}。${role.who}对这件事形成压力`,
            weight: scaled("ke", key),
          });
          break;
        }
        if (rel === "生我") {
          flags.push({
            label: `${role.name}支生地盘`,
            kind: "生",
            detail: `${role.name}支${br}生地盘${b}。${role.who}给这件事添气`,
            weight: scaled("sheng", key),
          });
          break;
        }
      }
    }
    if (st && earthStem) {
      if (STEM_HE[st] === earthStem) {
        flags.push({
          label: `${role.name}干合地盘`,
          kind: "合",
          detail: `${role.name}干${st}合地盘${earthStem}。${role.who}与用神相合`,
          weight: Math.round(scaled("he", key) * 0.85),
        });
      }
      if (STEM_CHONG[st] === earthStem) {
        flags.push({
          label: `${role.name}干冲地盘`,
          kind: "冲",
          detail: `${role.name}干${st}冲地盘${earthStem}。${role.who}与用神对冲`,
          weight: Math.round(scaled("chong", key) * 0.85),
        });
      }
      const rel = wuxingRelation(STEM_ELEMENT[earthStem] ?? "", STEM_ELEMENT[st] ?? "");
      if (rel === "克我") {
        flags.push({
          label: `${role.name}干克地盘`,
          kind: "克",
          detail: `${role.name}干${st}克地盘${earthStem}。${role.who}克制用神`,
          weight: Math.round(scaled("ke", key) * 0.9),
        });
      } else if (rel === "生我") {
        flags.push({
          label: `${role.name}干生地盘`,
          kind: "生",
          detail: `${role.name}干${st}生地盘${earthStem}。${role.who}生助用神`,
          weight: Math.round(scaled("sheng", key) * 0.9),
        });
      }
    }
  }

  const day = chart.pillars.day;
  const hour = chart.pillars.hour;
  if (day.branch && hour.branch) {
    if (BRANCH_SIX_HE[day.branch] === hour.branch) {
      flags.push({
        label: "日时支合",
        kind: "合",
        detail: `日支${day.branch}合时支${hour.branch}。自己与当下这件事相合，事情容易顺`,
        weight: 14,
      });
    }
    if (BRANCH_CHONG[day.branch] === hour.branch) {
      flags.push({
        label: "日时支冲",
        kind: "冲",
        detail: `日支${day.branch}冲时支${hour.branch}。自己与事情对冲，当日易反复、变动`,
        weight: -16,
      });
    }
    if (isXing(day.branch, hour.branch)) {
      flags.push({
        label: "日时支刑",
        kind: "刑",
        detail: `日支${day.branch}刑时支${hour.branch}。自己与事情相刑，过程别扭、口舌`,
        weight: -13,
      });
    }
    if (BRANCH_HAI[day.branch] === hour.branch) {
      flags.push({
        label: "日时支害",
        kind: "害",
        detail: `日支${day.branch}害时支${hour.branch}。自己与事情相害，易暗耗、误会`,
        weight: -11,
      });
    }
    const relB = wuxingRelation(BRANCH_ELEMENT[day.branch] ?? "", BRANCH_ELEMENT[hour.branch] ?? "");
    if (relB === "我克") {
      flags.push({
        label: "日时支克",
        kind: "克",
        detail: `日支${day.branch}克时支${hour.branch}。自己压得住这件事，宜主动`,
        weight: 6,
      });
    } else if (relB === "克我") {
      flags.push({
        label: "日时支被克",
        kind: "克",
        detail: `时支${hour.branch}克日支${day.branch}。事情压过自己，宜守、宜改期`,
        weight: -12,
      });
    }
  }
  if (day.stem && hour.stem) {
    if (STEM_HE[day.stem] === hour.stem) {
      flags.push({
        label: "日时干合",
        kind: "合",
        detail: `日干${day.stem}合时干${hour.stem}。人与事相合，利于拍板`,
        weight: 11,
      });
    }
    const relS = wuxingRelation(STEM_ELEMENT[day.stem] ?? "", STEM_ELEMENT[hour.stem] ?? "");
    if (relS === "我克") {
      flags.push({
        label: "日时干克",
        kind: "克",
        detail: `日干${day.stem}克时干${hour.stem}。自己压事，宜快办`,
        weight: 5,
      });
    } else if (relS === "克我") {
      flags.push({
        label: "日时干被克",
        kind: "克",
        detail: `时干${hour.stem}克日干${day.stem}。事情克身，当日不顺`,
        weight: -10,
      });
    }
  }
  return flags;
}
