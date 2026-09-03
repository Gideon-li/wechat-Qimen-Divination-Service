# 接口说明

本仓库从 GitHub **下载到本地后使用**。GitHub 不托管在线服务，也不能从仓库上直接调接口。

有两种用法：

1. **函数接口**：其它 Node 项目 `import { qimen } from "<本仓库>/src/api.ts"`，见下文「函数」与仓库根目录 `examples/local-call.mjs`。
2. **本机 HTTP（可选）**：仅在你自己的机器上 `npm start` 后访问。默认基址 `http://127.0.0.1:8787`。

函数参数与 HTTP JSON 字段相同。下面先列共同字段，再列 HTTP 路径；函数名对照表在文末。

模型层说明（四柱×地盘、天气/事项共用、特征维）另见 [PILLAR.md](PILLAR.md)。

---

HTTP 成功：

```json
{ "ok": true, "data": { } }
```

HTTP 失败：

```json
{ "ok": false, "error": "原因" }
```

常见 HTTP 状态：200 成功，400 参数，401 缺令牌，404 未知路径，502 大模型失败。

跨域默认 `Access-Control-Allow-Origin: *`。可用环境变量 `QIMEN_CORS` 收紧。

鉴权：若已配置 `serviceToken`，请求头加：

```
Authorization: Bearer <serviceToken>
```

`GET /health` 始终免令牌。

---

## 1. 共同请求体（排盘类 POST）

除特别注明外，下列 POST 都吃同一套字段。未写则用此时北京时间 + 默认浙江温州瓯海 + 个人对象。

```json
{
  "civil": { "year": 2026, "month": 8, "day": 30, "hour": 10, "minute": 0 },
  "trueSolar": false,
  "casting": "chaibu",
  "lotsMonth": 8,
  "lotsJu": 6,
  "lotsCode": "168",
  "subjectKind": "person",
  "personName": "张三",
  "gender": "male",
  "birthYear": 1992,
  "location": {
    "province": "浙江省",
    "city": "温州市",
    "district": "瓯海区",
    "provinceCode": "330000",
    "cityCode": "330300",
    "districtCode": "330304"
  },
  "eventId": "wealth",
  "activity": "commerce",
  "question": "本周回款会不会到",
  "history": []
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| civil | 对象 | 北京时间。缺省为服务器此时。 |
| trueSolar | 布尔 | true 则按所选区县经度相对东经 120° 改正。 |
| casting | `chaibu` \| `lots` | 拆补时盘或求签定局。默认拆补。 |
| lotsMonth | 1–12 | 求签时月份定阴阳遁。 |
| lotsJu | 1–9 | 求签局数。 |
| lotsCode | 字符串 | 三位数连加至 1–9，例 `168→6`。有则覆盖 `lotsJu`。 |
| subjectKind | 见下 | 预测对象。 |
| personName | 字符串 | 个人称呼。 |
| gender | `male` \| `female` | 默认男。 |
| birthYear | 1920–2030 | 个人年命。地方对象忽略。 |
| location | 对象 | 名称或代码二选一即可，服务会补全。 |
| eventId | 见目录 | 单事项、智断用。默认 `wealth`。 |
| activity | 见目录 | 方位用事。默认 `commerce`。 |
| question | 字符串 | 智断提问。 |
| history | 数组 | 追问上下文，`{role, content}`，最多用最近 8 轮。 |

`subjectKind`：

| 值 | 含义 | 「我」 |
|---|---|---|
| person | 个人 | personName，空则为「问事人」 |
| district | 区县 | 所选区县 |
| city | 城市 | 所选城市 |
| province | 省份 | 所选省份 |
| country | 国家 | 中国（台湾/港澳单独标注） |

`eventId`（个人名 / 地方名）：

| id | 个人 | 地方 |
|---|---|---|
| wealth | 求财经营 | 财税生计 |
| career | 事业官运 | 治理名位 |
| job | 求职升迁 | 人事编制 |
| romance | 婚姻感情 | 民情和合 |
| study | 考试学业 | 文教人才 |
| health | 健康疾病 | 民生疾疫 |
| travel | 出行远行 | 交通往来 |
| lawsuit | 诉讼纠纷 | 治安词讼 |
| partner | 合作合伙 | 协作招商 |
| property | 置业搬家 | 城建田宅 |
| negotiate | 谈判签约 | 政务商谈 |
| find | 寻人寻物 | 寻访失联 |

事业 `career` 与学业 `study` 是两类事项，算法不同，不要混用。

`activity`：`commerce` 经商开张，`travel` 远行，`exam` 考试，`marriage` 嫁娶，`healing` 治病，`hide` 避难，`funeral` 丧葬，`lawsuit` 词讼，`hunt` 捕猎，`build` 修造。

---

## 2. 元数据

### `GET /health`

```json
{ "ok": true, "data": { "status": "up", "llm": { "enabled": true, "hasKey": false, "model": "qwen3.8-flash" } } }
```

### `GET /v1`

返回接口路径列表。

### `GET /v1/catalog`

事项、对象、方位活动、个人/地方事项名称对照。

### `GET /v1/locations`

- 无参数：全部省 `{ code, name, nCities }`
- `?provinceCode=330000`：该省的市
- `?provinceCode=330000&cityCode=330300`：该市的区县

也可用中文名：`?province=浙江省&city=温州市`

### `GET /v1/symbols`

75 条符号象征库（八卦、九星、八门、八神、天干、地支、长生、空亡等）。

### `GET /v1/models`

本地权重文件与大模型配置摘要（Key 已掩码）。`engine` 字段说明事项/运势/人事与天气共用该地天气模型的 `|β|`。

---

## 3. 配置（模型与 Key）

### `GET /v1/config`

```json
{
  "ok": true,
  "data": {
    "llm": {
      "enabled": true,
      "provider": "openai-compatible",
      "baseUrl": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
      "model": "qwen3.8-flash",
      "apiKey": "sk-***xxxx",
      "hasKey": true,
      "extraHeaders": []
    },
    "serviceToken": "",
    "hasServiceToken": false
  }
}
```

### `PUT /v1/config`

请求体可部分更新：

```json
{
  "serviceToken": "my-secret",
  "llm": {
    "enabled": true,
    "baseUrl": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    "model": "qwen3.8-flash",
    "apiKey": "sk-...",
    "extraHeaders": {}
  }
}
```

说明：

- `baseUrl` 须指向 **OpenAI 兼容** 的根，服务会请求 `{baseUrl}/chat/completions`。
- 通义千问国际/北京 Token Plan、DashScope `compatible-mode/v1`、Ollama `http://127.0.0.1:11434/v1`、vLLM 均可。
- 写入 `data/config.json`。环境变量里的 `QIMEN_LLM_API_KEY` 若存在，读配置时优先于文件。
- 把 `apiKey` 设为 `""` 可清空文件中的 Key。

### `POST /v1/config/test-llm`

用当前配置发一句测试。成功则 `data.reply` 有文本。

---

## 4. 本地测算

这些接口 **只跑本地模型**，不消耗大模型额度。

排盘类成功体都带：

```json
{
  "subject": { "kind": "person", "name": "张三", "scope": "…", "gender": "male", "birthYear": 1992 },
  "location": { "province": "浙江省", "city": "温州市", "district": "瓯海区", "provinceCode": "330000", "cityCode": "330300", "districtCode": "330304" },
  "civil": { "year": 2026, "month": 9, "day": 3, "hour": 10, "minute": 0 },
  "chart": { "pillars": { }, "ju": { }, "meta": { }, "palaces": { } },
  "model": { "shared": "weather+events", "how": "区县", "place": "浙江省温州市瓯海区" }
}
```

`data.model` 标明事项与天气共用哪一套区县系数。换区即换模型。不把「有雨」的正负号抄到求财/事业，只用该区 `scoreModel.w` 的 `|β|` 作神星门信度。

### `POST /v1/chart`

只返回盘面：四柱、局数、九宫（门星神、空亡、值符值使、伏吟反吟等）。

### `POST /v1/events`

十二类事项，按分值排序。每条大致含：

| 字段 | 含义 |
|---|---|
| `eventId` / `name` | 事项编号与名称（个人/地方用词不同） |
| `score` / `probability` / `level` | 加权分 S、P=σ(S/22)（百分数）、吉凶档 |
| `palaceId` / `god` / `star` / `gate` | 用神宫及神星门 |
| `reading` | 白话断语，含四柱地盘一句 |
| `associations` | 象征联想 |
| `factors` | 权重拆解（神星门、格局、空亡、四柱等） |
| `ganzhiFlags` | 年/月/日/时支对地盘的合冲刑，以及日时互作 |

四柱对地盘（已写入十二类事项、运势、人事、本命、天气特征）：

| 柱 | 管什么 | 权重倍率 |
|---|---|---|
| 年支 | 长者、领导、主考官 | 0.72 |
| 月支 | 朋友、亲戚、同僚 | 0.88 |
| 日支 | 自己、当事主体 | 1.20 |
| 时支 | 事情顺逆、当下气机 | 1.32 |

日时刑冲克合对当日成事权重最大。天气特征在原 31 维神星门/遁吟空/年积日之外，再加 21 维四柱 0/1；气候带已按 52 维重训。区县旧 `w` 只有前 31 维时，推理自动叠上气候带平均的四柱层。详见 [PILLAR.md](PILLAR.md)。

### `POST /v1/event`

单事项。用 `eventId` 指定。字段与上表单条相同。

### `POST /v1/people`

以值符为「我」的六亲人事。同样走四柱地盘与区县信度。

### `POST /v1/directions`

`ranked` 按所问活动排序；`overall` 为综合吉方。

### `POST /v1/weather`

- `district`：该区县独立逻辑回归（全国约 3143 区各一套 w,b）
- `climateBand`：气候带模型（回退/对照，已含 52 维四柱）
- `sketch`：按奇门要素写出的天气细述（与 `district.detail` 相同）

`district` / `climateBand` 在原有 `cls`（晴/阴/雨）、`score`、`rainProb` 之外，增加 `detail`：

| 字段 | 含义 |
|---|---|
| `detail.headline` | 总象一句话，如「多云转雨，间有雷声，偏热」 |
| `detail.sky` | 天空状况 |
| `detail.kan` | 坎宫用神：神、星、门、天盘地盘干、是否空亡 |
| `detail.from` | 雨/风/雷/晴/雾从哪一宫来（玄武、白虎、腾蛇、九天、九地所落） |
| `detail.aspects` | 雨势、晴势、风力、雷电、雾露、暑热、变天，各有强弱与白话 |
| `detail.elements` | 盘上神、星、门、干、格局如何应天 |
| `detail.narrative` | 三段白话总述 |
| `detail.advice` | 宜忌（备伞、避雷、防风等） |

函数接口：`qimen.weather(q)`，返回里同样有 `weather.sketch`。

天气与事项 **不是两套互不相干的模型**：同一套区县 `w` 的绝对值给事项当神星门信度；天气分类本身仍用降水符号。气候带四柱层两边共用。

### `POST /v1/fortune`

年运（立春交节）、月运（当月节气）、日运（午时）。结构含总分、切片、十二类事项。四柱角色写入切片白话（年看尊长主考、月看亲友、日看自己、时看顺逆）。

### `POST /v1/natal`

需 `subjectKind=person` 且 `birthYear`。否则 `natal` 为 null。

### `POST /v1/lots`

不必排盘。体：`{ "lotsCode": "168" }` → `{ ju: 6, steps: ["1+6+8=15","1+5=6"] }`。

### `POST /v1/scan`（别名 `POST /v1/divination`）

微信一次取全量：盘 + 十二类 + 焦点事项 + 人事 + 方位 + 年运月运日运 + 本命 + 天气。

---

## 5. 智断（需大模型 Key）

先 `PUT /v1/config` 配好 Key。未配置时返回 `ok: false`。

### `POST /v1/consult/compose`

按象征库组一件具体事。

额外字段：`question`、`eventId`。

`data.scene`：

| 字段 | 含义 |
|---|---|
| scene | 总述 |
| time / place / people | 时空人事 |
| content | 事情 |
| expansion | 2–3 条延伸 |
| caution | 一句提醒 |

### `POST /v1/consult/ask`

追问盘面。`question` 必填。`history` 可选。

返回 `data.text` 纯文本，结构固定：

```
一、盘面用神
……
二、可能发生的具体事情
……
三、吉凶提示与建议
总断吉/凶（分数，顺利倾向约 xx%）。用一两句把卦辞翻成人话：
门是收局（开/休/生宜动，伤/杜/死宜守），星是过程，神是谁在场。
空亡、伏吟、反吟、古辞格局也翻成白话。
最后给宜忌。此段由盘面分值生成，不交给大模型胡编。
```

第三段由 `src/engine/luck-plain.ts` 根据 `level`、门星神、空亡、伏吟反吟、格局拼出，接口侧会把模型自己写的「三、」整段替换掉。

---

## 6. 函数对照（其它项目本地 import）

```js
import { qimen } from "../src/api.ts";
const r = await qimen.scan({ eventId: "career", personName: "李四", civil: { year: 2026, month: 8, day: 30, hour: 9, minute: 0 } });
```

| HTTP | 函数 | 返回 |
|---|---|---|
| POST /v1/chart | `qimen.chart(q)` | `{ subject, location, civil, chart, model }` |
| POST /v1/events | `qimen.events(q)` | 同上 + `events` |
| POST /v1/event | `qimen.event(q)` | 同上 + `event` |
| POST /v1/people | `qimen.people(q)` | 同上 + `people` |
| POST /v1/directions | `qimen.directions(q)` | 同上 + `directions` |
| POST /v1/weather | `qimen.weather(q)` | 同上 + `weather` |
| POST /v1/fortune | `qimen.fortune(q)` | 同上 + `fortune` |
| POST /v1/natal | `qimen.natal(q)` | 同上 + `natal` |
| POST /v1/lots | `qimen.lots(code)` | `{ ju, steps }` |
| POST /v1/scan | `qimen.scan(q)` | 全盘 |
| POST /v1/consult/compose | `qimen.consultCompose(q)` | `scene` |
| POST /v1/consult/ask | `qimen.consultAsk(q)` | `text` |
| PUT /v1/config | `qimen.configure(patch)` | 掩码后的配置 |
| GET /v1/config | `qimen.getConfig()` | 掩码后的配置 |
| GET /v1/models | `qimen.models()` | 本地权重摘要 |

函数直接返回数据对象，不包 `{ ok, data }`。失败时抛错。

若微信等必须走 HTTP，请在**你自己的服务器**上 `npm start`，不要指望 GitHub。

---

## 7. 分值约定

- 事项、运势、天气有雨倾向均用同一套：加权得 S，P=σ(S/22)，`probability` 为百分数。
- 吉凶档：大吉 ≥42，吉 ≥20，小吉 ≥6，平 (−6,6)，小凶 >−20，凶 >−42，否则大凶。
- 神应开始、星应过程、门应收局。
- 四柱合冲刑：合加分、冲刑克减分；日时互作再加一层。
- 供学习，并非定论。

---

## 8. 特征维与本地文件

天气/事项共用的 `SCORE_FEATURE_NAMES` 共 **52 维**：

1. 神 8 + 门 8 + 星 9
2. 阴遁、伏吟、反吟、坎空
3. 年积日 sin / cos
4. 四柱 21 维：年/月/日/时支合冲刑地盘（12）+ 日时支合冲刑害克（5）+ 日/时干合克地盘（4）

| 文件 | 用途 |
|---|---|
| `models/qimen-district-weights-2020-2026.json` | 全国区县降水逻辑回归（前 31 维；推理时补四柱层） |
| `src/engine/weather-weights.json` | 12 气候带天气（52 维，含四柱） |
| `src/engine/event-calibration.json` | 十二类事项门星神校准 |
| `src/engine/pillar-earth.ts` | 四柱×地盘规则 |
| `src/engine/luck-plain.ts` | 智断第三段白话卦辞 |

本地重训气候带：`npm run train:weather`。
