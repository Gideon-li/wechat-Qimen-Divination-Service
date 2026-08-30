import { loadConfig } from "./config";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function llmChat(
  messages: ChatMessage[],
  opts?: { json?: boolean; maxTokens?: number },
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const cfg = await loadConfig();
  if (!cfg.llm.enabled) return { ok: false, error: "大模型未开启，请先 PUT /v1/config 打开 llm.enabled" };
  if (!cfg.llm.apiKey) return { ok: false, error: "未配置大模型 API Key。PUT /v1/config { llm: { apiKey, baseUrl, model } }" };
  const base = cfg.llm.baseUrl.replace(/\/+$/, "");
  const url = `${base}/chat/completions`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.llm.apiKey}`,
    "Content-Type": "application/json",
    ...cfg.llm.extraHeaders,
  };
  const body: Record<string, unknown> = {
    model: cfg.llm.model,
    messages,
    max_tokens: opts?.maxTokens ?? 700,
    temperature: 0.7,
  };
  if (opts?.json) body.response_format = { type: "json_object" };
  // Qwen compatible extras; harmless if ignored by other servers
  body.enable_thinking = false;
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  } catch (e) {
    return { ok: false, error: `无法连接大模型：${e instanceof Error ? e.message : String(e)}` };
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false, error: `模型接口 ${res.status}${t ? "：" + t.slice(0, 160) : ""}` };
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "模型没有返回文字" };
  return { ok: true, text };
}

export function parseJsonObject(text: string): Record<string, unknown> | null {
  const raw = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const v = JSON.parse(raw.slice(start, end + 1)) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
