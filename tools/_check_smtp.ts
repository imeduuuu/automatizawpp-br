/**
 * Verificación atómica de credenciales SMTP (Zoho).
 * Fase 2 — Protocolo V.L.A.E.G.
 *
 * REGLA CRÍTICA: NO envía emails reales. Solo handshake + AUTH vía
 * `transporter.verify()` de nodemailer.
 *
 * Uso: npx tsx tools/_check_smtp.ts
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

const TIMEOUT_MS = 15_000;
const SERVICIO = 'SMTP Zoho';

async function main(): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !portRaw || !user || !pass) {
    console.log(`[SKIP] ${SERVICIO}: credenciales no configuradas`);
    process.exit(0);
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    console.log(`[FAIL] ${SERVICIO}: SMTP_PORT inválido (${portRaw})`);
    process.exit(1);
  }

  // Puerto 587 → STARTTLS (secure: false). Puerto 465 → SSL directo (secure: true).
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
    requireTLS: !secure, // fuerza STARTTLS en 587
  });

  const inicio = Date.now();
  try {
    // verify() abre conexión + EHLO + STARTTLS + AUTH; NO envía mensajes.
    const ok = await transporter.verify();
    const latencia = Date.now() - inicio;
    if (ok) {
      console.log(
        `[OK] ${SERVICIO} — host=${host}:${port} secure=${secure} user=${user} latencia=${latencia}ms`
      );
      process.exit(0);
    }
    console.log(`[FAIL] ${SERVICIO}: verify() devolvió false`);
    process.exit(1);
  } catch (err) {
    const latencia = Date.now() - inicio;
    const mensaje = err instanceof Error ? err.message : String(err);
    console.log(
      `[FAIL] ${SERVICIO}: ${mensaje} (latencia=${latencia}ms host=${host}:${port})`
    );
    process.exit(1);
  } finally {
    transporter.close();
  }
}

main().catch((err) => {
  const mensaje = err instanceof Error ? err.message : String(err);
  console.log(`[FAIL] ${SERVICIO}: error inesperado: ${mensaje}`);
  process.exit(1);
});
