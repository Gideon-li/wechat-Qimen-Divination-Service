# 气候带判定门槛与文案

各县 31 维权重不改。湿润区回归已经把阴雨类神星门推正，干旱区推负。本层只改两件事：

1. **门槛**：按该县（或气候带）雨日率决定「多高才报雨、多低才报晴」。
2. **文案**：湿区把太阴、天芮、九地、休门等写成阴转雨；旱区写成高云、扬沙、难得成雨。

## 分档

| 雨日率 | 带 | 报雨门槛（分值 S） | 报晴门槛 |
|---|---|---|---|
| < 20% | 干旱 | ≥ 12 | ≤ 0 |
| 20–35% | 偏干 | ≥ 8 | ≤ −4 |
| 35–50% | 过渡 | ≥ 6 | ≤ −6（与旧规则相同） |
| 50–65% | 偏湿 | ≥ 0 | ≤ −10 |
| ≥ 65% | 多雨 | ≥ −4 | ≤ −16 |

分值仍是 `S = 22 × logit`。`rainProb` 仍由原 sigmoid 给出，不因门槛改写概率。

## 返回字段 `climate`

```json
{
  "band": "humid",
  "label": "偏湿",
  "rainRate": 0.57,
  "rainThresholdScore": 0,
  "sunThresholdScore": -10,
  "majorityBaseline": 0.57,
  "rainAccTest": 0.67,
  "skillOverBaseline": 0.10,
  "note": "本地雨日率 57.0%，属偏湿带。…"
}
```

湿润区请看 `skillOverBaseline`（相对「天天报雨」多出来的点），不要只看 `rainAccTest`。

实现：`src/engine/climate-intent.ts`。
