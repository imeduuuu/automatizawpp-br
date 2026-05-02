/**
 * tools/_check_bird.ts
 *
 * Fase 2 — Link del Protocolo V.L.A.E.G.
 * Verificación atómica de credenciales Bird.
 *
 * Sólo lectura: GET /workspaces/<id>/channels.
 * NO se envían WhatsApps. NO se envían emails. NO se realizan llamadas.
 *
 * Uso: npx tsx tools/_check_bird.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

const SERVICE = "bird";
const apiKey = process.env.BIRD_API_KEY?.trim();
const workspaceId = process.env.BIRD_WORKSPACE_ID?.trim();
const expectedWa = process.env.BIRD_CHANNEL_ID?.trim();
const expectedEmail = process.env.BIRD_EMAIL_CHANNEL_ID?.trim();

interface BirdChannel {
  id?: string;
  channelId?: string;
  name?: string;
  type?: string;
  platform?: string;
  platformId?: string;
  status?: string;
  identifier?: string;
}

interface BirdChannelsPage {
  results?: BirdChannel[];
  data?: BirdChannel[];
  nextPageToken?: string;
}

// Normaliza platformId ("voice-messagebird", "email-sparkpost", "whatsapp", ...) a familia.
function familyOf(ch: BirdChannel): string {
  const raw = (ch.platformId ?? ch.platform ?? ch.type ?? "unknown")
    .toString()
    .toLowerCase();
  if (raw.includes("whatsapp")) return "whatsapp";
  if (raw.includes("voice")) return "voice";
  if (raw.includes("email") || raw.includes("sms")) {
    return raw.includes("email") ? "email" : "sms";
  }
  return raw;
}

async function fetchPage(
  workspaceId: string,
  apiKey: string,
  pageToken: string | undefined,
  signal: AbortSignal,
): Promise<{ res: Response; json: BirdChannelsPage | BirdChannel[] }> {
  const u = new URL(`https://api.bird.com/workspaces/${workspaceId}/channels`);
  if (pageToken) u.searchParams.set("pageToken", pageToken);
  const res = await fetch(u, {
    method: "GET",
    headers: {
      Authorization: `AccessKey ${apiKey}`,
      Accept: "application/json",
    },
    signal,
  });
  const json = res.ok ? ((await res.json()) as BirdChannelsPage | BirdChannel[]) : [];
  return { res, json };
}

async function main(): Promise<number> {
  if (!apiKey || !workspaceId) {
    console.log(
      `[SKIP] ${SERVICE}: credenciales no configuradas (api_key=${apiKey ? "ok" : "missing"}, workspace=${workspaceId ? "ok" : "missing"})`,
    );
    return 0;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const t0 = Date.now();

  try {
    const all: BirdChannel[] = [];
    let pageToken: string | undefined;
    let pages = 0;
    let firstStatus = 0;

    while (pages < 10) {
      const { res, json } = await fetchPage(workspaceId, apiKey, pageToken, controller.signal);
      if (pages === 0) firstStatus = res.status;
      if (!res.ok) {
        const latency = Date.now() - t0;
        const body = typeof json === "string" ? json : JSON.stringify(json);
        console.log(
          `[FAIL] ${SERVICE}: HTTP ${res.status} ${res.statusText} (${latency}ms) — ${body.slice(0, 200)}`,
        );
        return 1;
      }
      const page: BirdChannelsPage = Array.isArray(json) ? { results: json } : json;
      const items = page.results ?? page.data ?? [];
      all.push(...items);
      pages += 1;
      pageToken = page.nextPageToken;
      if (!pageToken) break;
    }

    const latency = Date.now() - t0;

    const byFamily = new Map<string, number>();
    for (const ch of all) {
      const f = familyOf(ch);
      byFamily.set(f, (byFamily.get(f) ?? 0) + 1);
    }

    const byId = new Map<string, BirdChannel>();
    for (const c of all) {
      const id = (c.id ?? c.channelId ?? "").toString();
      if (id) byId.set(id, c);
    }

    const wpp = expectedWa ? byId.get(expectedWa) : undefined;
    const email = expectedEmail ? byId.get(expectedEmail) : undefined;
    const wppFamily = wpp ? familyOf(wpp) : null;
    const emailFamily = email ? familyOf(email) : null;

    const typesStr =
      [...byFamily.entries()].map(([k, v]) => `${k}=${v}`).join(", ") || "ninguno";

    console.log(
      `[OK] ${SERVICE} — ${all.length} channels (${typesStr}) páginas=${pages} http=${firstStatus} (${latency}ms)`,
    );

    const wppNote =
      wppFamily === null
        ? "<no configurado>"
        : wppFamily === "whatsapp"
          ? "ENCONTRADO (whatsapp OK)"
          : wpp
            ? `ENCONTRADO PERO ES ${wppFamily.toUpperCase()} — NO es WhatsApp`
            : "NO ENCONTRADO";
    const emailNote =
      emailFamily === null
        ? "<no configurado>"
        : emailFamily === "email"
          ? "ENCONTRADO (email OK)"
          : email
            ? `ENCONTRADO PERO ES ${emailFamily.toUpperCase()} — NO es email`
            : "NO ENCONTRADO";

    console.log(
      `      BIRD_CHANNEL_ID       : ${expectedWa ?? "<no configurado>"} → ${wppNote}`,
    );
    console.log(
      `      BIRD_EMAIL_CHANNEL_ID : ${expectedEmail ?? "<no configurado>"} → ${emailNote}`,
    );

    for (const ch of all.slice(0, 10)) {
      const id = ch.id ?? ch.channelId ?? "?";
      const fam = familyOf(ch);
      const platformId = ch.platformId ?? ch.platform ?? ch.type ?? "?";
      const name = ch.name ?? "";
      const ident = ch.identifier ? ` <${ch.identifier}>` : "";
      console.log(`        - [${fam}/${platformId}] ${id} ${name}${ident}`);
    }

    const mismatch =
      (expectedWa && wppFamily && wppFamily !== "whatsapp") ||
      (expectedEmail && emailFamily && emailFamily !== "email");
    const missing =
      (expectedWa && !wpp) || (expectedEmail && !email);
    return mismatch || missing ? 2 : 0;
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
