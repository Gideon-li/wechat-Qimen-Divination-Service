import { STEM_ELEMENT } from "./constants";
import { wuxingRelation } from "./calendar";
import type { EventId, Palace, QimenChart } from "./types";

/** 三位数（或任意数字）连加至 1–9，即求签定局。168→1+6+8=15→1+5=6。 */
export function digitRootToJu(raw: string): { ju: number; steps: string[]; source: string } {
  const source = raw.replace(/\D/g, "").slice(0, 6);
  if (!source) return { ju: 1, steps: [], source: "" };
  const steps: string[] = [];
  let n = [...source].reduce((s, d) => s + Number(d), 0);
  steps.push(`${[...source].join("+")}=${n}`);
  while (n > 9) {
    const s = String(n);
    const next = [...s].reduce((a, d) => a + Number(d), 0);
    steps.push(`${[...s].join("+")}=${next}`);
    n = next;
  }
  return { ju: n === 0 ? 9 : n, steps, source };
}

export type ClassicPattern = { name: string; weight: number; detail: string };

export const STEM_GE: Record<string, { name: string; weight: number; detail: string }> = {
  甲丙: { name: "青龙反首", weight: 18, detail: "甲加丙，动作无阻，求谋多遂（《烟波钓叟歌》）" },
  丙甲: { name: "飞鸟跌穴", weight: 18, detail: "丙加甲，运用有成，贵人提携" },
  戊丙: { name: "青龙反首", weight: 16, detail: "值符加丙，青龙返首，宜动不宜静" },
  丙戊: { name: "飞鸟跌穴", weight: 16, detail: "月奇加值符，谋为洞彻" },
  乙辛: { name: "青龙逃走", weight: -16, detail: "乙加辛，财物废坠、奴仆走失" },
  辛乙: { name: "白虎猖狂", weight: -16, detail: "辛加乙，身体毁伤、尊长不喜" },
  丁癸: { name: "朱雀投江", weight: -14, detail: "丁加癸，讼狱口舌、音信沉溺" },
  癸丁: { name: "螣蛇夭矫", weight: -14, detail: "癸加丁，忧惶怪异、文书官司" },
  庚丙: { name: "太白入荧", weight: -12, detail: "庚加丙，贼必来，客进主破" },
  丙庚: { name: "荧入太白", weight: -10, detail: "丙加庚，贼必去，门户破耗" },
  甲庚: { name: "值符飞宫", weight: -10, detail: "值符加庚，吉事不吉，凶事更凶" },
  庚甲: { name: "太白擒龙", weight: -12, detail: "庚加值符，百事不可谋为" },
  乙己: { name: "日奇入雾", weight: -6, detail: "乙加己，被土暗昧；得吉门则为地遁" },
  丁己: { name: "朱雀入墓", weight: -8, detail: "丁加己，文状词讼，先曲后直" },
  己丁: { name: "火入勾陈", weight: -7, detail: "己加丁，奸私仇冤，事因女人" },
};

function stemKey(h: string, e: string) {
  return `${h}${e}`;
}

/** 《秘笈》十干尅应 + 九遁三诈 + 反伏吟墓迫。 */
export function detectClassicPatterns(chart: QimenChart, palace: Palace): ClassicPattern[] {
  const out: ClassicPattern[] = [];
  const h = palace.heavenStem;
  const e = palace.earthStem;
  const gate = palace.gate;
  const god = palace.god;
  const star = palace.star;
  const hourBr = chart.pillars.hour.branch;
  const dayStem = chart.pillars.day.stem;
  const hourStem = chart.pillars.hour.stem;

  const ge = STEM_GE[stemKey(h, e)];
  if (ge) out.push(ge);

  if (h && ["乙", "丙", "丁"].includes(h) && gate && ["开门", "休门", "生门"].includes(gate)) {
    out.push({ name: "三奇吉门", weight: 14, detail: `${h}奇临${gate}，万事开三皆宜（《总序》）` });
  }
  if (h === "丙" && gate === "生门" && (god === "九天" || e === "丁")) {
    out.push({ name: "天遁", weight: 14, detail: "生门六丙合六丁，得月精所蔽，宜进取名位" });
  }
  if (h === "乙" && gate === "开门") {
    out.push({ name: "地遁", weight: 12, detail: "开门六乙合六己，得日精所蔽，宜置业藏形" });
  }
  if (h === "丁" && god === "太阴" && gate === "休门") {
    out.push({ name: "人遁", weight: 12, detail: "休门六丁共太阴，宜密谋求人、合药祈禳" });
  }
  if (gate && ["开门", "休门", "生门"].includes(gate) && god === "太阴") {
    out.push({ name: "真诈", weight: 8, detail: "三吉门临太阴，利隐遁、祈祷（《三诈法》）" });
  }
  if (gate && ["开门", "休门", "生门"].includes(gate) && god === "六合") {
    out.push({ name: "休诈", weight: 8, detail: "三吉门临六合，宜合药、祭祀、和合" });
  }
  if (gate && ["开门", "休门", "生门"].includes(gate) && god === "九地") {
    out.push({ name: "重诈", weight: 8, detail: "三吉门临九地，宜纳财、进人口、拜授" });
  }

  const shi: Record<string, string> = { 乙: "戌午", 丙: "子申", 丁: "辰寅" };
  if (h && shi[h] && shi[h]!.includes(hourBr)) {
    out.push({ name: "三奇得使", weight: 12, detail: `${h}奇得使（乙逢犬马、丙鼠猴、丁龙虎），事半功倍` });
  }

  if (h === "丁" && (e === "戊" || e === "己" || e === "庚" || e === "辛" || e === "壬" || e === "癸")) {
    if (gate && ["开门", "休门", "生门"].includes(gate)) {
      out.push({ name: "玉女守门", weight: 6, detail: "三奇游六仪，阴私和合、密事可成" });
    }
  }

  if (palace.fuYin) out.push({ name: "伏吟", weight: -10, detail: "天蓬加着地天蓬，事多稽留反复，吉宿亦减（《烟波钓叟歌》）" });
  if (palace.fanYin) out.push({ name: "反吟", weight: -8, detail: "天蓬若到天英上，变动大、难安定" });
  if (palace.menPo) out.push({ name: "门迫", weight: -9, detail: "门制其宫是迫雄，行动受阻" });
  if (palace.gongPo) out.push({ name: "宫迫", weight: -5, detail: "宫制其门不为迫，环境压过行动" });
  if (palace.ruMu) out.push({ name: "入墓", weight: -10, detail: `三奇入墓或长生墓库，气收藏、难发用` });
  if (palace.jiXing) out.push({ name: "击刑", weight: -12, detail: "六仪击刑，此时举动可惮惧" });
  if (palace.isKong) out.push({ name: "空亡", weight: -8, detail: "旬空之力虚，事多空、宜缓" });
  if (palace.isMa) out.push({ name: "驿马", weight: 4, detail: "太冲天马，主移动、出行、变动" });

  const rel = wuxingRelation(STEM_ELEMENT[hourStem] ?? "", STEM_ELEMENT[dayStem] ?? "");
  if (rel === "我克") {
    out.push({ name: "五不遇时", weight: -14, detail: `时干${hourStem}克日干${dayStem}，号日月损光明，百事不利` });
  }

  if (star === "天辅" && gate === "景门") {
    out.push({ name: "文昌会景", weight: 8, detail: "天辅远行良，景上投书，利于考试文书" });
  }
  if (star === "天心" && (gate === "开门" || gate === "休门")) {
    out.push({ name: "天心得门", weight: 6, detail: "天心求仙合药当，商途客旅财禄昌" });
  }
  if (star === "天蓬" && gate === "休门") {
    out.push({ name: "蓬休同宫", weight: -2, detail: "天蓬本凶，得休门稍解，仍宜守不宜进" });
  }

  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)));
}

export const GATE_CLASSIC: Record<string, { yi: string; ji: string; song: string }> = {
  开门: {
    yi: "开张、远行、见贵、上官、求财、嫁娶、贸易",
    ji: "阴私、偷盗、逃亡（公开则泄）",
    song: "开门欲得照临来，奴婢牛羊百日廻。属金，天门，万物杀尽而复生。",
  },
  休门: {
    yi: "求财、进人口、谒贵、和合、治病、休息",
    ji: "争战、词讼强进",
    song: "休门最好聚资财，牛马猪羊自送来。属水，一阳复始，返本还源。",
  },
  生门: {
    yi: "求财、嫁娶、上官、修造、牧养、生产",
    ji: "吊丧、行刑",
    song: "生门临着吉星辰，人财资旺各称情。艮土开泰，万物皆生。",
  },
  伤门: {
    yi: "捕捉、渔猎、索债、赌博",
    ji: "上官、出行、嫁娶、商贾、修造、埋葬",
    song: "伤门不可说，夫妻主灾迍。木泄太过，以外华而内虚。",
  },
  杜门: {
    yi: "躲灾避难、塞穴、捕捉、隐形",
    ji: "求名、开张、远行张扬",
    song: "杜门原是木，犯者灾祸频。阳木力屈，宜藏形。",
  },
  景门: {
    yi: "上书献策、考试、破阵、火攻、封赏",
    ji: "远行、求财、嫁娶（次吉，不全吉）",
    song: "景门主血光，官符卖田庄。惟利文书之事。",
  },
  死门: {
    yi: "吊死、行刑、捕捉、畋猎、丧葬",
    ji: "求进、开张、嫁娶、上官",
    song: "元死之方最为凶。天地肃杀，顺天之序而用之。",
  },
  惊门: {
    yi: "词讼、捕捉、博戏、设疑、伏兵",
    ji: "出行、上官、求安稳",
    song: "惊门主争讼，瘟疫死人丁。气肃物老，不得已而杀。",
  },
};

export const STAR_SONG: Record<string, string> = {
  天蓬: "讼庭争竞遇天蓬，春夏用之皆大吉，秋冬半凶。须得生门同丙乙。",
  天芮: "天芮授道结交宜，行方最不吉。贼盗惊惶忧小口。",
  天冲: "嫁娶安茔产女惊，出行移徙遇灾迍。宜决不宜拖。",
  天辅: "天辅之星远行良，修造埋葬福绵长，上官移徙皆吉利。",
  天禽: "天禽远行偏得利，坐贾行商皆称意，投谒贵人俱益怀。",
  天心: "天心求仙合药当，商途客旅财禄昌，迁葬皆吉。",
  天柱: "天柱藏形谨守宜，不须远行及营为。",
  天任: "天任吉宿事皆通，祭祀求官嫁娶同。",
  天英: "天英之星嫁娶凶，远行移徙不宜逢。",
};

export const EVENT_ASSOC_HINT: Record<EventId, string[]> = {
  wealth: ["银钱入帐或回款", "铺面开张或改签", "贵人指路一笔生意", "破耗口舌争财"],
  career: ["见官谒贵、升迁文书", "岗位调动或改签", "小人掣肘、名实不符", "印绶到手"],
  job: ["面试得贵人", "聘书文书将至", "岗位与预期不符", "空亡则事成又散"],
  romance: ["会合订约、媒妁说合", "暗昧私情、反复猜疑", "家族长辈介入", "走失或冷淡"],
  study: ["投书献策、考场文书", "名次公布或录取", "心神不定、临场有惊", "贵人点拨"],
  health: ["求医合药、休养得生", "旧疾反复、小口不安", "血光筋骨之伤", "墓空则病势衰减"],
  travel: ["车马远行、见贵于途", "关梁阻滞、风雨相阻", "中途折返", "驿马发动则行路"],
  lawsuit: ["词讼得理或和解", "惊门口舌、官符到门", "先曲后直", "朱雀投江则音信沉"],
  partner: ["合伙订约、六合成事", "分产争执、伤门破财", "中间人说合", "杜门则信息不畅"],
  property: ["田宅文契、进产进人口", "宅中怪异、修造不宜", "地遁可成置业", "墓库则压着不成交"],
  negotiate: ["开门见贵、名正言顺", "太阴宜密谈", "反吟则条件大变", "五不遇时宜改期"],
  find: ["杜门玄武主走失隐藏", "开生则物现人归", "空亡入墓则难寻", "六合可因人得线索"],
};
