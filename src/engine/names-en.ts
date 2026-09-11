import type { EventId } from "./types";

export const GOD_EN: Record<string, string> = {
  值符: "Zhi Fu",
  腾蛇: "Teng She",
  太阴: "Tai Yin",
  六合: "Liu He",
  白虎: "White Tiger",
  玄武: "Xuan Wu",
  九地: "Nine Earth",
  九天: "Nine Heaven",
};
export const GATE_EN: Record<string, string> = {
  休门: "Rest",
  生门: "Life",
  伤门: "Injury",
  杜门: "Block",
  景门: "View",
  死门: "Death",
  惊门: "Alarm",
  开门: "Open",
};
export const STAR_EN: Record<string, string> = {
  天蓬: "Tian Peng",
  天芮: "Tian Rui",
  天冲: "Tian Chong",
  天辅: "Tian Fu",
  天禽: "Tian Qin",
  天心: "Tian Xin",
  天柱: "Tian Zhu",
  天任: "Tian Ren",
  天英: "Tian Ying",
};
export const BAGUA_EN: Record<string, string> = {
  坎: "Kan",
  坤: "Kun",
  震: "Zhen",
  巽: "Xun",
  中: "Center",
  乾: "Qian",
  兑: "Dui",
  艮: "Gen",
  离: "Li",
};
export const DIR_EN: Record<string, string> = {
  北: "N",
  南: "S",
  东: "E",
  西: "W",
  东北: "NE",
  东南: "SE",
  西南: "SW",
  西北: "NW",
  中: "C",
};
export const LEVEL_EN: Record<string, string> = {
  大吉: "Great luck",
  吉: "Luck",
  小吉: "Mild luck",
  平: "Even",
  小凶: "Mild harm",
  凶: "Harm",
  大凶: "Great harm",
  无: "none",
  弱: "weak",
  中: "mid",
  强: "strong",
  大宜: "Greatly fit",
  宜: "Fit",
  不宜: "Unfit",
  大忌: "Greatly unfit",
  大吉方: "Great luck quarter",
  吉方: "Lucky quarter",
  凶方: "Harmful quarter",
};
export const WX_CLASS_EN: Record<string, string> = { 晴: "Clear", 阴: "Cloudy", 雨: "Rain" };

export const EVENT_EN: Record<EventId, { name: string; brief: string }> = {
  wealth: { name: "Wealth", brief: "Life gate for money, Open gate for trade." },
  career: { name: "Career", brief: "Open gate, Zhi Fu and Nine Heaven for rank." },
  job: { name: "Work / promotion", brief: "Zhi Fu as self, Open gate as the way out." },
  romance: { name: "Marriage", brief: "Liu He and Tai Yin for union." },
  study: { name: "Study", brief: "View gate and Tian Fu for exams and writing." },
  health: { name: "Health", brief: "Tian Rui and Rest gate for illness and rest." },
  travel: { name: "Travel", brief: "Horse and Open gate for roads." },
  lawsuit: { name: "Dispute", brief: "Alarm gate and White Tiger for suits." },
  partner: { name: "Partnership", brief: "Liu He for partners." },
  property: { name: "Property", brief: "Life and Nine Earth for land and house." },
  negotiate: { name: "Talks", brief: "Open and Rest for talks." },
  find: { name: "Seek / recover", brief: "Xuan Wu and Block for what is missing." },
};

export const NATAL_EN: Record<string, string> = {
  本命年: "benming year",
  冲太岁: "clash Tai Sui",
  生肖合岁: "animal sign joins Tai Sui",
  命干: "year stem",
  命支: "year branch",
  "命干/命支": "year stem/branch",
};

export const FLAG_EN: Record<string, string> = {
  伏吟: "fu yin",
  反吟: "fan yin",
  门迫: "gate pressed",
  宫迫: "palace pressed",
  入墓: "into tomb",
  空亡: "void",
  驿马: "horse",
  值符: "Zhi Fu",
  值使: "Zhi Shi",
};

export const KIND_EN: Record<string, string> = {
  lover: "spouse / lover",
  teacher: "teacher / patron",
  partner: "partner",
  parent: "parent / elder",
  child: "child / junior",
  boss: "superior",
  peer: "peer / friend",
  subordinate: "subordinate",
};

export const ACTIVITY_EN: Record<string, string> = {
  commerce: "Trade / opening",
  travel: "Travel",
  exam: "Exams / name",
  marriage: "Marriage",
  healing: "Healing / rest",
  hide: "Hide / take cover",
  funeral: "Funeral",
  lawsuit: "Suit / capture",
  hunt: "Hunt / campaign",
  build: "Build / move in",
};

export const PHASE_EN: Record<string, string> = {
  start: "Start · god",
  process: "Process · star",
  end: "Close · gate",
  aux: "Aux",
  始: "start",
  中: "mid",
  终: "end",
  辅: "aux",
};

export const ELEMENT_KIND_EN: Record<string, string> = {
  神: "God",
  星: "Star",
  门: "Gate",
  干: "Stem",
  宫: "Palace",
  局: "Ju",
};

export const WXING_EN: Record<string, string> = {
  金: "metal",
  木: "wood",
  水: "water",
  火: "fire",
  土: "earth",
};

export const WX_GOD_EN: Record<string, string> = {
  值符: "Zhi Fu: steady sky, few swings.",
  腾蛇: "Teng She: thunder, turning cloud.",
  太阴: "Tai Yin: cloud, dew, damper at night.",
  六合: "Liu He: light wind and drizzle.",
  白虎: "White Tiger: strong wind.",
  玄武: "Xuan Wu: rain and damp, likelier at night.",
  九地: "Nine Earth: fog, low cloud, wet ground.",
  九天: "Nine Heaven: clearing, high cloud, sun.",
};
export const WX_STAR_EN: Record<string, string> = {
  天蓬: "Tian Peng is water: heavier rain.",
  天芮: "Tian Rui is earth: haze and lingering cloud.",
  天冲: "Tian Chong is wood: thunder, sudden change.",
  天辅: "Tian Fu: directional wind or drizzle.",
  天禽: "Tian Qin: the hub stays steady.",
  天心: "Tian Xin is metal: cooler, clearer.",
  天柱: "Tian Zhu: dry wind that can strip cloud.",
  天任: "Tian Ren: mist and damp ground.",
  天英: "Tian Ying is fire: heat and sun.",
};
export const WX_GATE_EN: Record<string, string> = {
  休门: "Rest gate: pause, drizzle, recovery.",
  生门: "Life gate: growth, moisture that feeds.",
  伤门: "Injury gate: damaging wind or hail.",
  杜门: "Block gate: closed-in, stuffy, little sun.",
  景门: "View gate: glare, heat, documents of sky.",
  死门: "Death gate: stalled, withered, little rain that helps.",
  惊门: "Alarm gate: shocks, thunder, sudden noise.",
  开门: "Open gate: opening sky, a way through.",
};

const TABLES = [
  GOD_EN,
  GATE_EN,
  STAR_EN,
  BAGUA_EN,
  DIR_EN,
  LEVEL_EN,
  WX_CLASS_EN,
  NATAL_EN,
  FLAG_EN,
  WXING_EN,
  ELEMENT_KIND_EN,
];

export function term(zh: string | null | undefined, locale: "zh" | "en"): string {
  if (!zh) return "—";
  if (locale !== "en") return zh;
  for (const table of TABLES) {
    if (table[zh]) return table[zh]!;
  }
  return zh.replace(/宫/g, " palace").replace(/坎|坤|震|巽|中|乾|兑|艮|离/g, (m) => BAGUA_EN[m] ?? m);
}
