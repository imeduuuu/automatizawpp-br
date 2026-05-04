/**
 * tools/_check_anthropic.ts
 *
 * Capa 3 A.N.T. — Verificación atómica de credenciales Anthropic (Claude).
 * Fase 2 (Link) del Protocolo V.L.A.E.G.
 *
 * Read-only: GET /v1/models. NO genera tokens ni hace inference.
 * Uso: npx tsx tools/_check_anthropic.ts
 */

const TIMEOUT_MS = 10_000;

async function main() {
  // Carga .env nativa (Node 20.6+)
  try {
    process.loadEnvFile('.env');
  } catch {
    // si no existe, sigue
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
  const provider = process.env.AI_PROVIDER || '(no definido)';

  if (!apiKey || apiKey.length === 0) {
    console.log('[SKIP] anthropic: credenciales no configuradas (ANTHROPIC_API_KEY ausente)');
    process.exit(0);
  }

  const t0 = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      signal: ctrl.signal
    });
    clearTimeout(timer);

    const elapsed = Math.round(performance.now() - t0);

    if (!res.ok) {
      const body = await res.text();
      console.log(`[FAIL] anthropic: HTTP ${res.status} — ${body.slice(0, 200)}`);
      process.exit(1);
    }

    const data = await res.json() as { data: Array<{ id: string; display_name: string }> };
    const models = data.data || [];
    const configured = models.find((m) => m.id === model);
    const ratelimit = res.headers.get('anthropic-ratelimit-requests-remaining') || res.headers.get('x-ratelimit-remaining-requests') || 'n/a';

    console.log(`[OK] anthropic — ${models.length} modelos disponibles (provider=${provider}) latencia=${elapsed}ms`);
    console.log(`     modelo configurado: ${model} → ${configured ? '✓ disponible' : '✗ NO encontrado'}`);
    console.log(`     top 3: ${models.slice(0, 3).map((m) => m.id).join(', ')}`);
    console.log(`     rate limit remaining: ${ratelimit}`);
    process.exit(0);
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[FAIL] anthropic: ${msg}`);
    process.exit(1);
  }
}

main();
