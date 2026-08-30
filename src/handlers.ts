import { loadConfig, publicConfig, saveConfig } from "./config";
import { composeAssociation, consultChart } from "./consult";
import { SYMBOL_LIB } from "./engine/symbols";
import { EVENTS } from "./engine/constants";
import { SUBJECT_OPTIONS, displayEvent } from "./engine/subject";
import { ACTIVITY_META } from "./engine/direction";
import { digitRootToJu } from "./engine/classic";
import { provinces, citiesOf, areasOf } from "./engine/china";
import { loadDistrictWeights } from "./engine/district-model";
import { llmChat } from "./llm";
import {
  packChart,
  packDirections,
  packEvent,
  packEvents,
  packExtract,
  packFortune,
  packNatal,
  packPeople,
  packWeather,
  resolveQuery,
  type QueryBody,
} from "./kernel";
import { subjectPrompt } from "./engine/subject";

function ok<T>(data: T) {
  return { ok: true as const, data };
}

export async function dispatch(method: string, path: string, body: QueryBody & Record<string, unknown>, query: URLSearchParams) {
  const p = path.replace(/\/+$/, "") || "/";

  if (method === "GET" && (p === "/" || p === "/v1")) {
    return ok({
      name: "wechat-qimen-divination-service",
      version: "1.0.0",
      docs: "/v1 与仓库 docs/API.md",
      endpoints: [
        "GET /health",
        "GET /v1/catalog",
        "GET /v1/locations",
        "GET /v1/symbols",
        "GET /v1/models",
        "GET /v1/config",
        "PUT /v1/config",
        "POST /v1/config/test-llm",
        "POST /v1/chart",
        "POST /v1/scan",
        "POST /v1/divination",
        "POST /v1/events",
        "POST /v1/event",
        "POST /v1/people",
        "POST /v1/directions",
        "POST /v1/weather",
        "POST /v1/fortune",
        "POST /v1/natal",
        "POST /v1/lots",
        "POST /v1/consult/compose",
        "POST /v1/consult/ask",
      ],
    });
  }

  if (method === "GET" && p === "/health") {
    const cfg = await loadConfig();
    return ok({ status: "up", llm: { enabled: cfg.llm.enabled, hasKey: Boolean(cfg.llm.apiKey), model: cfg.llm.model } });
  }

  if (method === "GET" && p === "/v1/catalog") {
    return ok({
      events: EVENTS.map((e) => ({ id: e.id, name: e.name, brief: e.brief, yongShen: e.yongShen, target: e.target })),
      subjects: SUBJECT_OPTIONS,
      activities: ACTIVITY_META,
      casting: ["chaibu", "lots"],
      eventNamesBySubject: {
        person: Object.fromEntries(EVENTS.map((e) => [e.id, displayEvent(e.id, "person")])),
        city: Object.fromEntries(EVENTS.map((e) => [e.id, displayEvent(e.id, "city")])),
      },
    });
  }

  if (method === "GET" && p === "/v1/locations") {
    const provinceCode = query.get("provinceCode") || query.get("province") || "";
    const cityCode = query.get("cityCode") || query.get("city") || "";
    if (!provinceCode) {
      return ok({ provinces: provinces().map((x) => ({ code: x.code, name: x.n, nCities: x.c.length })) });
    }
    const pnode = provinces().find((x) => x.code === provinceCode || x.n === provinceCode);
    if (!pnode) return { ok: false as const, error: "未找到该省", status: 404 };
    if (!cityCode) {
      return ok({
        province: { code: pnode.code, name: pnode.n },
        cities: citiesOf(pnode.code).map((c) => ({ code: c.code, name: c.n, nDistricts: c.a.length })),
      });
    }
    const cnode = citiesOf(pnode.code).find((c) => c.code === cityCode || c.n === cityCode);
    if (!cnode) return { ok: false as const, error: "未找到该市", status: 404 };
    return ok({
      province: { code: pnode.code, name: pnode.n },
      city: { code: cnode.code, name: cnode.n },
      districts: areasOf(pnode.code, cnode.code).map((a) => ({ code: a.code, name: a.n })),
    });
  }

  if (method === "GET" && p === "/v1/symbols") {
    return ok({ count: SYMBOL_LIB.length, items: SYMBOL_LIB });
  }

  if (method === "GET" && p === "/v1/models") {
    const pack = await loadDistrictWeights();
    const cfg = await loadConfig();
    return ok({
      engine: "chao-bu qimen + additive S, P=σ(S/22), SCORE_SCALE=22",
      local: {
        districtWeather: {
          file: "models/qimen-district-weights-2020-2026.json",
          nDistricts: pack.nDistricts,
          nCities: pack.nCities,
          nProvinces: pack.nProvinces,
          start: pack.start,
          end: pack.end,
          trainUntil: pack.trainUntil,
          method: pack.method,
          ml: pack.ml,
        },
        climateBands: "src/engine/weather-weights.json",
        eventCalibration: "src/engine/event-calibration.json",
        symbols: SYMBOL_LIB.length,
      },
      llm: publicConfig(cfg).llm,
    });
  }

  if (method === "GET" && p === "/v1/config") {
    return ok(publicConfig(await loadConfig()));
  }

  if (method === "PUT" && p === "/v1/config") {
    const next = await saveConfig({
      serviceToken: typeof body.serviceToken === "string" ? body.serviceToken : undefined,
      llm: body.llm && typeof body.llm === "object" ? (body.llm as Record<string, unknown>) : undefined,
    } as Parameters<typeof saveConfig>[0]);
    return ok(publicConfig(next));
  }

  if (method === "POST" && p === "/v1/config/test-llm") {
    const r = await llmChat(
      [
        { role: "system", content: "只回答一个字：好" },
        { role: "user", content: "测试连通" },
      ],
      { maxTokens: 8 },
    );
    if (!r.ok) return { ok: false as const, error: r.error, status: 502 };
    return ok({ reply: r.text });
  }

  if (method === "POST" && p === "/v1/lots") {
    const code = String(body.lotsCode ?? body.code ?? "");
    const r = digitRootToJu(code);
    return ok({ code: r.source, ju: r.ju, steps: r.steps });
  }

  const r = resolveQuery(body);

  if (method === "POST" && p === "/v1/chart") {
    return ok(packChart(r));
  }

  if (method === "POST" && p === "/v1/events") {
    return ok({ ...packChart(r), events: packEvents(r) });
  }

  if (method === "POST" && p === "/v1/event") {
    return ok({ ...packChart(r), event: packEvent(r) });
  }

  if (method === "POST" && p === "/v1/people") {
    return ok({ ...packChart(r), people: packPeople(r), zhiFu: r.chart.palaces[r.chart.meta.zhiFuPalace] });
  }

  if (method === "POST" && p === "/v1/directions") {
    return ok({ ...packChart(r), directions: packDirections(r) });
  }

  if (method === "POST" && p === "/v1/weather") {
    return ok({ ...packChart(r), weather: await packWeather(r) });
  }

  if (method === "POST" && p === "/v1/fortune") {
    return ok({ ...packChart(r), fortune: packFortune(r) });
  }

  if (method === "POST" && p === "/v1/natal") {
    return ok({ ...packChart(r), ...packNatal(r) });
  }

  if (method === "POST" && (p === "/v1/scan" || p === "/v1/divination")) {
    const events = packEvents(r);
    const weather = await packWeather(r).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
    return ok({
      ...packChart(r),
      events,
      focus: packEvent(r),
      people: packPeople(r),
      directions: packDirections(r),
      fortune: packFortune(r),
      natal: packNatal(r).natal,
      weather,
    });
  }

  if (method === "POST" && p === "/v1/consult/compose") {
    const extracted = packExtract(r);
    const score = extracted.score;
    const result = await composeAssociation({
      question: String(body.question ?? `请就「${score.name}」围绕「${r.who}」联想一件最合理的具体事情。`),
      eventName: score.name,
      level: score.level,
      score: score.score,
      pack: extracted.pack.prompt,
      brief: extracted.pack.brief,
      person: r.who,
      gender: r.gender,
      location: r.scope,
      subjectLine: subjectPrompt(r.subjectKind, r.who, r.scope),
    });
    if (!result.ok) return { ok: false as const, error: result.error, status: 502 };
    return ok({ ...packChart(r), event: score, tokens: extracted.pack.tokens, scene: result.result });
  }

  if (method === "POST" && p === "/v1/consult/ask") {
    const extracted = packExtract(r);
    const score = extracted.score;
    const palace = r.chart.palaces[score.palaceId];
    const result = await consultChart({
      question: String(body.question ?? ""),
      pack: extracted.pack.prompt,
      brief: extracted.pack.brief,
      history: Array.isArray(body.history) ? body.history : [],
      person: r.who,
      location: r.scope,
      subjectLine: subjectPrompt(r.subjectKind, r.who, r.scope),
      luck: {
        eventName: score.name,
        subject: r.who,
        level: score.level,
        score: score.score,
        probability: score.probability,
        bagua: palace.bagua,
        god: palace.god,
        star: palace.star,
        gate: palace.gate,
        kong: palace.isKong,
        fuYin: r.chart.meta.fuYin,
        fanYin: r.chart.meta.fanYin,
        patterns: score.patterns,
      },
    });
    if (!result.ok) return { ok: false as const, error: result.error, status: 502 };
    return ok({ ...packChart(r), event: score, text: result.text });
  }

  return { ok: false as const, error: `未知接口 ${method} ${p}`, status: 404 };
}
