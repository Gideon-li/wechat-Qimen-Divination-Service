/**
 * 其它项目下载本仓库后，在本地直接调用函数接口。
 * 不经过 GitHub，也不必先开 HTTP 服务。
 *
 *   node --experimental-strip-types examples/local-call.mjs
 *   或：npx tsx examples/local-call.mjs
 */
import { qimen } from "../src/api.ts";

const board = await qimen.scan({
  civil: { year: 2026, month: 8, day: 30, hour: 10, minute: 0 },
  subjectKind: "person",
  personName: "张三",
  gender: "male",
  location: { province: "浙江省", city: "温州市", district: "瓯海区" },
});

console.log("盘", board.chart.ju.label, board.chart.hourName);
console.log(
  "事项",
  board.events.slice(0, 3).map((e) => `${e.name} ${e.level} ${e.score}`),
);

const ju = qimen.lots("168");
console.log("求签 168 →", ju);

// 智断需先在本地配 Key（只写在你这台机器上）
// await qimen.configure({
//   llm: { enabled: true, baseUrl: "http://127.0.0.1:11434/v1", model: "qwen2.5:7b", apiKey: "ollama" },
// });
// const ask = await qimen.consultAsk({ ...同上, eventId: "wealth", question: "本周回款会不会到" });
// console.log(ask.text);
