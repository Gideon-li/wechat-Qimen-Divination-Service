/** 把门星神与总断翻成大白话，给智断「三、吉凶提示与建议」用。 */

const GATE_PLAIN: Record<string, { mean: string; yi: string; ji: string }> = {
  开门: { mean: "开门就是门开了、路通了", yi: "出门办事、见人、递材料", ji: "偷偷摸摸、把话说死" },
  休门: { mean: "休门主歇一歇、聚一聚", yi: "求财、养病、把人请来", ji: "硬闯、强争" },
  生门: { mean: "生门主有生机、能生发", yi: "求财、安家、把事情做起来", ji: "办丧、动硬的" },
  伤门: { mean: "伤门主磕碰、争执、破耗", yi: "讨债、了断旧账", ji: "新开张、远行、成亲" },
  杜门: { mean: "杜门主关着、藏着、消息不通", yi: "避风头、少露面", ji: "张扬求名、开张远行" },
  景门: { mean: "景门主文书、考试、名声、亮相", yi: "投书、考试、发文", ji: "远行求财、把身家押上去" },
  死门: { mean: "死门主停住、收束、没有进路", yi: "收尾、了结", ji: "求进、开张、成亲" },
  惊门: { mean: "惊门主惊吓、口舌、官司", yi: "把争议说清楚", ji: "图安稳、远行上官" },
};

const GOD_PLAIN: Record<string, string> = {
  值符: "值符像主事的人、能拍板的贵人",
  腾蛇: "腾蛇主虚惊、反复、心里打鼓",
  太阴: "太阴宜暗处商量，不宜大张旗鼓",
  六合: "六合主因人成事、合伙说合",
  白虎: "白虎主刚猛、伤灾、冲撞",
  玄武: "玄武主暗昧、走失、耗损",
  九地: "九地宜守、宜缓、就地生发",
  九天: "九天宜公开进取、往高处走",
};

const STAR_PLAIN: Record<string, string> = {
  天蓬: "天蓬过程容易乱、费力，或有耗损",
  天芮: "天芮过程慢、容易生病或遇小人",
  天冲: "天冲来得急，宜快刀，不宜拖",
  天辅: "天辅有文书、贵人、办法",
  天禽: "天禽居中，枢纽还在自己手里",
  天心: "天心有主意，能调和、能看病症",
  天柱: "天柱易破、口舌、撑不住",
  天任: "天任稳，事情托得住",
  天英: "天英表面光鲜，里头燥，防争",
};

const LEVEL_PLAIN: Record<string, string> = {
  大吉: "总断大吉，这课整体很顺，像顺水推舟。仍要自己动手，不是天上掉馅饼。",
  吉: "总断为吉，事情有成算，阻力不大，按正路去办即可。",
  小吉: "总断小吉，不是稳赢，是能往前走、有人肯搭把手的那种顺。宜主动，但别把话说满。",
  平: "总断为平，可成可不成。关键看你动不动、门路选得对不对，宜择吉门方位再动手。",
  小凶: "总断小凶，不是大祸，是阻力、口舌、反复这类麻烦。宜收不宜猛冲。",
  凶: "总断为凶，这一课阻力明显。宜守、宜改期，先把已有的事收稳。",
  大凶: "总断大凶，这课很不顺。大事宜停，少签字、少远行，先避过这一阵。",
};

const PATTERN_PLAIN: Record<string, string> = {
  青龙反首: "古辞青龙反首：动作少阻碍，求谋容易顺。",
  飞鸟跌穴: "古辞飞鸟跌穴：有贵人提携、事情落得实地。",
  青龙逃走: "古辞青龙逃走：财物易散、人易走，宜看紧合同和人手。",
  白虎猖狂: "古辞白虎猖狂：防伤灾、冲撞、尊长不喜。",
  朱雀投江: "古辞朱雀投江：口舌官司、音信容易沉，文件要回执。",
  螣蛇夭矫: "古辞螣蛇夭矫：虚惊怪异、文书官司，宜少听闲话。",
  太白入荧: "古辞太白入荧：客来欺主，防被人抢先。",
  荧入太白: "古辞荧入太白：对方要走，门户仍防破耗。",
  值符飞宫: "古辞值符飞宫：吉事也不稳，凶事更凶，宜改期。",
  太白擒龙: "古辞太白擒龙：百事不宜谋，先停一停。",
  三奇吉门: "三奇临吉门，古法以为万事可开，仍要人去办。",
  天遁: "天遁之象，宜进取名位，公开去求。",
  地遁: "地遁之象，宜置业藏形，把根基先打好。",
  人遁: "人遁之象，宜密谋求人，不宜张扬。",
  五不遇时: "五不遇时，时辰不对，换个时辰再办更稳。",
};

export type LuckPlainInput = {
  eventName: string;
  subject?: string;
  level: string;
  score: number;
  probability?: number;
  bagua?: string;
  god?: string | null;
  star?: string;
  gate?: string | null;
  kong?: boolean;
  fuYin?: boolean;
  fanYin?: boolean;
  patterns?: string[];
};

export function luckPlainAdvice(input: LuckPlainInput): string {
  const who = input.subject?.trim() ? `就「${input.subject}」问「${input.eventName}」` : `问「${input.eventName}」`;
  const sign = input.score > 0 ? `+${input.score}` : String(input.score);
  const pct = input.probability != null ? `，顺利倾向大约 ${input.probability}%` : "";
  const head = LEVEL_PLAIN[input.level] ?? `总断${input.level}（${sign}）。`;
  const first = `${who}。总断${input.level}（${sign}${pct}）。${head}`;

  const bits: string[] = [];
  if (input.gate && GATE_PLAIN[input.gate]) {
    const g = GATE_PLAIN[input.gate];
    bits.push(`${g.mean}：宜${g.yi}，忌${g.ji}。`);
  }
  if (input.star && STAR_PLAIN[input.star]) bits.push(`${STAR_PLAIN[input.star]}。`);
  if (input.god && GOD_PLAIN[input.god]) bits.push(`${GOD_PLAIN[input.god]}。`);
  const palace = [input.bagua, input.god, input.star, input.gate].filter(Boolean).join("、");
  const second = palace
    ? `用神宫见${palace}。${bits.join("")}合在一起，就是用这些象来断这一课的吉凶。`
    : bits.join("");

  const extra: string[] = [];
  for (const p of input.patterns ?? []) {
    if (PATTERN_PLAIN[p]) extra.push(PATTERN_PLAIN[p]);
  }
  if (input.kong) extra.push("用神落空，名字好听也容易落空，合同、款项宜留尾巴。");
  if (input.fuYin) extra.push("全盘伏吟，事情爱原地打转，改约、搬家、换岗多反复。");
  if (input.fanYin) extra.push("全盘反吟，对面的人、反向的条件忽然出现，计划容易被推翻。");

  const yi = input.gate && GATE_PLAIN[input.gate] ? GATE_PLAIN[input.gate].yi : "择吉门方位、把该做的正事做了";
  const ji = input.gate && GATE_PLAIN[input.gate] ? GATE_PLAIN[input.gate].ji : "把话说满、一次求太大的结果";
  const lucky = input.level.includes("吉");
  const bad = input.level.includes("凶");
  const tip = lucky
    ? `建议：宜${yi}。仍留一点余地，忌${ji}。`
    : bad
      ? `建议：先守、少争。忌${ji}。若必须动，只办眼前这一件，不铺新摊子。`
      : `建议：可静可动。动则宜${yi}，静则等值符得令、空亡填实再办。`;

  return [first, second, extra.join(""), tip, "此为盘面卦辞的白话，供学习参考，不是定论。"]
    .filter(Boolean)
    .join("\n");
}

/** 去掉模型自己写的第三段，改挂盘面算出的白话吉凶。 */
export function withLuckAdvice(text: string, advice: string): string {
  const body = text.replace(/\n*三[、.．:].*$/s, "").trim();
  return `${body}\n\n三、吉凶提示与建议\n${advice}`.trim();
}
