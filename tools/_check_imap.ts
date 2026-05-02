/**
 * Verificación atómica de credenciales IMAP (Zoho).
 * Fase 2 — Protocolo V.L.A.E.G.
 *
 * REGLA CRÍTICA: modo READ-ONLY. NO marca mensajes como leídos,
 * NO modifica flags, NO mueve nada.
 *
 * Uso: npx tsx tools/_check_imap.ts
 */

import 'dotenv/config';

const TIMEOUT_MS = 15_000;
const SERVICIO = 'IMAP Zoho';

async function main(): Promise<void> {
  const host = process.env.IMAP_HOST?.trim();
  const portRaw = process.env.IMAP_PORT?.trim();
  const user = process.env.IMAP_USER?.trim();
  const pass = process.env.IMAP_PASS?.trim();

  if (!host || !portRaw || !user || !pass) {
    console.log(`[SKIP] ${SERVICIO}: credenciales no configuradas`);
    process.exit(0);
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    console.log(`[FAIL] ${SERVICIO}: IMAP_PORT inválido (${portRaw})`);
    process.exit(1);
  }

  // Carga dinámica de imapflow para poder reportar SKIP si no está instalado.
  let ImapFlow: typeof import('imapflow').ImapFlow;
  try {
    const mod = await import('imapflow');
    ImapFlow = mod.ImapFlow;
  } catch {
    console.log(
      `[SKIP] ${SERVICIO}: dependencia 'imapflow' no instalada (npm i imapflow)`
    );
    process.exit(0);
  }

  const client = new ImapFlow({
    host,
    port,
    secure: port === 993, // IMAPS implícito en 993
    auth: { user, pass },
    logger: false,
    socketTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
  });

  const inicio = Date.now();
  try {
    await client.connect();

    // LIST: enumera todos los folders del buzón.
    const folders = await client.list();
    const totalFolders = folders.length;

    // mailboxOpen con readOnly:true → SELECT INBOX (READ-ONLY).
    // No marca \Seen, no modifica nada.
    const inbox = await client.mailboxOpen('INBOX', { readOnly: true });
    const exists = inbox.exists ?? 0;

    // Búsqueda de no leídos (SEARCH UNSEEN) — read-only, no muta flags.
    let unread = 0;
    try {
      const unseen = await client.search({ seen: false }, { uid: true });
      unread = Array.isArray(unseen) ? unseen.length : 0;
    } catch {
      unread = -1; // no soportado por el server, no es fallo
    }

    const latencia = Date.now() - inicio;
    const readOnlyConfirmado = inbox.readOnly === true ? 'READ-ONLY' : 'RW(!)';

    console.log(
      `[OK] ${SERVICIO} — host=${host}:${port} user=${user} ` +
        `folders=${totalFolders} inbox.exists=${exists} unread=${unread} ` +
        `mode=${readOnlyConfirmado} latencia=${latencia}ms`
    );

    await client.mailboxClose();
    await client.logout();
    process.exit(0);
  } catch (err) {
    const latencia = Date.now() - inicio;
    const mensaje = err instanceof Error ? err.message : String(err);
    try {
      await client.logout();
    } catch {
      /* noop */
    }
    console.log(
      `[FAIL] ${SERVICIO}: ${mensaje} (latencia=${latencia}ms host=${host}:${port})`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  const mensaje = err instanceof Error ? err.message : String(err);
  console.log(`[FAIL] ${SERVICIO}: error inesperado: ${mensaje}`);
  process.exit(1);
});
