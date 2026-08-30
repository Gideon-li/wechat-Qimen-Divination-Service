import type { EventId, PalaceId } from "./types";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export const QI_YI = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"] as const;

export const XUN_YI: Record<string, string> = {
  甲子: "戊",
  甲戌: "己",
  甲申: "庚",
  甲午: "辛",
  甲辰: "壬",
  甲寅: "癸",
};

export const RING: PalaceId[] = [1, 8, 3, 4, 9, 2, 7, 6];

export const OPPOSITE: Record<PalaceId, PalaceId> = {
  1: 9,
  9: 1,
  2: 8,
  8: 2,
  3: 7,
  7: 3,
  4: 6,
  6: 4,
  5: 5,
};

export const GODS_YANG = ["值符", "腾蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"] as const;
export const GODS_YIN = ["值符", "九天", "九地", "玄武", "白虎", "六合", "太阴", "腾蛇"] as const;

export const GATES = ["休门", "生门", "伤门", "杜门", "景门", "死门", "惊门", "开门"] as const;
export const STARS = ["天蓬", "天芮", "天冲", "天辅", "天禽", "天心", "天柱", "天任", "天英"] as const;

export const PALACE_META: Record<
  PalaceId,
  {
    bagua: string;
    direction: string;
    element: string;
    branch: string;
    branches: string[];
    homeStar: string;
    homeGate: string | null;
    people: string;
  }
> = {
  1: {
    bagua: "坎",
    direction: "北",
    element: "水",
    branch: "子",
    branches: ["子"],
    homeStar: "天蓬",
    homeGate: "休门",
    people: "中男、流动、酒水",
  },
  2: {
    bagua: "坤",
    direction: "西南",
    element: "土",
    branch: "申",
    branches: ["未", "申"],
    homeStar: "天芮",
    homeGate: "死门",
    people: "母亲、妻、众人",
  },
  3: {
    bagua: "震",
    direction: "东",
    element: "木",
    branch: "卯",
    branches: ["卯"],
    homeStar: "天冲",
    homeGate: "伤门",
    people: "长男、上司、开创",
  },
  4: {
    bagua: "巽",
    direction: "东南",
    element: "木",
    branch: "巳",
    branches: ["辰", "巳"],
    homeStar: "天辅",
    homeGate: "杜门",
    people: "长女、老师、文书",
  },
  5: {
    bagua: "中",
    direction: "中",
    element: "土",
    branch: "",
    branches: [],
    homeStar: "天禽",
    homeGate: null,
    people: "自己、核心、枢纽",
  },
  6: {
    bagua: "乾",
    direction: "西北",
    element: "金",
    branch: "亥",
    branches: ["戌", "亥"],
    homeStar: "天心",
    homeGate: "开门",
    people: "父亲、领导、老人",
  },
  7: {
    bagua: "兑",
    direction: "西",
    element: "金",
    branch: "酉",
    branches: ["酉"],
    homeStar: "天柱",
    homeGate: "惊门",
    people: "少女、口舌、朋友",
  },
  8: {
    bagua: "艮",
    direction: "东北",
    element: "土",
    branch: "寅",
    branches: ["丑", "寅"],
    homeStar: "天任",
    homeGate: "生门",
    people: "少男、山止、晚辈",
  },
  9: {
    bagua: "离",
    direction: "南",
    element: "火",
    branch: "午",
    branches: ["午"],
    homeStar: "天英",
    homeGate: "景门",
    people: "中女、文书、名誉",
  },
};

export const BOARD_ORDER: PalaceId[] = [4, 9, 2, 3, 5, 7, 8, 1, 6];

/** 拆补法：节气 index 0=冬至 … 23=大雪 → [上元, 中元, 下元] */
export const JU_BY_TERM: Record<number, [number, number, number]> = {
  0: [1, 7, 4],
  1: [2, 8, 5],
  2: [3, 9, 6],
  3: [8, 5, 2],
  4: [9, 6, 3],
  5: [1, 7, 4],
  6: [3, 9, 6],
  7: [4, 1, 7],
  8: [5, 2, 8],
  9: [4, 1, 7],
  10: [5, 2, 8],
  11: [6, 3, 9],
  12: [9, 3, 6],
  13: [8, 2, 5],
  14: [7, 1, 4],
  15: [2, 5, 8],
  16: [1, 4, 7],
  17: [9, 3, 6],
  18: [7, 1, 4],
  19: [6, 9, 3],
  20: [5, 8, 2],
  21: [6, 9, 3],
  22: [5, 8, 2],
  23: [4, 7, 1],
};

export const STEM_ELEMENT: Record<string, string> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

export const BRANCH_ELEMENT: Record<string, string> = {
  子: "水",
  亥: "水",
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  申: "金",
  酉: "金",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
};

export const GATE_ELEMENT: Record<string, string> = {
  休门: "水",
  生门: "土",
  伤门: "木",
  杜门: "木",
  景门: "火",
  死门: "土",
  惊门: "金",
  开门: "金",
};

export const STAR_ELEMENT: Record<string, string> = {
  天蓬: "水",
  天芮: "土",
  天冲: "木",
  天辅: "木",
  天禽: "土",
  天心: "金",
  天柱: "金",
  天任: "土",
  天英: "火",
};

export const GOD_ELEMENT: Record<string, string> = {
  值符: "土",
  腾蛇: "火",
  太阴: "金",
  六合: "木",
  白虎: "金",
  玄武: "水",
  九地: "土",
  九天: "金",
};

export const BRANCH_SIX_HE: Record<string, string> = {
  子: "丑",
  丑: "子",
  寅: "亥",
  亥: "寅",
  卯: "戌",
  戌: "卯",
  辰: "酉",
  酉: "辰",
  巳: "申",
  申: "巳",
  午: "未",
  未: "午",
};

export const BRANCH_CHONG: Record<string, string> = {
  子: "午",
  午: "子",
  丑: "未",
  未: "丑",
  寅: "申",
  申: "寅",
  卯: "酉",
  酉: "卯",
  辰: "戌",
  戌: "辰",
  巳: "亥",
  亥: "巳",
};

export const BRANCH_HAI: Record<string, string> = {
  子: "未",
  未: "子",
  丑: "午",
  午: "丑",
  寅: "巳",
  巳: "寅",
  卯: "辰",
  辰: "卯",
  申: "亥",
  亥: "申",
  酉: "戌",
  戌: "酉",
};

export const XING_GROUPS = [
  ["寅", "巳", "申"],
  ["丑", "戌", "未"],
  ["子", "卯"],
];
export const SELF_XING = new Set(["辰", "午", "酉", "亥"]);

export const STEM_HE: Record<string, string> = {
  甲: "己",
  己: "甲",
  乙: "庚",
  庚: "乙",
  丙: "辛",
  辛: "丙",
  丁: "壬",
  壬: "丁",
  戊: "癸",
  癸: "戊",
};

export const STEM_CHONG: Record<string, string> = {
  甲: "庚",
  庚: "甲",
  乙: "辛",
  辛: "乙",
  丙: "壬",
  壬: "丙",
  丁: "癸",
  癸: "丁",
};

export const CHANGSHENG_SCORE: Record<string, number> = {
  长生: 10,
  沐浴: -3,
  冠带: 5,
  临官: 12,
  帝旺: 14,
  衰: -2,
  病: -8,
  死: -12,
  墓: -10,
  绝: -14,
  胎: 2,
  养: 4,
};

/** 与事项预测共用：P = sigmoid(S / SCORE_SCALE) */
export const SCORE_SCALE = 22;

export const GATE_BASE: Record<string, number> = {
  生门: 22,
  开门: 20,
  休门: 14,
  景门: 6,
  杜门: -4,
  惊门: -10,
  伤门: -12,
  死门: -20,
};

export const STAR_BASE: Record<string, number> = {
  天辅: 16,
  天心: 16,
  天任: 12,
  天冲: 10,
  天禽: 14,
  天英: 2,
  天柱: -8,
  天芮: -12,
  天蓬: -14,
};

export const GOD_BASE: Record<string, number> = {
  值符: 18,
  九天: 14,
  九地: 10,
  太阴: 12,
  六合: 12,
  腾蛇: -10,
  白虎: -12,
  玄武: -10,
};

export const STEM_BASE: Record<string, number> = {
  乙: 12,
  丙: 14,
  丁: 13,
  戊: 8,
  己: 4,
  庚: -8,
  辛: 0,
  壬: 2,
  癸: -2,
  甲: 10,
};

export const JI_MEN = new Set(["开门", "休门", "生门"]);
export const XIONG_MEN = new Set(["伤门", "杜门", "死门", "惊门"]);
export const JI_GOD = new Set(["值符", "九天", "九地", "太阴", "六合"]);
export const SAN_QI = new Set(["乙", "丙", "丁"]);

export const HOUR_NAMES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export const CITIES: { id: string; name: string; lng: number }[] = [
  { id: "beijing", name: "北京", lng: 116.4 },
  { id: "shanghai", name: "上海", lng: 121.47 },
  { id: "guangzhou", name: "广州", lng: 113.27 },
  { id: "chengdu", name: "成都", lng: 104.07 },
  { id: "xian", name: "西安", lng: 108.94 },
  { id: "wuhan", name: "武汉", lng: 114.31 },
  { id: "nanjing", name: "南京", lng: 118.8 },
  { id: "hangzhou", name: "杭州", lng: 120.16 },
  { id: "shenyang", name: "沈阳", lng: 123.43 },
  { id: "haerbin", name: "哈尔滨", lng: 126.53 },
  { id: "wulumuqi", name: "乌鲁木齐", lng: 87.62 },
  { id: "lasa", name: "拉萨", lng: 91.11 },
  { id: "hongkong", name: "香港", lng: 114.17 },
  { id: "taipei", name: "台北", lng: 121.57 },
  { id: "frankfurt", name: "法兰克福", lng: 8.68 },
];

export const EVENTS: {
  id: EventId;
  name: string;
  brief: string;
  yongShen: "gate" | "star" | "god" | "zhifu";
  target: string;
  secondary?: { kind: "gate" | "star" | "god"; name: string };
  gateBias: Record<string, number>;
  starBias: Record<string, number>;
  godBias: Record<string, number>;
}[] = [
  {
    id: "wealth",
    name: "求财经营",
    brief: "生门主财，开门主经营。看财来得正不正、过门顺不顺。",
    yongShen: "gate",
    target: "生门",
    secondary: { kind: "gate", name: "开门" },
    gateBias: { 生门: 14, 开门: 10, 休门: 4, 景门: 2, 死门: -10, 杜门: -6 },
    starBias: { 天任: 8, 天心: 6, 天芮: -6, 天蓬: -8 },
    godBias: { 六合: 8, 太阴: 6, 九地: 4, 白虎: -8, 玄武: -6 },
  },
  {
    id: "career",
    name: "事业官运",
    brief: "开门、值符、九天主事业与名位，宜见天心、天辅。",
    yongShen: "gate",
    target: "开门",
    secondary: { kind: "god", name: "值符" },
    gateBias: { 开门: 14, 休门: 6, 生门: 6, 伤门: -6, 死门: -10 },
    starBias: { 天心: 10, 天辅: 8, 天冲: 4, 天柱: -8 },
    godBias: { 值符: 10, 九天: 10, 白虎: -4, 腾蛇: -6 },
  },
  {
    id: "job",
    name: "求职升迁",
    brief: "以值符为自己，开门为出路。贵人看九天、天辅。",
    yongShen: "zhifu",
    target: "值符",
    secondary: { kind: "gate", name: "开门" },
    gateBias: { 开门: 12, 休门: 8, 生门: 6, 杜门: -8, 死门: -10 },
    starBias: { 天辅: 10, 天心: 10, 天冲: 6, 天芮: -8 },
    godBias: { 值符: 8, 九天: 12, 太阴: 4, 玄武: -6 },
  },
  {
    id: "romance",
    name: "婚姻感情",
    brief: "六合主婚姻，太阴主私情。兑离坤宫看男女。沐浴反为桃花。",
    yongShen: "god",
    target: "六合",
    secondary: { kind: "god", name: "太阴" },
    gateBias: { 休门: 8, 生门: 8, 开门: 6, 景门: 4, 伤门: -8, 惊门: -8, 死门: -12 },
    starBias: { 天任: 6, 天英: 6, 天冲: 4, 天蓬: -8, 天柱: -6 },
    godBias: { 六合: 14, 太阴: 12, 腾蛇: -8, 白虎: -10, 玄武: -6 },
  },
  {
    id: "study",
    name: "考试学业",
    brief: "天辅主文昌，景门主文书考试，值符主本人状态。",
    yongShen: "star",
    target: "天辅",
    secondary: { kind: "gate", name: "景门" },
    gateBias: { 景门: 12, 开门: 8, 休门: 6, 杜门: -4, 伤门: -6 },
    starBias: { 天辅: 14, 天心: 10, 天英: 6, 天蓬: -8, 天柱: -6 },
    godBias: { 值符: 8, 九天: 8, 太阴: 6, 腾蛇: -4 },
  },
  {
    id: "health",
    name: "健康疾病",
    brief: "天芮主病，死门主危。病星入墓、空亡则衰；生门旺则复。",
    yongShen: "star",
    target: "天芮",
    secondary: { kind: "gate", name: "死门" },
    gateBias: { 生门: 10, 休门: 8, 开门: 6, 死门: -14, 伤门: -8, 惊门: -6 },
    starBias: { 天任: 8, 天禽: 6, 天芮: -10, 天蓬: -8, 天英: -4 },
    godBias: { 九地: 6, 值符: 4, 白虎: -10, 玄武: -6, 腾蛇: -6 },
  },
  {
    id: "travel",
    name: "出行远行",
    brief: "开门、九天主出行。杜门滞留，死门不宜远行。",
    yongShen: "gate",
    target: "开门",
    secondary: { kind: "god", name: "九天" },
    gateBias: { 开门: 14, 生门: 8, 景门: 6, 休门: 4, 杜门: -10, 死门: -12 },
    starBias: { 天冲: 8, 天心: 6, 天辅: 4, 天柱: -6, 天芮: -6 },
    godBias: { 九天: 14, 值符: 6, 九地: -4, 玄武: -6, 白虎: -8 },
  },
  {
    id: "lawsuit",
    name: "诉讼纠纷",
    brief: "伤门主争，白虎主刑。己方宜值符、九天制住伤门。",
    yongShen: "gate",
    target: "伤门",
    secondary: { kind: "god", name: "白虎" },
    gateBias: { 开门: 8, 休门: 6, 伤门: -6, 死门: -10, 惊门: -8 },
    starBias: { 天心: 8, 天冲: 4, 天柱: -8, 天蓬: -8, 天芮: -6 },
    godBias: { 值符: 10, 九天: 8, 白虎: -10, 玄武: -6, 腾蛇: -8 },
  },
  {
    id: "partner",
    name: "合作合伙",
    brief: "六合主合作，生门主共利。宜合不宜冲，忌白虎、惊门。",
    yongShen: "god",
    target: "六合",
    secondary: { kind: "gate", name: "生门" },
    gateBias: { 生门: 12, 开门: 8, 休门: 6, 惊门: -10, 伤门: -8, 杜门: -6 },
    starBias: { 天任: 8, 天辅: 6, 天心: 6, 天蓬: -6, 天柱: -6 },
    godBias: { 六合: 14, 太阴: 6, 值符: 4, 白虎: -10, 腾蛇: -6 },
  },
  {
    id: "property",
    name: "置业搬家",
    brief: "生门主房产生机，九地主田宅。宜生开，忌死杜。",
    yongShen: "gate",
    target: "生门",
    secondary: { kind: "god", name: "九地" },
    gateBias: { 生门: 14, 开门: 8, 休门: 4, 死门: -12, 杜门: -8, 伤门: -6 },
    starBias: { 天任: 10, 天芮: -4, 天禽: 6, 天冲: 2 },
    godBias: { 九地: 12, 六合: 6, 太阴: 4, 白虎: -8, 玄武: -4 },
  },
  {
    id: "negotiate",
    name: "谈判签约",
    brief: "六合、太阴主密约成事，开门主公开协议。忌惊门反复。",
    yongShen: "god",
    target: "六合",
    secondary: { kind: "god", name: "太阴" },
    gateBias: { 开门: 10, 休门: 8, 生门: 6, 惊门: -10, 伤门: -8, 杜门: -4 },
    starBias: { 天辅: 8, 天心: 8, 天任: 4, 天冲: 2, 天柱: -6 },
    godBias: { 六合: 12, 太阴: 10, 值符: 6, 腾蛇: -8, 白虎: -6 },
  },
  {
    id: "find",
    name: "寻人寻物",
    brief: "杜门主隐藏，玄武主走失。落空、入墓则难寻；生开则现。",
    yongShen: "gate",
    target: "杜门",
    secondary: { kind: "god", name: "玄武" },
    gateBias: { 开门: 8, 生门: 6, 景门: 4, 杜门: -4, 死门: -8, 休门: 2 },
    starBias: { 天辅: 6, 天冲: 4, 天蓬: -6, 天芮: -6 },
    godBias: { 九天: 8, 值符: 6, 玄武: -8, 腾蛇: -6, 太阴: 4 },
  },
];

export const EVENT_MAP = Object.fromEntries(EVENTS.map((e) => [e.id, e])) as Record<
  EventId,
  (typeof EVENTS)[number]
>;
