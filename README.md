# 奇门遁甲本地模型与接口

**GitHub 只存源码和模型，不提供在线调用。**  
其它项目把本仓库下载到自己的机器，在本地配置、在本地调用。

仓库里有两层接口，任选：

1. **函数接口（推荐给其它 Node 项目）** — `import { qimen } from "..."` 直接算盘，不必开服务。
2. **本机 HTTP 接口（可选）** — 若微信小程序、别的语言要走 JSON，再在本机 `npm start`。

底层排盘、十二类事项、天气权重都是本地模型，不算大模型额度。智断才需要你自己在本机填 Key。

- 接口字段、路径、返回体：[docs/API.md](docs/API.md)
- 四柱×地盘与天气重训：[docs/PILLAR.md](docs/PILLAR.md)

## 这次模型更新（四柱地盘）

预测补上了年支、月支、日支、时支对地盘干支的合冲刑：

- 年 → 长者、领导、主考官
- 月 → 朋友、亲戚、同僚
- 日 → 自己
- 时 → 事情顺逆

日时刑冲克合对当日成事权重最大。这一层已接到十二类事项、运势、人事、本命和天气特征。气候带天气按 52 维重训，旬雨势检验约 +0.83 个百分点；区县旧权重保持 31 维，推理时自动叠共享四柱层。

事业 `career` 与学业 `study` 仍是两类事项，分开调用。

## 下载到本地

```bash
git clone https://github.com/Gideon-li/wechat-Qimen-Divination-Service.git
cd wechat-Qimen-Divination-Service
npm install
```

或在你的项目里：

```bash
git clone https://github.com/Gideon-li/wechat-Qimen-Divination-Service.git vendor/qimen
cd vendor/qimen && npm install
```

## 函数接口（给其它项目直接引用）

```js
import { qimen } from "./vendor/qimen/src/api.ts";

const r = await qimen.scan({
  civil: { year: 2026, month: 8, day: 30, hour: 10, minute: 0 },
  subjectKind: "person",
  personName: "张三",
  gender: "male",
  location: { province: "浙江省", city: "温州市", district: "瓯海区" },
  eventId: "wealth",
});

console.log(r.chart.ju.label, r.focus.name, r.focus.level);
```

可运行自带示例：

```bash
npm run example
```

| 函数 | 说明 | 要大模型？ |
|---|---|---|
| `qimen.chart(q)` | 只排盘 | 否 |
| `qimen.events(q)` | 十二类事项（与该地区县天气同一套模型，含四柱地盘） | 否 |
| `qimen.event(q)` | 单事项（`eventId`） | 否 |
| `qimen.people(q)` | 人事六亲 | 否 |
| `qimen.directions(q)` | 八门方位 | 否 |
| `qimen.fortune(q)` | 年 / 月 / 日运 | 否 |
| `qimen.natal(q)` | 本命年 | 否 |
| `qimen.weather(q)` | 区县天气（含奇门要素细述 `sketch`） | 否 |
| `qimen.lots("168")` | 三位数求局 | 否 |
| `qimen.scan(q)` | 全盘一次返回 | 否 |
| `qimen.consultCompose(q)` | 智断联想 | 是 |
| `qimen.consultAsk(q)` | 追问盘面（第三段为白话卦辞） | 是 |
| `qimen.configure({ llm })` | 本地写入 Key | — |
| `qimen.getConfig()` | 读配置（Key 已掩码） | — |
| `qimen.models()` | 本地权重摘要 | — |

`q` 的字段与 HTTP 请求体相同，见 [docs/API.md](docs/API.md)。

## 本地配置 Key（只存在你这台机器）

智断才需要。排盘、事项、天气不用。

**方式 A：项目根目录 `.env`（从 `.env.example` 复制，不要提交）**

```
QIMEN_LLM_BASE_URL=https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1
QIMEN_LLM_MODEL=qwen3.8-flash
QIMEN_LLM_API_KEY=sk-你的密钥
```

本机 Ollama：

```
QIMEN_LLM_BASE_URL=http://127.0.0.1:11434/v1
QIMEN_LLM_MODEL=qwen2.5:7b
QIMEN_LLM_API_KEY=ollama
```

**方式 B：代码里配**

```js
await qimen.configure({
  llm: {
    enabled: true,
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "qwen2.5:7b",
    apiKey: "ollama",
  },
});
```

写入 `data/config.json`，已在 `.gitignore`，不会进 GitHub。

## 可选：本机 HTTP

只有当别的进程要用 JSON 时才开：

```bash
npm start
```

然后本机请求 `/v1/scan`、`/v1/consult/ask` 等。路径表见 [docs/API.md](docs/API.md)。这是你自己机器上的服务，不是 GitHub 上的服务。

## 打包进去的本地模型

| 文件 | 用途 |
|---|---|
| `models/qimen-district-weights-2020-2026.json` | 全国每个区县一套降水逻辑回归（31 维，推理补四柱层） |
| `src/engine/weather-weights.json` | 气候带天气（52 维，含四柱） |
| `src/engine/event-calibration.json` | 十二类事项门星神校准 |
| `src/engine/pillar-earth.ts` | 年/月/日/时支对地盘 |
| `src/engine/china-pca.json` | 省市区划 |
| `src/engine/symbols.ts` | 符号象征库 |

事项与天气同一套分值：加权得 S，再 \(P=\sigma(S/22)\)。排盘为拆补时盘。

供学习参考，并非定论。
