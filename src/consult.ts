import { luckPlainAdvice, withLuckAdvice, type LuckPlainInput } from "./engine/luck-plain";
import { stripModelMarkup } from "./engine/text";
import { llmChat, parseJsonObject } from "./llm";

export type ConsultCompose = {
  scene: string;
  time: string;
  place: string;
  people: string;
  content: string;
  expansion: string[];
  caution: string;
};

export type ComposeInput = {
  question: string;
  eventName: string;
  level: string;
  score: number;
  pack: string;
  brief: string;
  person?: string;
  gender?: string;
  location?: string;
  subjectLine?: string;
};

export type ChatInput = {
  question: string;
  pack: string;
  brief: string;
  history: { role: "user" | "assistant"; content: string }[];
  person?: string;
  location?: string;
  subjectLine?: string;
  luck?: LuckPlainInput;
};

const SYSTEM_COMPOSE = `你是奇门遁甲「联想断事」助手，不是算命实录。
规则：
1. 只能使用用户提供的象征库词条来组合一件最合理、相对具体的事情。
2. 必须包含时间、地点、人物、事情内容；可据象略作拓展，但不要引入库中没有的新象。
3. 吉则组吉象，凶则组凶象，平则写可成可不成的中间态。
4. 严格围绕「预测对象」来想：对象是个人就写此人行事；对象是区县、城市、省份或国家，就把值符当作该地本身，写该地政务民生经济人事，不要写成某个私人的命运。
5. 语气克制，像老师讲解，不要鸡汤，不要保证应验。
6. 只输出 JSON，字段：scene（一段总述），time，place，people，content，expansion（2-3条字符串），caution（一句提醒）。
7. JSON 字符串里禁止出现井号、星号、反引号或任何 Markdown。`;

const SYSTEM_CHAT = `你是奇门遁甲盘面咨询助手。依据用户给出的九宫摘要和象征库词条作答。
- 严格围绕预测对象。对象若是区县、城市、省份、国家，把值符当作该地，写该地的事，不要当成个人算命。
- 只写两段，用「一、」「二、」：
  一、盘面用神：点明用了哪些门、星、神，各主什么。
  二、可能发生的具体事情：时间、地点、人物、事情。
- 不要写第三段。系统会补上「三、吉凶提示与建议」。
- 吉凶分说，不夸张，不保证。
- 用中文。严禁 Markdown：不要写 ###、##、#、**、*、反引号。
- 供学习，并非定论。`;

function clip(s: string, n: number) {
  return s.replace(/\s+/g, " ").trim().slice(0, n);
}

function cleanField(v: unknown, n: number) {
  return stripModelMarkup(String(v ?? "")).slice(0, n);
}

export async function composeAssociation(data: ComposeInput) {
  const question = clip(data.question || `请就「${data.eventName}」联想一件最可能发生的具体事情`, 400);
  const pack = clip(data.pack, 4500);
  const brief = clip(data.brief, 1200);
  const who = [data.person, data.gender === "female" ? "女" : data.gender === "male" ? "男" : ""]
    .filter(Boolean)
    .join("·");
  const loc = clip(data.location ?? "", 40);
  const user = [
    data.subjectLine ? clip(data.subjectLine, 200) : "",
    `问：${question}`,
    `事项 ${data.eventName}，分值 ${data.score > 0 ? "+" : ""}${data.score}，总断${data.level}。`,
    who ? `称呼：${who}` : "",
    loc ? `地理位置：${loc}` : "",
    `九宫摘要：${brief}`,
    pack,
    "输出纯 JSON。字符串内不要出现 # * ` 等标记。",
  ]
    .filter(Boolean)
    .join("\n");
  const r = await llmChat(
    [
      { role: "system", content: SYSTEM_COMPOSE },
      { role: "user", content: user },
    ],
    { json: true, maxTokens: 700 },
  );
  if (!r.ok) return { ok: false as const, error: r.error };
  const obj = parseJsonObject(r.text);
  if (!obj) return { ok: false as const, error: "模型返回无法解析" };
  const expansion = Array.isArray(obj.expansion)
    ? obj.expansion.map((x) => cleanField(x, 200)).filter(Boolean).slice(0, 4)
    : [];
  const result: ConsultCompose = {
    scene: cleanField(obj.scene, 800),
    time: cleanField(obj.time, 120),
    place: cleanField(obj.place, 120),
    people: cleanField(obj.people, 120),
    content: cleanField(obj.content, 400),
    expansion,
    caution: cleanField(obj.caution, 200),
  };
  if (!result.scene && !result.content) return { ok: false as const, error: "模型没有给出事情" };
  return { ok: true as const, result };
}

export async function consultChart(data: ChatInput) {
  const question = clip(data.question, 400);
  if (!question) return { ok: false as const, error: "请先写下要问的事" };
  const pack = clip(data.pack, 4500);
  const brief = clip(data.brief, 1200);
  const history = (data.history ?? []).slice(-8).map((m) => ({
    role: m.role,
    content: stripModelMarkup(clip(m.content, 1200)),
  }));
  const header = [
    data.subjectLine ? clip(data.subjectLine, 200) : "",
    data.person ? `称呼：${clip(data.person, 40)}` : "",
    data.location ? `地理位置：${clip(data.location, 40)}` : "",
    data.luck ? `事项「${data.luck.eventName}」总断${data.luck.level}（${data.luck.score > 0 ? "+" : ""}${data.luck.score}）。` : "",
    `九宫摘要：${brief}`,
    pack,
    "只写「一、」「二、」两段。不要写第三段，不要井号星号。",
  ]
    .filter(Boolean)
    .join("\n");
  const r = await llmChat(
    [
      { role: "system", content: SYSTEM_CHAT },
      { role: "user", content: header },
      { role: "assistant", content: "已记住当前盘面、预测对象与象征库。请提问。只写一、二两段，用纯文本。" },
      ...history,
      { role: "user", content: question },
    ],
    { maxTokens: 800 },
  );
  if (!r.ok) return { ok: false as const, error: r.error };
  const body = stripModelMarkup(r.text).slice(0, 2200);
  const advice = data.luck ? luckPlainAdvice(data.luck) : "";
  const text = advice ? withLuckAdvice(body, advice) : body;
  return { ok: true as const, text: stripModelMarkup(text).slice(0, 2800) };
}
