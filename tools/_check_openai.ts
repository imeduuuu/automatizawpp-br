/**
 * tools/_check_openai.ts
 *
 * Fase 2 — Link del Protocolo V.L.A.E.G.
 * Verificación atómica de credenciales OpenAI.
 *
 * Sólo lectura: GET /v1/models. NO se realizan llamadas, ni envíos.
 *
 * Uso: npx tsx tools/_check_openai.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// --- Carga de .env y .env.local sin dependencias externas ---
function loadDotenv(file: string): void {
  if (!existsSync(file)) return;
  const raw = readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = val;
    }
  }
}

const ROOT = resolve(__dirname, "..");
loadDotenv(resolve(ROOT, ".env"));
loadDotenv(resolve(ROOT, ".env.local"));

const SERVICE = "openai";
const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = (process.env.OPENAI_MODEL ?? "gpt-4.1").trim();

async function main(): Promise<number> {
  if (!apiKey) {
    console.log(`[SKIP] ${SERVICE}: credenciales no configuradas (OPENAI_API_KEY ausente)`);
    return 0;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const t0 = Date.now();

  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    });
    const latency = Date.now() - t0;

    const rl = {
      limitRequests: res.headers.get("x-ratelimit-limit-requests"),
      remainingRequests: res.headers.get("x-ratelimit-remaining-requests"),
      limitTokens: res.headers.get("x-ratelimit-limit-tokens"),
      remainingTokens: res.headers.get("x-ratelimit-remaining-tokens"),
    };

    if (!res.ok) {
      const body = await res.text();
      console.log(
        `[FAIL] ${SERVICE}: HTTP ${res.status} ${res.statusText} (${latency}ms) — ${body.slice(0, 200)}`,
      );
      return 1;
    }

    const data = (await res.json()) as { data?: Array<{ id: string }> };
    const models = data.data ?? [];
    const modelIds = models.map((m) => m.id);
    const hasConfigured = modelIds.includes(model);

    console.log(
      `[OK] ${SERVICE} — ${models.length} modelos accesibles, modelo configurado="${model}" ${hasConfigured ? "DISPONIBLE" : "NO ENCONTRADO"} (${latency}ms)`,
    );
    console.log(
      `      rate limits: req=${rl.remainingRequests ?? "?"}/${rl.limitRequests ?? "?"} tok=${rl.remainingTokens ?? "?"}/${rl.limitTokens ?? "?"}`,
    );

    if (!hasConfigured) {
      const candidates = modelIds.filter((id) => id.includes("gpt-4")).slice(0, 5);
      if (candidates.length) {
        console.log(`      sugerencias gpt-4*: ${candidates.join(", ")}`);
      }
    }

    return 0;
  } catch (err) {
    const latency = Date.now() - t0;
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[FAIL] ${SERVICE}: ${msg} (${latency}ms)`);
    return 1;
  } finally {
    clearTimeout(timeout);
  }
}

main().then((code) => process.exit(code));
