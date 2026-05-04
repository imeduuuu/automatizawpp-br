# Findings — AutomatizaWPP

> Descubrimientos, restricciones y aprendizajes. Cada error encontrado se documenta aquí para que NUNCA SE REPITA.

## Incidentes documentados

### 2026-05-02 — DNS apuntando a Vercel cuando debía estar en DigitalOcean

**Síntoma:** Cambios CSS en servidor DO no se reflejaban en `https://automatizawpp.com`. La página seguía sirviendo desde Vercel.

**Causa raíz:** Nameservers del dominio en GoDaddy seguían apuntando a `ns1.vercel-dns.com` y `ns2.vercel-dns.com`, no a DigitalOcean.

**Fix:** Cambio de nameservers en GoDaddy a `ns1.digitalocean.com`, `ns2.digitalocean.com`, `ns3.digitalocean.com`. Propagación parcial: Google DNS (8.8.8.8) resolvía DO antes que CloudFlare DNS (1.1.1.1).

**Lección:** Antes de tocar código en producción, verificar SIEMPRE con `dig <dominio>` que el DNS apunta al servidor correcto. Cross-check con `dig @8.8.8.8` y `dig @1.1.1.1` para detectar propagación parcial.

---

### 2026-05-02 — Nginx en DO sin SSL/HTTPS

**Síntoma:** Tras propagación DNS, navegador mostraba `ERR_CONNECTION_REFUSED` al acceder a `https://automatizawpp.com`. HSTS cacheado de Vercel forzaba HTTPS y nginx solo escuchaba en puerto 80.

**Causa raíz:** Nginx instalado solo con configuración HTTP. Sin certificado SSL.

**Fix:** `certbot --nginx -d automatizawpp.com -d www.automatizawpp.com --redirect`. Renovación automática programada.

**Lección:** Tras migrar DNS a un nuevo servidor, verificar **inmediatamente** que el servidor tiene SSL configurado. Comando de verificación: `ss -tlnp | grep -E ':443|:80'`.

---

### 2026-05-02 — Login form con clases CSS sin estilos correspondientes

**Síntoma:** Botón "Entrar" aparecía a la derecha en vez de debajo de los inputs.

**Causa raíz:** Componentes usaban clases `.ds-auth-wrap`, `.ds-auth-card`, `.ds-input`, `.ds-button` que NO estaban definidas en `globals.css`. El form también usaba `display:grid` sin `grid-template-columns`, lo que causaba layout impredecible.

**Fix:** Reescribir `LoginForm.tsx` y `AuthPageShell.tsx` con estilos inline (no dependientes de clases CSS globales). El form ahora tiene `gridTemplateColumns:'1fr'` explícito.

**Lección:** Al usar `display:grid`, SIEMPRE definir `grid-template-columns` explícitamente. Para formularios de auth, preferir estilos inline sobre clases globales — evita conflictos con Tailwind preflight y otros resets CSS.

---

### 2026-05-02 — DATABASE_URL apuntaba a credenciales por defecto (`postgres:postgres`)

**Síntoma:** Login API retornaba `{"ok":false,"error":"Error en la autenticación. Intente más tarde."}`. PM2 logs mostraban `PrismaClientInitializationError: Authentication failed against database server, the provided database credentials for postgres are not valid`.

**Causa raíz:** `/opt/automatizawpp/.env.production.local` tenía `DATABASE_URL="postgresql://postgres:postgres@165.227.175.193:5432/sales_os"` en lugar de las credenciales reales `botflow:BotFlowDB2026!`. El archivo había sido sobrescrito en algún rebuild de la sesión.

**Fix:** Reescribir `.env.production.local` con `DATABASE_URL="postgresql://botflow:BotFlowDB2026!@165.227.175.193:5432/sales_os"`. PM2 delete + start (no solo restart) para recargar variables de entorno.

**Lección crítica:** PM2 `restart` NO recarga variables de entorno. Para tomar cambios en `.env`, usar `pm2 delete <name> && pm2 start ...` o `pm2 restart <name> --update-env`. Nunca asumir que `pm2 restart` basta.

---

### 2026-05-03 — `RESEND_API_KEY` en producción retorna 401 "API key is invalid" — RESUELTO en Sprint 1.8

**Síntoma:** Tests E2E del Sprint 1.7 muestran que el flow inbound completo persiste el Message OUTBOUND en DB con `metadata.deliveryError = "Resend 401 ..."`, pero ningún email real se entrega.

**Causa raíz:** El `.env.production.local` del droplet **no tenía** `RESEND_API_KEY` definida. Heredaba el valor placeholder `"your-resend-key-here"` del `.env` legacy.

**Fix aplicado (Sprint 1.8):** Copié la key válida ya existente en `.env` local (`re_Nd1ybj1K_...`) a `/opt/automatizawpp/.env.production.local` + `RESEND_FROM="AutomatizaWPP <hola@automatizawpp.com>"`. `pm2 restart --update-env`. Verificación E2E: `delivery.sent:true`, `providerMessageId: ac7b2173-...`, `deliveryStatus:sent` en `Message.metadata`.

**Lección:** Los `.env.*.local` del servidor requieren auditoría completa de las keys que usa la app — no asumir que heredan del `.env` cuando ese tiene placeholders. Test `tools/_check_resend.ts` actualmente lee `.env` (no `.env.production.local`), debería tener flag `--env=production` para verificar el entorno real. Deuda pendiente.

---

### 2026-05-03 — Quiet hours timezone-blind (UTC en lugar de Workspace.timezone)

**Síntoma:** Tests E2E iniciales caían en `HOLD: Within quiet hours (21:00 - 9:00)` porque el servidor está en UTC y el default `QUIET_HOURS_START=21 / END=9` se evalúa con `new Date().getHours()` en UTC.

**Causa raíz:** `src/lib/agents/orchestrator.ts:228-242` usa `currentHour = new Date().getHours()` ignorando `Workspace.timezone`. Para clientes brasileños (`America/Sao_Paulo` UTC-3), las quiet hours UTC 21-09 = local 18:00-06:00, bloqueando casi toda la jornada laboral local.

**Fix temporal usado en E2E:** override env `QUIET_HOURS_START=0 QUIET_HOURS_END=0 MAX_TOUCHES_PER_DAY=999` durante el test, restaurar al final.

**Fix permanente pendiente (Sprint futuro):** `checkCompliance` debe leer `workspace.timezone` y calcular `currentHour` con `Intl.DateTimeFormat('en-US', { timeZone: workspace.timezone, hour: 'numeric' })`.

**Lección:** Todo cálculo de tiempo en orquestación multi-tenant debe ser timezone-aware del workspace, nunca `Date.getHours()` directo.

---

### 2026-05-02 — Rate limit de login en memoria bloquea reintentos legítimos

**Síntoma:** Tras múltiples intentos de login (incluso con credenciales válidas), el endpoint `/api/auth/login` retorna `{"ok":false,"error":"Error en la autenticación. Intente más tarde."}` aunque la API esté sana.

**Causa raíz:** `src/app/api/auth/login/route.ts` mantiene un `Map<string, { count, resetTime }>` en memoria del proceso (5 intentos / 15 min por email). Si el usuario o el debugging acumulan fallos, el email queda bloqueado hasta que el contador expire.

**Fix temporal:** `pm2 restart automatizawpp` vacía el Map (al reiniciar el proceso, el estado en memoria se pierde).

**Lección:** Rate limits "en memoria" son frágiles en debugging y NO escalan a multi-instancia. Migrar a Redis (cuando esté operativo) o desactivar para IPs/emails de admin durante desarrollo. Documentar siempre que `pm2 restart` resetea estado in-memory.

---

## Servicios y rate limits — Fase 2 (Link) ejecutada 2026-05-02

Ejecutados 8 scripts atómicos en `tools/_check_*.ts` (TypeScript con `npx tsx`).

### ✅ Conexiones OK

| Servicio | Detalle | Latencia | Rate limit observado |
|---|---|---|---|
| **Postgres** | `165.227.175.193:5432/sales_os` user `botflow`, PG 15.17 | 371 ms | (no observado en query simple) |
| **Resend** | API key válida, dominio `automatizawpp.com` verified | — | 5 req/sec (`ratelimit-limit=5`, `ratelimit-remaining=4`) — plan free |
| **Bird** | Workspace `5996a896-...` accesible, `GET /channels` OK, 2 canales | 315 ms | (no observado) |

### ❌ Conexiones FAIL — necesitan acción

| Servicio | Error | Causa probable | Acción recomendada |
|---|---|---|---|
| **Redis** | `Connection is closed` — TCP a `165.227.175.193:6379` rechazado | Redis bind a localhost o ufw bloquea puerto 6379 | SSH al droplet → revisar `/etc/redis/redis.conf` (`bind`, `protected-mode`) → preferir tunneling SSH antes que abrir puerto público |
| **SMTP Zoho** | `535 Authentication Failed` en `smtppro.zoho.eu:587` (latencia 569 ms — TCP+TLS sano) | App password caducado o incorrecto | Zoho Mail → Settings → Mail Accounts → Application-Specific Passwords → regenerar y actualizar `SMTP_PASS` en `.env` |
| **IMAP Zoho** | `Command failed` en `imappro.zoho.eu:993` (latencia 323 ms) | Mismo: app password caducado | Mismo: regenerar app password Zoho IMAP |

### ⏭ Servicios sin credenciales (SKIP)

- **Brevo** — `BREVO_API_KEY=""` (vacío). Decisión pendiente: ¿abandonar Brevo (Resend ya cubre) o reactivar?
- **OpenAI** — `OPENAI_API_KEY` no existe en `.env`. **Hallazgo:** el proyecto usa **Anthropic** (`ANTHROPIC_API_KEY`, `AI_PROVIDER`). El `.env.example` con OpenAI es legacy.

### 🚨 Hallazgos críticos arquitectónicos (descubiertos en Fase 2)

#### 1. BIRD_CHANNEL_ID apunta a canal VOICE, no WhatsApp
- Workspace Bird tiene SOLO 2 canales: `voice-messagebird` (Brasil +552120181097) y `email-sparkpost` (`inbox@automatizawpp.com`).
- **NO hay canal WhatsApp provisionado.**
- `BIRD_CHANNEL_ID=2df369b3-...` apunta al canal voice (no WhatsApp).
- `BIRD_PHONE_NUMBER` no definido en `.env`.

**Implicación:** la "automatización WhatsApp" (core del producto según naming) actualmente NO funciona — no hay canal. Lo activo es voice (BR) + email transaccional.

**Acción:** o (a) provisionar canal WhatsApp Business en Bird y actualizar `BIRD_CHANNEL_ID`, o (b) corregir narrativa del proyecto (Voice/Email-first, WhatsApp roadmap).

#### 2. Stack real de email = Resend (no Brevo)
La config sugiere Brevo principal pero key vacía. Resend funciona perfecto. Pendiente decisión de Eduardo.

#### 3. Stack real de AI = Anthropic (no OpenAI)
`OPENAI_API_KEY` legacy en `.env.example`. Real: `ANTHROPIC_API_KEY`. Limpiar `.env.example` + actualizar `CLAUDE.md` § 4.

#### 4. Lenguaje de scripts atómicos: TypeScript (desviación documentada del protocolo)
Protocolo V.L.A.E.G. menciona Python para `tools/`. Decisión pragmática: **TypeScript con `npx tsx`** porque:
- El proyecto entero es TS/Node.
- Deps (Prisma, ioredis, nodemailer, imapflow, openai SDK) ya instaladas.
- `process.loadEnvFile()` nativo de Node 20.6+ evita `dotenv`.
- Mismos beneficios (atómicos, deterministas, testables) sin fragmentar ecosistema.

Documentado en `core/README.md`, `tools/README.md` y aquí.

---

## Lecciones aprendidas (Fase 2)

- **Verificar credenciales ANTES de codear features** evita descubrir tarde que no hay canal WhatsApp.
- **Latencia TCP+TLS funcional** (200-600ms) NO implica auth válida — siempre probar handshake completo.
- **Headers de rate limit** (`ratelimit-*`, `x-ratelimit-*`) son fuente de verdad — docs públicos pueden estar desactualizados.
- **`.env.example` se desincroniza** sin auditoría — vars como `OPENAI_API_KEY` aparecen sin uso real.

## Restricciones de negocio

Definidas formalmente por Eduardo en respuesta a las 5 Preguntas de Descubrimiento (2026-05-02). Documentadas como Constitución del Lead Response Agent en `CLAUDE.md` §3. Reglas duras: tono warm/premium, <200 palabras, no revelar AI, quiet hours 21-09, max 5 touches/día, opt-out absoluto.

---

## 7 Gaps detectados en el flow inbound→outbound (2026-05-02)

Auditoría del código por Eduardo durante respuesta a las 5 Preguntas. Cada gap representa una desviación entre la Constitución (CLAUDE.md §3) y el comportamiento real del código. Plan de cierre en `plan.md` (Sprints 1-3).

### Gap #1 — Closer prompt en PT-BR, resto de prompts en inglés 🔴

**Síntoma:** Mezcla de idiomas en agentes. Closer usa PT-BR, los otros usan inglés.

**Causa raíz:** Prompts escritos en momentos distintos sin convención unificada.

**Impacto:** **Viola regla absoluta del CLAUDE.md** ("idioma PT-BR/ES, nunca inglés"). Lead recibe mezcla de idiomas según qué agente responda.

**Fix (Sprint 1.1):** Reescribir todos los prompts a PT-BR como base. Switch a ES si `lead.preferredLanguage='es'`.

---

### Gap #2 — `lead.preferredLanguage` no se lee en ningún prompt 🔴

**Síntoma:** Campo `Lead.preferredLanguage` existe en schema (default `es`) pero NINGÚN agente lo lee.

**Causa raíz:** Feature parcialmente implementada — schema preparado, lógica nunca cableada.

**Impacto:** Todas las respuestas salen en idioma fijo (probablemente inglés por gap #1), ignorando preferencia del lead. Bug crítico de localización.

**Fix (Sprint 1.2):** En cada agente leer `lead.preferredLanguage` antes de construir el prompt. Si vacío → auto-detect (Sprint 3.2).

---

### Gap #3 — `qa-agent.ts` existe pero NO está cableado al flow 🔴

**Síntoma:** El archivo `src/lib/agents/qa-agent.ts` existe con lógica de QA pre-envío, pero el flow `processInboundMessage()` llama directamente a `provider.send()` sin pasar por QA.

**Causa raíz:** Implementación a medio camino — agente creado pero integración no completada.

**Impacto:** Mensajes salen sin revisión. Riesgo de mensajes off-tone, alucinaciones de Claude, violaciones de la lista negra (gap #5).

**Fix (Sprint 1.3):** Insertar `qa-agent.review(draft)` antes de `provider.send()`. Si `qaPassed=false` → no enviar, registrar en `AgentRun`, escalar a admin (depende de Sprint 2).

---

### Gap #4 — ESCALATE no se ejecuta desde inbound (solo RESPOND/QUALIFY/HOLD) 🟠

**Síntoma:** Orchestrator puede devolver acción `ESCALATE`, pero `processInboundMessage()` solo tiene branches para `RESPOND`, `QUALIFY` y `HOLD`. `ESCALATE` cae al default (silencio).

**Causa raíz:** Action enum incluye 7 valores pero el handler solo cubre 3.

**Impacto:** Lead que pide "hablar con persona" o menciona "queja" / "abogado" / "devolución" NO llega a humano. Riesgo legal + pérdida de lead caliente.

**Fix (Sprint 2.1 + 2.2):** Añadir branch ESCALATE → `triggerEscalation(leadId, reason)` + marcar `Lead.escalated=true`. Detección de keywords críticas en Orchestrator (lista en CLAUDE.md §3 "Escalación obligatoria").

---

### Gap #5 — Sin lista negra de palabras/temas prohibidos 🟠

**Síntoma:** El `LEAD_RESPONSE_PROMPT` no tiene restricciones explícitas de qué NO decir.

**Causa raíz:** Prompt enfocado en tono pero no en restricciones de contenido.

**Impacto:** Claude puede dar precios concretos, prometer SLAs, hablar de competidores, garantizar resultados. Riesgo comercial + legal (promesas no respaldadas).

**Fix (Sprint 2.3):** Añadir sección "NÃO DIZER" al prompt: precios concretos, fechas/SLAs específicos, promesas de resultados, competidores, URLs no aprobadas. Documentado en CLAUDE.md §3.

---

### Gap #6 — Notificaciones admin no se disparan desde inbound flow 🟡

**Síntoma:** `src/lib/notifications/` tiene sistema completo (alert-rules, channels, scheduler, templates, triggers, types) con triggers tipo `triggerLeadCreated`, `triggerHighIntentLead`, `triggerEmailFailed`. Ningún path de inbound los invoca.

**Causa raíz:** Sistema construido en paralelo al inbound, sin integración.

**Impacto:** Admin no se entera en tiempo real de leads de alta intención, fallos de envío, o escalaciones. Solo sabe mirando dashboard manualmente.

**Fix (Sprint 3.1):** Cablear triggers desde puntos clave: nueva conversación → `triggerLeadCreated`, score alto → `triggerHighIntentLead`, fallo de envío → `triggerEmailFailed`, ESCALATE → `triggerEscalation`.

---

### Gap #7 — Auto-detect de idioma no implementado 🟡

**Síntoma:** Si `lead.preferredLanguage` está vacío, no hay fallback a detectar el idioma del mensaje entrante.

**Causa raíz:** Decisión de implementación pendiente.

**Impacto:** Workaround actual = forzar `es` como default. Si el lead escribe en PT-BR, recibe respuesta en ES.

**Fix (Sprint 3.2):** Crear `src/lib/agents/language-detector.ts` atómico: prompt corto a Claude Haiku con el mensaje entrante → retorna `'es' | 'pt-BR'`. Cachear en `Lead.preferredLanguage` tras primera detección.

---

## Gap #8 — Notification record FAILED por canal externo no configurado 🟠 (2026-05-04 ✅ resuelto)

**Síntoma:** Tabela `Notification` em prod com records `status=FAILED, failureReason="SLACK_WEBHOOK_URL not configured"`.

**Causa raíz:** Regras em `alert-rules.ts` (`lead-high-intent`, `lead-vip`, `email-failed`, `system-error`, `system-health`, `opportunity-high-value`) incluem `'SLACK'` em `channels`. `triggers.ts` chama `sendNotification` por canal. Sem `SLACK_WEBHOOK_URL`, criava record antes de descobrir que iria falhar.

**Fix:** Adicionado `isChannelEnabled(channel)` em `src/lib/notifications/service.ts`. `sendNotification` faz early return com log `[NOTIFICATION SKIPPED]` quando canal não habilitado — **sem criar Notification record**.

| Canal | Habilitado quando |
|---|---|
| IN_APP | sempre |
| EMAIL | `RESEND_API_KEY \|\| BREVO_API_KEY \|\| BIRD_EMAIL_CHANNEL_ID` |
| WHATSAPP | `BIRD_API_KEY && BIRD_WORKSPACE_ID` |
| SLACK | `SLACK_WEBHOOK_URL` |

**Adicional:** `<NotificationBell />` montado em `src/components/ui/TopBar.tsx` (antes era código solto, ninguém importava).

**Lección:** Canais opcionais devem ser opt-in via env. Filtrar antes de criar é melhor que marcar FAILED depois.

---

## Gap #9 — _prisma_migrations sujo com records pending duplicados 🟡 (2026-05-04 ✅ resuelto)

**Síntoma:** Em prod, `SELECT * FROM _prisma_migrations` mostrava 3 records para `add_notifications_schema` (2 com `finished_at=NULL`, 1 ok).

**Causa raíz:** Tentativas de `prisma migrate deploy` em 2026-05-02 falharam silenciosamente 2 vezes antes da terceira funcionar. Cada tentativa cria um record; só o último completou.

**Fix (2026-05-04):**
1. `pg_dump --table='_prisma_migrations' --data-only` → `/opt/automatizawpp/backups/_prisma_migrations_pre_cleanup_20260504.sql`
2. `DELETE FROM _prisma_migrations WHERE id IN (...)` para os 2 pending
3. `prisma migrate status` agora retorna "Database schema is up to date!"

**Lección:** Quando migration falha, record fica pending. Não confiar só em `migrate status` — auditar `_prisma_migrations` direto periodicamente.

---

## Gap #10 — Baseline Prisma `0_init` vazio (não é bug, é pattern) 🟢 (2026-05-04 ✅ documentado)

**Síntoma:** `prisma/migrations/0_init/migration.sql` tem só comentários, parece bug.

**Causa raíz:** A BD prod foi inicializada via `prisma db push` antes de adotarmos `prisma migrate deploy`. Pattern oficial Prisma para esse caso é **baselining**: criar `0_init/migration.sql` vazio + `prisma migrate resolve --applied 0_init`.

**Fix (2026-05-04):** Criado `prisma/migrations/0_init/README.md` documentando o pattern, o que NÃO fazer (preencher), e o procedimento para greenfield.

**Lección:** Baselining vazio é correto para projetos pré-existentes. Não tratar como bug.
