import { BOARD_ORDER, EVENTS, PALACE_META } from "./constants";
import { EVENT_FOCUS, SYMBOL_BY_NAME, type SymbolEntry } from "./symbols";
import type { EventId, LuckLevel, Palace, PalaceId, QimenChart } from "./types";

export type ExtractedToken = {
  name: string;
  kind: SymbolEntry["kind"];
  essence: string;
  images: string[];
};

export type SymbolPack = {
  tokens: ExtractedToken[];
  people: string[];
  places: string[];
  things: string[];
  times: string[];
  lines: string[];
  prompt: string;
  brief: string;
};

function polarity(level: LuckLevel): "lucky" | "unlucky" | "mixed" {
  if (level.includes("吉")) return "lucky";
  if (level.includes("凶")) return "unlucky";
  return "mixed";
}

function imagesOf(entry: SymbolEntry, pol: ReturnType<typeof polarity>): string[] {
  if (pol === "lucky") return entry.lucky;
  if (pol === "unlucky") return entry.unlucky;
  return [...entry.lucky.slice(0, 1), ...entry.unlucky.slice(0, 1)];
}

function unique(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    if (!x || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function tokenOf(name: string | null | undefined, pol: ReturnType<typeof polarity>): ExtractedToken | null {
  if (!name) return null;
  const e = SYMBOL_BY_NAME[name];
  if (!e) return null;
  return { name: e.name, kind: e.kind, essence: e.essence, images: imagesOf(e, pol) };
}

export function chartBrief(chart: QimenChart): string {
  return BOARD_ORDER.map((id) => {
    const p = chart.palaces[id];
    const flags = [
      p.isZhiFu ? "值符" : "",
      p.isZhiShi ? "值使" : "",
      p.isKong ? "空" : "",
      p.isMa ? "马" : "",
      p.fuYin ? "伏吟" : "",
      p.fanYin ? "反吟" : "",
      p.ruMu ? "墓" : "",
    ]
      .filter(Boolean)
      .join("");
    return `${p.bagua}${p.id}${p.direction} ${p.god ?? "—"} ${p.star} ${p.gate ?? "中"} 天${p.heavenStem}地${p.earthStem}${p.changsheng ? " " + p.changsheng : ""}${flags ? " " + flags : ""}`;
  }).join("；");
}

export function extractSymbolPack(
  chart: QimenChart,
  palace: Palace,
  eventId: EventId,
  level: LuckLevel,
  extra?: { subjectLine?: string; eventTitle?: string },
): SymbolPack {
  const pol = polarity(level);
  const names = [
    palace.bagua,
    palace.star,
    palace.gate,
    palace.god,
    palace.heavenStem,
    palace.earthStem,
    palace.changsheng,
    chart.pillars.hour.branch,
    chart.pillars.day.branch,
    palace.isKong ? "空亡" : null,
    palace.isMa ? "驿马" : null,
    palace.fuYin || chart.meta.fuYin ? "伏吟" : null,
    palace.fanYin || chart.meta.fanYin ? "反吟" : null,
    palace.menPo ? "门迫" : null,
    palace.ruMu ? "入墓" : null,
    palace.jiXing ? "击刑" : null,
  ];
  const tokens = unique(names.filter(Boolean) as string[])
    .map((n) => tokenOf(n, pol))
    .filter((t): t is ExtractedToken => Boolean(t));

  const focus = EVENT_FOCUS[eventId];
  const people = unique([...tokens.flatMap((t) => SYMBOL_BY_NAME[t.name]?.people ?? []), ...focus.people]);
  const places = unique([...tokens.flatMap((t) => SYMBOL_BY_NAME[t.name]?.places ?? []), ...focus.places]);
  const things = unique([...tokens.flatMap((t) => SYMBOL_BY_NAME[t.name]?.things ?? []), ...focus.things]);
  const times = unique([...tokens.flatMap((t) => SYMBOL_BY_NAME[t.name]?.times ?? []), ...focus.times]);

  const lines: string[] = [];
  for (const t of tokens.slice(0, 8)) {
    const img = t.images[0];
    if (!img) continue;
    const who = SYMBOL_BY_NAME[t.name]?.people[0];
    const where = SYMBOL_BY_NAME[t.name]?.places[0];
    if (pol === "lucky") {
      lines.push(`${t.name}（${t.essence}）：或见${who ?? "其人"}于${where ?? "其地"}，象曰「${img}」。`);
    } else if (pol === "unlucky") {
      lines.push(`${t.name}（${t.essence}）：须防${who ?? "其人"}在${where ?? "其地"}，象曰「${img}」。`);
    } else {
      lines.push(`${t.name}：可成可不成。吉则${t.images[0] ?? "小成"}，凶则${t.images[1] ?? "小阻"}。`);
    }
  }

  const ev = EVENTS.find((e) => e.id === eventId)?.name ?? eventId;
  const prompt = [
    extra?.subjectLine ? extra.subjectLine : "",
    `事项：${extra?.eventTitle ?? ev}；总断${level}。`,
    `用神：${palace.bagua}${palace.id}宫${palace.direction}，神${palace.god ?? "无"}星${palace.star}门${palace.gate ?? "无"}，天${palace.heavenStem}地${palace.earthStem}${palace.changsheng ? " " + palace.changsheng : ""}。`,
    `值符在${PALACE_META[chart.meta.zhiFuPalace].bagua}${chart.meta.zhiFuPalace}宫，值使${chart.meta.zhiShiGate}。`,
    `干支：${chart.pillars.year.name} ${chart.pillars.month.name} ${chart.pillars.day.name} ${chart.pillars.hour.name}。${chart.ju.label}。`,
    `象征（按吉凶已筛选）：`,
    ...tokens.map((t) => `- ${t.name}｜${t.kind}｜${t.essence}｜象：${t.images.join("、")}`),
    `人物词：${people.slice(0, 10).join("、")}`,
    `地点词：${places.slice(0, 10).join("、")}`,
    `事物词：${things.slice(0, 10).join("、")}`,
    `时间词：${times.slice(0, 8).join("、")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    tokens,
    people: people.slice(0, 12),
    places: places.slice(0, 12),
    things: things.slice(0, 12),
    times: times.slice(0, 10),
    lines: lines.slice(0, 8),
    prompt,
    brief: chartBrief(chart),
  };
}

export function palaceOf(chart: QimenChart, id: PalaceId): Palace {
  return chart.palaces[id];
}
