/**
 * _check_resend.ts — Verificação atómica de credenciais Resend
 * Fase 2 (V.L.A.E.G.) — somente leitura, NÃO envia emails.
 * Endpoint: GET https://api.resend.com/domains
 */

import { resolve } from "node:path";

function carregarEnv(): void {
  const arquivos = [".env", ".env.local"];
  for (const arquivo of arquivos) {
    try {
      process.loadEnvFile(resolve(process.cwd(), arquivo));
    } catch {
      // ignora
    }
  }
}

function extrairRateLimit(headers: Headers): string {
  const candidatos = [
    "ratelimit-limit",
    "ratelimit-remaining",
    "ratelimit-reset",
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "x-rate-limit-limit",
    "x-rate-limit-remaining",
    "x-rate-limit-reset",
    "retry-after",
  ];
  const partes: string[] = [];
  for (const nome of candidatos) {
    const valor = headers.get(nome);
    if (valor) partes.push(`${nome}=${valor}`);
  }
  return partes.length > 0 ? partes.join(",") : "no-headers";
}

async function verificarResend(): Promise<void> {
  carregarEnv();

  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  if (!apiKey) {
    console.log("[SKIP] resend: credenciais não configuradas");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const resposta = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
      signal: controller.signal,
    });

    const rateLimit = extrairRateLimit(resposta.headers);

    if (!resposta.ok) {
      const corpo = await resposta.text();
      console.log(
        `[FAIL] resend: ${resposta.status} ${corpo.slice(0, 300)} — rate_limit=${rateLimit}`,
      );
      return;
    }

    const dados = (await resposta.json()) as {
      data?: Array<{ name?: string; status?: string; region?: string }>;
    };

    const dominios = dados.data ?? [];
    const resumo =
      dominios.length === 0
        ? "no-domains"
        : dominios
            .map((d) => `${d.name ?? "?"}(${d.status ?? "?"})`)
            .join(",");

    console.log(
      `[OK] resend — domains=[${resumo}] count=${dominios.length} — rate_limit=${rateLimit}`,
    );
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.log(`[FAIL] resend: exception ${mensagem}`);
  } finally {
    clearTimeout(timeout);
  }
}

verificarResend();
