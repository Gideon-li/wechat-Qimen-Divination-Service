import { GATE_CLASSIC, STAR_SONG, type ClassicPattern } from "./classic";
import { extractSymbolPack } from "./extract";
import { assocHints, type SubjectKind } from "./subject";
import type { EventId, EventScore, LuckLevel, Palace, QimenChart } from "./types";

const HOUR_OMEN: Record<string, Record<string, string>> = {
  天蓬: {
    子: "鸡鸣犬吠、宿鸟闹林，口舌官讼之象",
    午: "持刀上山、青衣童子，防破财人口",
    酉: "西方马行、群鸦飞噪，或有横财僧道作牙",
  },
  天芮: {
    子: "飞禽西南火光，春夏用凶秋冬差可",
    卯: "女人送物、贵人骑马，防产难",
    未: "捕猎人、白衣僧道，防瘟火",
  },
  天冲: {
    子: "仙禽鸣噪、钟声，田蚕或因口舌得财",
    午: "东方火起、白衣叫喊，或拾古器",
    亥: "跛足青衣、东方火光，进田契之象",
  },
  天辅: {
    子: "红衣大叫自西来，进商音财物、加官进职",
    卯: "女人持伞、师巫吹角，因女人公事进产",
    午: "僧人拿物、红衣女人，贵人送异物",
  },
  天禽: {
    子: "孕妇紫衣人至，因武得官、人丁财旺",
    午: "白衣女人、狗衔花，因赌戏公事得财",
    酉: "西方火起鼓声喧闹，年内生贵子",
  },
  天心: {
    子: "争斗鼓声西北，赤面人作牙进古器",
    午: "风雨骤至、蛇横路、红裙提酒",
    戌: "南方喊贼、小儿牵牛，或有科第之象",
  },
  天柱: {
    子: "风雨东方火起，蛇犬咬人、血光破财",
    申: "鹰捕鸟、青衣携盖，防火焚宅",
    亥: "西方钟声、山下人喊，或因救火得财",
  },
  天任: {
    子: "风雨水畔鸡鸣，妇人离异、水姓抵赖",
    午: "西方黄鸟、僧道儒士同行，得贵人财宝",
    酉: "僧尼持火、北方钟鼓，官员财物牛马",
  },
  天英: {
    子: "锣声西北、伐木掌火，残病人上门",
    午: "南方红衣骑马持文书，防木石人命",
    酉: "西方吵闹、白衣女人，唇舌得财或足疾",
  },
};

const GOD_OMEN: Record<string, string> = {
  值符: "天乙在门，贵人车马，长者欢欣",
  腾蛇: "虚惊怪异，半途而回，风雨相阻",
  太阴: "小求大得，阴私和合，音乐相随",
  六合: "路逢车马，阴人彩衣，儿童戏耍",
  白虎: "见死闻悲，官事惊迫，途逢兵革",
  玄武: "盗贼亡失，牙侩乞儿，暗昧走失",
  九地: "宜伏匿、守静、就地生发",
  九天: "宜扬兵、高举、公开进取",
};

function pick<T>(arr: T[], i: number): T {
  return arr[Math.abs(i) % arr.length]!;
}

export function buildAssociations(
  chart: QimenChart,
  palace: Palace,
  eventId: EventId,
  level: LuckLevel,
  patterns: ClassicPattern[],
  ctx?: { subjectKind?: SubjectKind; subjectLabel?: string },
): string[] {
  const hints = assocHints(eventId, ctx?.subjectKind ?? "person");
  const lucky = level.includes("吉");
  const bad = level.includes("凶");
  const hour = chart.pillars.hour.branch;
  const items: string[] = [];

  const omen = HOUR_OMEN[palace.star]?.[hour];
  if (omen) items.push(`时象：${palace.star}值${hour}时，${omen}。`);

  if (palace.god && GOD_OMEN[palace.god]) {
    items.push(`神象：${GOD_OMEN[palace.god]}。`);
  }

  const g = palace.gate ? GATE_CLASSIC[palace.gate] : null;
  if (g) {
    items.push(lucky ? `门宜：${g.yi}。` : `门忌：${g.ji}。`);
  }

  const ge = patterns.find((p) =>
    ["青龙反首", "飞鸟跌穴", "青龙逃走", "白虎猖狂", "朱雀投江", "螣蛇夭矫", "太白入荧", "荧入太白", "五不遇时"].includes(
      p.name,
    ),
  );
  if (ge) items.push(`格局：${ge.name}。${ge.detail}`);

  if (lucky) {
    items.push(`此事较顺时，或见：${hints[0]}；亦可能：${hints[1]}。`);
  } else if (bad) {
    items.push(`此事多阻时，或见：${hints[2]}；亦须防：${hints[3]}。`);
  } else {
    items.push(`平局：可成可不成。若动，取吉门方位；若静，待值符得令。`);
  }

  if (palace.isKong) items.push("用神空亡，事成亦虚，合同、款项、承诺宜留尾款、留字据。");
  if (chart.meta.fuYin) items.push("全盘伏吟，本旬宜守旧，改约、搬家、换岗多反复。");
  if (chart.meta.fanYin) items.push("全盘反吟，对面人、对冲地、反向条件忽然出现。");

  const pack = extractSymbolPack(chart, palace, eventId, level);
  for (const line of pack.lines.slice(0, 3)) items.push(line);

  return uniqueKeep(items).slice(0, 8);
}

function uniqueKeep(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

export function composeClassicReading(
  chart: QimenChart,
  palace: Palace,
  eventName: string,
  score: number,
  level: LuckLevel,
  phases: { start: number; process: number; end: number },
  patterns: ClassicPattern[],
  associations: string[],
  subject?: string,
): string {
  const who = subject ? `以「${subject}」为「我」，问「${eventName}」` : `问「${eventName}」`;
  const g = palace.gate ? GATE_CLASSIC[palace.gate] : null;
  const star = STAR_SONG[palace.star] ?? palace.star;
  const pat = patterns[0];
  const begin =
    phases.start >= 4 ? "起手先得神助" : phases.start <= -4 ? "起手已见惊疑或刚猛" : "起手平平";
  const mid =
    phases.process >= 4 ? "过程有谋有辅" : phases.process <= -4 ? "过程费力、宜防小人灾病" : "过程不疾不徐";
  const fin =
    phases.end >= 4 ? "收局门吉，事可落地" : phases.end <= -4 ? "收局门凶，宜止不宜进" : "收局含混，宜留余地";

  const cite = pat ? `《秘笈》格局见「${pat.name}」。` : "《烟波钓叟歌》：吉门偶合三奇，万事开三万事宜。";
  const assoc = associations[0] ? associations[0] : "";
  const sign = score > 0 ? `顺利倾向偏正（${score}）` : score < 0 ? `阻力偏显（${score}）` : "吉凶相抵";

  return [
    `${who}，用神在${palace.bagua}${palace.id}宫，${palace.god ?? "无神"} / ${palace.star} / ${palace.gate ?? "无门"}。${sign}，总断${level}。`,
    `神应开始、星应过程、门应收局：${begin}；${mid}；${fin}。`,
    g ? `${g.song}` : star,
    cite,
    assoc,
  ]
    .filter(Boolean)
    .join("");
}

export function enrichEventScore(
  chart: QimenChart,
  palace: Palace,
  eventId: EventId,
  base: Omit<EventScore, "associations" | "omen" | "classicCite"> & { reading: string },
  patterns: ClassicPattern[],
  ctx?: { subjectKind?: SubjectKind; subjectLabel?: string },
): EventScore {
  const associations = buildAssociations(chart, palace, eventId, base.level, patterns, ctx);
  const omen =
    HOUR_OMEN[palace.star]?.[chart.pillars.hour.branch] ??
    (palace.god ? GOD_OMEN[palace.god] ?? "" : "");
  const classicCite = palace.gate
    ? GATE_CLASSIC[palace.gate]!.song
    : STAR_SONG[palace.star] ?? "刘基《奇门遁甲总序》";
  const reading = composeClassicReading(
    chart,
    palace,
    base.name,
    base.score,
    base.level,
    { start: base.phases.start.score, process: base.phases.process.score, end: base.phases.end.score },
    patterns,
    associations,
    ctx?.subjectLabel,
  );
  return { ...base, reading, associations, omen, classicCite };
}
