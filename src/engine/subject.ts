import type { EventId } from "./types";
import { EVENT_ASSOC_HINT } from "./classic";
import { EVENTS } from "./constants";

export type SubjectKind = "person" | "district" | "city" | "province" | "country";

export const SUBJECT_OPTIONS: { id: SubjectKind; label: string; hint: string }[] = [
  { id: "person", label: "个人", hint: "以问事人为「我」" },
  { id: "district", label: "区县", hint: "以所选区县为「我」" },
  { id: "city", label: "城市", hint: "以所选城市为「我」" },
  { id: "province", label: "省份", hint: "以所选省份为「我」" },
  { id: "country", label: "国家", hint: "以中国为「我」" },
];

export function countryName(province: string): string {
  if (province.includes("台湾")) return "中国台湾";
  if (province.includes("香港")) return "中国香港";
  if (province.includes("澳门")) return "中国澳门";
  return "中国";
}

export function subjectName(kind: SubjectKind, loc: { personName: string; province: string; city: string; district: string }): string {
  if (kind === "person") return loc.personName.trim() || "问事人";
  if (kind === "district") return loc.district || loc.city || loc.province;
  if (kind === "city") return loc.city || loc.province;
  if (kind === "province") return loc.province;
  return countryName(loc.province);
}

export function subjectScope(kind: SubjectKind, loc: { province: string; city: string; district: string }): string {
  if (kind === "person") return [loc.province, loc.city, loc.district].filter(Boolean).join("");
  if (kind === "district") return `${loc.province}${loc.city}${loc.district}`;
  if (kind === "city") return `${loc.province}${loc.city}`;
  if (kind === "province") return loc.province;
  return countryName(loc.province);
}

export function isPlaceSubject(kind: SubjectKind): boolean {
  return kind !== "person";
}

const PLACE_EVENT: Record<EventId, { name: string; brief: string; hints: [string, string, string, string] }> = {
  wealth: {
    name: "财税生计",
    brief: "生门主财，看一地财税、营商、民生进账是否得正。",
    hints: ["税源回笼或项目落地", "市面开张、招商签约", "邻区分流、口舌争利", "破耗空转、承诺落空"],
  },
  career: {
    name: "治理名位",
    brief: "开门、值符、九天主一地政声与名位，宜见天心、天辅。",
    hints: ["政令得人、名位上达", "人事调动、改签换将", "掣肘、名实不符", "印绶文书到手"],
  },
  job: {
    name: "人事编制",
    brief: "值符为本地，开门为出路。看招录、编制、岗位进退。",
    hints: ["招录得人", "编制文书将至", "人岗不符", "空亡则人来又散"],
  },
  romance: {
    name: "民情和合",
    brief: "六合、太阴看一地婚育、民心向背、邻里和合。",
    hints: ["民心和、婚育事成", "暗昧反复、猜疑", "长辈宗族介入", "走失冷淡、离心"],
  },
  study: {
    name: "文教人才",
    brief: "景门、天辅主一地文教、考试、人才出头。",
    hints: ["文教出头、投书得路", "名次录取公布", "临场有惊、心神不定", "贵人点拨"],
  },
  health: {
    name: "民生疾疫",
    brief: "天芮、休门看一地疾疫、医疗、小口安宁。",
    hints: ["求医合药、休养得生", "旧疾反复、小口不安", "血光意外、筋骨之伤", "墓空则病势衰减"],
  },
  travel: {
    name: "交通往来",
    brief: "驿马、开门看一地出行、物流、关梁是否通。",
    hints: ["路通人来、见贵于途", "关梁阻滞、风雨相阻", "中途折返", "驿马发动则行路"],
  },
  lawsuit: {
    name: "治安词讼",
    brief: "惊门、白虎看一地词讼、治安、官符。",
    hints: ["得理或和解", "官符到门、口舌蜂起", "先曲后直", "音信沉溺、朱雀投江"],
  },
  partner: {
    name: "协作招商",
    brief: "六合主协作，伤门主分争。看一地合伙、招商、分产。",
    hints: ["订约成事", "分产争执、破财", "中间人说合", "杜门则信息不畅"],
  },
  property: {
    name: "城建田宅",
    brief: "生门、坤艮看一地田宅、修造、进产。",
    hints: ["文契进产", "宅中怪异、修造不宜", "地遁可成置业", "墓库则压着不成交"],
  },
  negotiate: {
    name: "政务商谈",
    brief: "开门见贵，太阴宜密。看一地谈判、协议、对外条件。",
    hints: ["名正言顺、见贵", "宜密谈", "反吟则条件大变", "五不遇时宜改期"],
  },
  find: {
    name: "寻访失联",
    brief: "杜门玄武主隐藏走失，开生则人归物现。",
    hints: ["走失隐藏", "物现人归", "空亡入墓则难寻", "六合可因人得线索"],
  },
};

export function displayEvent(eventId: EventId, kind: SubjectKind): { name: string; brief: string } {
  if (isPlaceSubject(kind)) {
    const p = PLACE_EVENT[eventId];
    return { name: p.name, brief: p.brief };
  }
  const ev = EVENTS.find((e) => e.id === eventId);
  return { name: ev?.name ?? eventId, brief: ev?.brief ?? "" };
}

export function assocHints(eventId: EventId, kind: SubjectKind): string[] {
  if (isPlaceSubject(kind)) return PLACE_EVENT[eventId].hints;
  return EVENT_ASSOC_HINT[eventId];
}

export function subjectPrompt(kind: SubjectKind, name: string, scope: string): string {
  if (kind === "person") {
    return `预测对象是个人「${name}」。值符为「我」。围绕此人的行事、人事、财禄来想。`;
  }
  const unit =
    kind === "district" ? "区县" : kind === "city" ? "城市" : kind === "province" ? "省份" : "国家";
  return `预测对象是${unit}「${name}」（${scope}）。值符当作该${unit}本身，不要当成某个私人。事情须落在该${unit}的政务、民生、经济、人事、治安、文教上，选最合理的一件。`;
}
