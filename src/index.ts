import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadConfig } from "./config";
import { dispatch } from "./handlers";

try {
  const raw = readFileSync(".env", "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
} catch {
  /* no .env */
}

const PORT = Number(process.env.PORT || process.env.QIMEN_PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";

function cors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.QIMEN_CORS || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let n = 0;
  for await (const c of req) {
    n += (c as Buffer).length;
    if (n > 1_000_000) throw new Error("请求体过大");
    chunks.push(c as Buffer);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("JSON 须为对象");
  return parsed as Record<string, unknown>;
}

function send(res: ServerResponse, status: number, payload: unknown) {
  cors(res);
  const body = JSON.stringify(payload);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

async function authorize(req: IncomingMessage, path: string, method: string): Promise<string | null> {
  const cfg = await loadConfig();
  if (!cfg.serviceToken) return null;
  const open =
    (method === "GET" && (path === "/health" || path === "/" || path === "/v1")) ||
    (method === "PUT" && path === "/v1/config" && !cfg.serviceToken);
  if (open) return null;
  const auth = req.headers.authorization || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (token !== cfg.serviceToken) return "需要 Authorization: Bearer <serviceToken>";
  return null;
}

const server = createServer(async (req, res) => {
  cors(res);
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const method = (req.method || "GET").toUpperCase();
  const path = url.pathname;

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const denied = await authorize(req, path.replace(/\/+$/, "") || "/", method);
    if (denied) {
      send(res, 401, { ok: false, error: denied });
      return;
    }
    const body = method === "GET" ? {} : await readBody(req);
    const result = await dispatch(method, path, body, url.searchParams);
    const status = result.ok ? 200 : (result as { status?: number }).status ?? 400;
    send(res, status, result);
  } catch (e) {
    send(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`奇门遁甲接口服务 ${HOST}:${PORT}  ·  GET /health  GET /v1`);
});
