/**
 * _check_brevo.ts — Verificação atómica de credenciais Brevo
 * Fase 2 (V.L.A.E.G.) — somente leitura, NÃO envia emails.
 * Endpoint: GET https://api.brevo.com/v3/account
 */

import { resolve } from "node:path";

// Carrega .env e .env.local (se existirem) usando process.loadEnvFile (Node 20.12+)
function carregarEnv(): void {
  const arquivos = [".env", ".env.local"];
  for (const arquivo of arquivos) {
    try {
      process.loadEnvFile(resolve(process.cwd(), arquivo));
    } catch {
      // arquivo não existe ou já carregado — ignora
    }
  }
}

function extrairRateLimit(headers: Headers): string {
  const candidatos = [
    "x-sib-ratelimit-limit",
    "x-sib-ratelimit-remaining",
    "x-sib-ratelimit-reset",
    "x-rate-limit-limit",
    "x-rate-limit-remaining",
    "x-rate-limit-reset",
    "ratelimit-limit",
    "ratelimit-remaining",
    "ratelimit-reset",
    "retry-after",
  ];
  const partes: string[] = [];
  for (const nome of candidatos) {
    const valor = headers.get(nome);
    if (valor) partes.push(`${nome}=${valor}`);
  }
  return partes.length > 0 ? partes.join(",") : "no-headers";
}

async function verificarBrevo(): Promise<void> {
  carregarEnv();

  const apiKey = process.env.BREVO_API_KEY?.trim() ?? "";
  if (!apiKey) {
    console.log("[SKIP] brevo: credenciais não configuradas");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const resposta = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        "api-key": apiKey,
        accept: "application/json",
      },
      signal: controller.signal,
    });

    const rateLimit = extrairRateLimit(resposta.headers);

    if (!resposta.ok) {
      const corpo = await resposta.text();
      console.log(
        `[FAIL] brevo: ${resposta.status} ${corpo.slice(0, 300)} — rate_limit=${rateLimit}`,
      );
      return;
    }

    const dados = (await resposta.json()) as {
      email?: string;
      companyName?: string;
      plan?: Array<{ type?: string }>;
    };

    const email = dados.email ?? "?";
    const empresa = dados.companyName ?? "?";
    const plano = dados.plan?.[0]?.type ?? "?";

    console.log(
      `[OK] brevo — email=${email} company=${empresa} plan=${plano} — rate_limit=${rateLimit}`,
    );
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.log(`[FAIL] brevo: exception ${mensagem}`);
  } finally {
    clearTimeout(timeout);
  }
}

verificarBrevo();
