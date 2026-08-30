# 奇门遁甲接口服务

给微信小程序 / 公众号 / 其它后端调用的 **无页面** 奇门遁甲服务。

本仓库把「奇门权衡」网站的全部测算能力收成 HTTP JSON 接口，并把底层模型一并打包：

- **本地模型（无需网、无需 Key）**：拆补时盘、求签定局、十二类事项权重、人事六亲、八门方位、年/月/日运、本命年、全国区县天气逻辑回归（2020–2026）。
- **大模型接口（可自配）**：智断联想、追问盘面。兼容 OpenAI `chat/completions`（通义千问 Token Plan、DashScope、Ollama、vLLM）。Key、地址、模型名均可运行时用接口写入。

详细字段与示例见 [docs/API.md](docs/API.md)。

## 一次启动

```bash
git clone https://github.com/Gideon-li/wechat-Qimen-Divination-Service.git
cd wechat-Qimen-Divination-Service
npm install
cp .env.example .env   # 可先空着 Key，稍后用接口配置
npm start
```

默认监听 `0.0.0.0:8787`。健康检查：

```bash
curl -s http://127.0.0.1:8787/health
```

排一盘（本地模型，不必配 Key）：

```bash
curl -s -X POST http://127.0.0.1:8787/v1/scan \
  -H 'Content-Type: application/json' \
  -d '{
    "civil": { "year": 2026, "month": 8, "day": 30, "hour": 10, "minute": 0 },
    "subjectKind": "person",
    "personName": "张三",
    "gender": "male",
    "location": { "province": "浙江省", "city": "温州市", "district": "瓯海区" }
  }'
```

## 自行配置模型与 Key

**方式 A：环境变量**（见 `.env.example`）

**方式 B：接口（推荐给微信后台热更新）**

```bash
curl -s -X PUT http://127.0.0.1:8787/v1/config \
  -H 'Content-Type: application/json' \
  -d '{
    "serviceToken": "请改成你的访问令牌",
    "llm": {
      "enabled": true,
      "baseUrl": "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
      "model": "qwen3.8-flash",
      "apiKey": "sk-你的密钥"
    }
  }'
```

本地 Ollama：

```json
{
  "llm": {
    "enabled": true,
    "baseUrl": "http://127.0.0.1:11434/v1",
    "model": "qwen2.5:7b",
    "apiKey": "ollama"
  }
}
```

写入后落在 `data/config.json`（已 gitignore）。`GET /v1/config` 只回掩码，不回明文 Key。

配置了 `serviceToken` 之后，除 `GET /health` 外均需：

```
Authorization: Bearer 你的令牌
```

测大模型连通：`POST /v1/config/test-llm`。

## 接口一览

| 方法 | 路径 | 是否要大模型 | 说明 |
|---|---|---|---|
| GET | `/health` | 否 | 探活 |
| GET | `/v1` | 否 | 目录 |
| GET | `/v1/catalog` | 否 | 事项/对象/方位活动字典 |
| GET | `/v1/locations` | 否 | 中国省市区 |
| GET | `/v1/symbols` | 否 | 奇门象征库 |
| GET | `/v1/models` | 否 | 已打包模型元数据 |
| GET/PUT | `/v1/config` | 否 | 读/写 Key 与模型地址 |
| POST | `/v1/config/test-llm` | 是 | 测大模型 |
| POST | `/v1/chart` | 否 | 只排盘 |
| POST | `/v1/scan` 或 `/v1/divination` | 否 | 全盘：盘+事项+人事+方位+运势+天气 |
| POST | `/v1/events` | 否 | 十二类事项 |
| POST | `/v1/event` | 否 | 单事项 |
| POST | `/v1/people` | 否 | 人事六亲 |
| POST | `/v1/directions` | 否 | 八门方位 |
| POST | `/v1/weather` | 否 | 区县天气（本地权重） |
| POST | `/v1/fortune` | 否 | 年/月/日运 |
| POST | `/v1/natal` | 否 | 本命年 |
| POST | `/v1/lots` | 否 | 三位数求局 |
| POST | `/v1/consult/compose` | 是 | 智断联想一件事 |
| POST | `/v1/consult/ask` | 是 | 追问盘面（含白话吉凶第三段） |

共同请求体字段见 [docs/API.md](docs/API.md)。

## 底层模型（随仓库）

| 文件 | 用途 |
|---|---|
| `models/qimen-district-weights-2020-2026.json` | 全国每个区县一套降水逻辑回归权重（约 5.3MB） |
| `src/engine/weather-weights.json` | 气候带天气模型 |
| `src/engine/event-calibration.json` | 十二类事项门星神校准 |
| `src/engine/china-pca.json` | 省市区划 |
| `src/engine/symbols.ts` | 75 条符号象征库 |

事项与天气同一套分值：\\(S\\) 加权后 \\(P=\\sigma(S/22)\\)。排盘为拆补时盘（`tyme4ts`）。

## 微信侧调用提示

1. 把本服务部署到你的服务器 / 云函数（不要把 Key 写进小程序）。
2. 小程序 `request` 合法域名填你的 HTTPS 域名。
3. 推荐只暴露 `POST /v1/divination` 与 `POST /v1/consult/ask`，服务端用 `serviceToken` 鉴权。
4. 智断两次调用都走你的服务器，由服务器持有大模型 Key。

供学习参考，并非定论。
