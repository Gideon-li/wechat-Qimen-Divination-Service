import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type LlmConfig = {
  enabled: boolean;
  provider: "openai-compatible";
  baseUrl: string;
  apiKey: string;
  model: string;
  extraHeaders: Record<string, string>;
};

export type AppConfig = {
  llm: LlmConfig;
  serviceToken: string;
};

const DEFAULT_LLM: LlmConfig = {
  enabled: true,
  provider: "openai-compatible",
  baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
  apiKey: "",
  model: "qwen3.8-flash",
  extraHeaders: {},
};

function configPath() {
  return process.env.QIMEN_CONFIG_PATH || join(process.cwd(), "data/config.json");
}

function fromEnv(): AppConfig {
  return {
    llm: {
      ...DEFAULT_LLM,
      enabled: process.env.QIMEN_LLM_ENABLED !== "0",
      baseUrl: process.env.QIMEN_LLM_BASE_URL || DEFAULT_LLM.baseUrl,
      apiKey: process.env.QIMEN_LLM_API_KEY || process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY || "",
      model: process.env.QIMEN_LLM_MODEL || DEFAULT_LLM.model,
    },
    serviceToken: process.env.QIMEN_SERVICE_TOKEN || "",
  };
}

let cached: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cached) return cached;
  const env = fromEnv();
  try {
    const raw = await readFile(configPath(), "utf8");
    const file = JSON.parse(raw) as Partial<AppConfig> & { llm?: Partial<LlmConfig> };
    cached = {
      serviceToken: file.serviceToken ?? env.serviceToken,
      llm: {
        ...env.llm,
        ...(file.llm ?? {}),
        extraHeaders: { ...env.llm.extraHeaders, ...(file.llm?.extraHeaders ?? {}) },
        // env key wins if set
        apiKey: env.llm.apiKey || file.llm?.apiKey || "",
        baseUrl: process.env.QIMEN_LLM_BASE_URL || file.llm?.baseUrl || env.llm.baseUrl,
        model: process.env.QIMEN_LLM_MODEL || file.llm?.model || env.llm.model,
      },
    };
  } catch {
    cached = env;
  }
  return cached;
}

export function peekConfig(): AppConfig {
  return cached ?? fromEnv();
}

export async function saveConfig(patch: Partial<AppConfig> & { llm?: Partial<LlmConfig> }): Promise<AppConfig> {
  const cur = await loadConfig();
  const next: AppConfig = {
    serviceToken: patch.serviceToken !== undefined ? String(patch.serviceToken) : cur.serviceToken,
    llm: {
      ...cur.llm,
      ...(patch.llm ?? {}),
      extraHeaders: { ...cur.llm.extraHeaders, ...(patch.llm?.extraHeaders ?? {}) },
    },
  };
  if (patch.llm?.apiKey === "") next.llm.apiKey = "";
  const path = configPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(next, null, 2), "utf8");
  cached = next;
  return next;
}

export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "*".repeat(key.length);
  return `${key.slice(0, 4)}***${key.slice(-4)}`;
}

export function publicConfig(cfg: AppConfig) {
  return {
    llm: {
      enabled: cfg.llm.enabled,
      provider: cfg.llm.provider,
      baseUrl: cfg.llm.baseUrl,
      model: cfg.llm.model,
      apiKey: maskKey(cfg.llm.apiKey),
      hasKey: Boolean(cfg.llm.apiKey),
      extraHeaders: Object.keys(cfg.llm.extraHeaders),
    },
    serviceToken: cfg.serviceToken ? maskKey(cfg.serviceToken) : "",
    hasServiceToken: Boolean(cfg.serviceToken),
  };
}

export function resetConfigCache() {
  cached = null;
}
