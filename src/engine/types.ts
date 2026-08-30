export type PalaceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type DunType = "yang" | "yin";

export type Yuan = "上元" | "中元" | "下元";

export type Gender = "male" | "female";

export type Phase = "start" | "process" | "end" | "aux";

export type LuckLevel = "大吉" | "吉" | "小吉" | "平" | "小凶" | "凶" | "大凶";

export type EventId =
  | "wealth"
  | "career"
  | "job"
  | "romance"
  | "study"
  | "health"
  | "travel"
  | "lawsuit"
  | "partner"
  | "property"
  | "negotiate"
  | "find";

export type Pillar = {
  stem: string;
  branch: string;
  name: string;
  nayin: string;
};

export type FourPillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
};

export type JuInfo = {
  term: string;
  termDayIndex: number;
  yuan: Yuan;
  dun: DunType;
  ju: number;
  label: string;
};

export type Palace = {
  id: PalaceId;
  bagua: string;
  direction: string;
  element: string;
  branch: string;
  branches: string[];
  earthStem: string;
  heavenStem: string;
  star: string;
  gate: string | null;
  god: string | null;
  changsheng: string | null;
  isKong: boolean;
  isZhiFu: boolean;
  isZhiShi: boolean;
  isMa: boolean;
  fuYin: boolean;
  fanYin: boolean;
  menPo: boolean;
  gongPo: boolean;
  ruMu: boolean;
  jiXing: boolean;
};

export type ChartMeta = {
  zhiFuOrigin: PalaceId;
  zhiFuPalace: PalaceId;
  zhiFuStar: string;
  zhiShiGate: string;
  xunShou: string;
  xunYi: string;
  xunKong: string[];
  maBranch: string;
  maPalace: PalaceId | null;
  fuYin: boolean;
  fanYin: boolean;
};

export type QimenChart = {
  beijing: { year: number; month: number; day: number; hour: number; minute: number };
  timeLabel: string;
  hourName: string;
  pillars: FourPillars;
  ju: JuInfo;
  palaces: Record<PalaceId, Palace>;
  meta: ChartMeta;
};

export type ScoreFactor = {
  key: string;
  label: string;
  detail: string;
  weight: number;
  phase: Phase;
};

export type EventScore = {
  eventId: EventId;
  name: string;
  brief: string;
  palaceId: PalaceId;
  score: number;
  probability: number;
  level: LuckLevel;
  phases: {
    start: { score: number; summary: string };
    process: { score: number; summary: string };
    end: { score: number; summary: string };
  };
  factors: ScoreFactor[];
  patterns: string[];
  reading: string;
  associations: string[];
  omen: string;
  classicCite: string;
};

export type RelationKind =
  | "lover"
  | "teacher"
  | "partner"
  | "parent"
  | "child"
  | "boss"
  | "peer"
  | "subordinate";

export type PeopleLink = {
  palaceId: PalaceId;
  bagua: string;
  role: string;
  sixKin: string;
  relation: "生我" | "我生" | "克我" | "我克" | "同我";
  kinds: RelationKind[];
  score: number;
  level: LuckLevel;
  summary: string;
};

export type GanzhiFlag = {
  label: string;
  kind: "合" | "冲" | "刑" | "害" | "克" | "生" | "墓" | "空";
  detail: string;
  weight: number;
};
