# CLAUDE.md — AutomatizaWPP

> Constitución del proyecto según Protocolo V.L.A.E.G. Documento inmutable salvo cambio explícito de Eduardo. Leído automáticamente por Claude Code al entrar en el repo.

---

## 1. Identidad del proyecto

- **Nombre interno (package):** `sales-os`
- **Nombre público:** AutomatizaWPP
- **Versión:** 0.1.0
- **Qué es:** Plataforma SaaS B2B de automatización WhatsApp + email + voz para captar, calificar y cerrar leads (PYMEs Brasil/España).
- **Stack:** Next.js 15.5.15 · TypeScript · React · Prisma 6.19 · NextAuth v5 · PostgreSQL 16 · Redis · n8n
- **Repo local:** `/Users/eduardosilva/Antigravity/automatizawppBR`
- **Producción:** Droplet DigitalOcean 568497325 — IP `68.183.203.16` — `https://automatizawpp.com`
- **Idioma del código y UI:** PT-BR o ES, **nunca inglés**.

## 2. Estructura del proyecto (V.L.A.E.G. v2)

```
automatizawppBR/
├── CLAUDE.md           # Este archivo — constitución
├── docs/
│   ├── plan.md         # Plan V.L.A.E.G. (fases + checklists)
│   ├── findings.md     # Errores documentados + lecciones
│   ├── progress.md     # Bitácora append-only
│   └── legacy/         # Docs antiguos (architecture.md, SEO, etc.)
├── architecture/       # Capa 1 A.N.T. — POPs (esqueleto + README; vacío por deuda técnica)
├── core/               # Capa 2 A.N.T. — Núcleo de negocio puro (esqueleto + README; vacío por deuda)
├── tools/              # Capa 3 A.N.T. — Scripts atómicos (README + 8 _check_*.py pendientes)
├── .tmp/               # Datos intermedios efímeros (gitignored)
├── prisma/             # schema.prisma + migrations + seed.ts
├── src/                # Next.js monolítico (DEUDA: lógica/I/O mezclados — ver architecture/README.md)
│   ├── app/            # App Router (pages + API routes)
│   ├── components/     # React UI
│   ├── lib/            # auth, db, services, actions
│   └── middleware.ts
├── .env.production.local  # Credenciales producción (NUNCA commitear)
└── .gitignore
```

> **Deuda técnica reconocida:** El proyecto NO sigue arquitectura A.N.T. de 3 capas (es Next.js monolítico). Las carpetas `architecture/` y `core/` están vacías con README documentando la deuda y plan de migración futuro. Refactor pendiente, no urgente.

## 3. Schemas críticos

### Modelos Prisma principales
`Workspace`, `User`, `Lead`, `LeadMemory`, `Conversation`, `Message`, `AgentRun`, `AgentTask`, `ConversationSummary`, `ActivityLog`, `Event`, `WebhookEvent`, `Service`, `ClientServiceAccess`, `ServiceActivity`, `AuditLog`, `Session`, `PasswordResetToken`. Schema completo en `prisma/schema.prisma`.

### Schema A — Login (ya operativo)
```json
{
  "input_schema": {
    "email": "string (email format)",
    "password": "string (min 8 chars)",
    "callbackUrl": "string?"
  },
  "output_schema": {
    "ok": "boolean",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "workspaceId": "string",
      "role": "owner | admin | member"
    }
  }
}
```

### Schema B — Mensaje inbound normalizado (entrada al Orchestrator)
Producto: cualquier mensaje entrante (Resend webhook, Bird webhook, Bird email-received) se normaliza a este formato.

```json
{
  "messageId": "string (idempotency key)",
  "workspaceId": "string",
  "leadId": "string",
  "channel": "email | whatsapp | sms",
  "direction": "inbound",
  "from": "string (email | phone E164)",
  "content": "string",
  "subject": "string?",
  "receivedAt": "ISO8601",
  "rawWebhookEventId": "string (FK → WebhookEvent.id)"
}
```

### Schema C — Decisión del Orchestrator
```json
{
  "action": "RESPOND | QUALIFY | HANDLE_OBJECTION | CLOSE | FOLLOW_UP | ESCALATE | HOLD",
  "reason": "string",
  "holdReason": "QUIET_HOURS | MAX_TOUCHES | OPT_OUT | ESCALATED | null",
  "agentRunId": "string (FK → AgentRun.id)",
  "scheduledFor": "ISO8601?"
}
```

### Schema D — Mensaje outbound (entrega final)
```json
{
  "messageId": "string",
  "leadId": "string",
  "channel": "email | whatsapp | sms",
  "direction": "outbound",
  "language": "es | pt-BR | en (auto-detected o lead.preferredLanguage)",
  "content": "string (<200 palabras)",
  "qaPassed": "boolean",
  "qaNotes": "string?",
  "deliveryProvider": "resend | brevo | bird",
  "deliveryStatus": "queued | sent | delivered | bounced | failed",
  "agentRunId": "string"
}
```

### Constitución del Lead Response Agent

**Tono:** warm, premium, elegant, conversacional, nunca robótico. NO revelar que es AI salvo si lead lo pregunta directamente.
**Longitud:** <200 palabras.
**Idioma:** `lead.preferredLanguage` (default `es`). Si está vacío → auto-detect del idioma del mensaje entrante (PT-BR / ES). Nunca inglés.
**Tiempo objetivo:** <5 minutos desde inbound a outbound.
**Quiet hours:** 21:00–09:00 (timezone del workspace) → fuerza `HOLD`.
**Max touches/día:** 5 por lead (env `MAX_TOUCHES_PER_DAY`) → fuerza `HOLD`.
**Opt-out:** respeta `lead.optOutAt` → `HOLD`.
**QA pre-envío:** `qa-agent.ts` revisa el draft antes de `provider.send()`. Si `qaPassed=false`, NO se envía y se loguea en `AgentRun`.
**Escalación obligatoria:** keyword detection (queja, abogado, devolución, "hablar con persona") → `ESCALATE` → notifyAdmin via `src/lib/notifications/triggers.ts`.
**Lista negra (NO decir):** precios concretos, fechas concretas de entrega/SLA, promesas de resultados garantizados, info de competidores, URLs no-aprobadas.

### Routing de entrega (cascada)
- **Email outbound:** Resend (prioritario) → Brevo (fallback) → Bird email
- **WhatsApp outbound:** Bird (único provider)
- **SMS:** stub (no operativo)

### Routing de entrada (3 endpoints activos)
| Endpoint | Origen | Uso |
|---|---|---|
| `POST /api/events/inbound` | genérico | Normaliza payload Bird, idempotente vía `WebhookEvent` |
| `POST /api/webhooks/bird` | Bird directo | Webhook firmado de Bird (email + WhatsApp) |
| `POST /api/webhooks/email-received` | Bird Email API | Loop cerrado de email entrante |

> Resend es **outbound only**. Zoho IMAP NO está en el loop inbound (solo SMTP en `.env`, sin poller). Si se reactiva Zoho, debe haber poller que escriba a `WebhookEvent`.

## 4. Stack y dependencias clave

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | ≥20 |
| Framework | Next.js | 15.5.15 |
| ORM | Prisma | ^6.19 |
| BD | PostgreSQL (`165.227.175.193:5432/sales_os`) | 16 |
| Auth | NextAuth | v5.0.0-beta.28 + endpoint custom `/api/auth/login` |
| Hashing | bcryptjs | 12 salt rounds |
| Email | Brevo + Resend (fallback) + Zoho SMTP/IMAP | — |
| Voice | Bird API (alt: Vapi) | — |
| LLM | OpenAI | `gpt-4.1` |
| Workflows | n8n | self-hosted |
| Process manager | PM2 (en DO) | — |
| Reverse proxy | Nginx 1.24 | — |
| SSL | Let's Encrypt (vence 2026-07-31) | — |

## 5. Reglas de comportamiento (NO negociables)

1. **Idioma:** PT-BR o ES en código, UI, comentarios. Nunca inglés.
2. **Test calls:** SOLO al número `+34680365779`. Nunca a leads reales.
3. **Sin cambios de tema/visual** sin autorización explícita de Eduardo.
4. **Confirmar antes de enviar emails.** Nunca enviar sin aprobación.
5. **Verificar antes de afirmar.** Check files/env/containers/backups antes de pedir al usuario.
6. **Solo reportar "done"** cuando esté verificado funcionando.
7. **Después de 2 intentos fallidos** en el mismo bug → parar, diagnosticar, pivotar. No iterar a ciegas.
8. **Nunca hardcodear** tokens, IDs, URLs.
9. **Nunca exponer** paths privados ni secrets en archivos commiteados.
10. **Workspace multi-tenant:** toda query debe filtrar por `workspaceId`.
11. **Auth:** rate limit 5 intentos/15 min. Sessions JWT en cookies httpOnly.

## 6. Identidad visual

- **Tema:** oscuro (fondo `#060606`, surface `#111`, texto `#f0ede8`).
- **Acento:** verde WhatsApp `#25D366`.
- **Tipo:** Manrope (Google Fonts).
- **Login:** card centrada, branding "Automatiza Wpp" con icono WhatsApp, botón verde con flecha.

## 7. Comandos frecuentes

```bash
# Local
npm run dev                  # Next.js dev en :3000
npm run build                # build producción
npx tsc --noEmit             # type-check

# Prisma
npx prisma generate          # regenerar cliente
npx prisma migrate deploy    # aplicar migrations en prod
npx prisma db push           # sync schema a DB sin migrations

# Producción (SSH)
ssh -i ~/.ssh/id_ed25519 root@68.183.203.16
pm2 status / restart automatizawpp / logs automatizawpp
certbot renew                # renovar SSL
```

## 8. Credenciales — Cómo acceder

Guardadas en memoria de Claude (`/Users/eduardosilva/.claude/projects/-/memory/`). Nunca pedirlas al usuario.

- **SSH droplet:** `ssh -i ~/.ssh/id_ed25519 root@68.183.203.16`
- **Login admin:** `admin@automatizawpp.com` / `Admin@2026!`
- **DB:** `botflow` / `BotFlowDB2026!` en `165.227.175.193:5432/sales_os`
- **DigitalOcean API:** `credentials_digitalocean.md` en memory
- **Dominio:** GoDaddy. Nameservers: `ns1/2/3.digitalocean.com`

## 9. Lo que NO se debe tocar

⛔ **`prisma/schema.prisma`** sin migración + revisión humana.
⛔ **Tema/colores/diseño visual** sin autorización explícita.
⛔ **Idioma de la UI** (PT-BR / ES, no mezclar y no inglés).
⛔ **Credenciales en `.env.production.local`** sin verificar antes (tienen formato `botflow:BotFlowDB2026!`).
⛔ **Nameservers del dominio** sin avisar (cambio rompe producción).
⛔ **Workflows n8n** que vivan fuera del repo (deuda documental).

## 10. Patrones recurrentes

### Login (server action)
`src/components/auth/login-form.tsx` usa `useActionState(loginAction, ...)` que internamente llama `POST /api/auth/login`. Ese endpoint valida con bcrypt + rate-limit, retorna JWT en cookie httpOnly.

### Multi-tenancy
Toda query Prisma filtra por `workspaceId` extraído de la sesión. Nunca queries cross-workspace.

### Restart PM2 con env nuevas
`pm2 restart` NO recarga `.env`. Usar:
```bash
pm2 delete automatizawpp && pm2 start npm --name automatizawpp -- start
# o
pm2 restart automatizawpp --update-env
```

### Build limpio
```bash
cd /opt/automatizawpp && rm -rf .next && npm run build && pm2 restart automatizawpp
```

## 11. Errores comunes a evitar

- ❌ **`pm2 restart` después de cambiar `.env`** — no recarga env vars (usar `pm2 delete + start` o `--update-env`).
- ❌ **Borrar `.next` sin rebuild** — Next.js entra en restart loop "Could not find production build".
- ❌ **DATABASE_URL placeholder** (`postgres:postgres`) en `.env.production.local` — el archivo se sobreescribe en algunos rebuilds, verificar siempre.
- ❌ **Cambios CSS sin verificar el caché del navegador** — Service Workers / DNS / Vercel cache pueden servir versiones viejas.
- ❌ **Tocar diseño sin pedir confirmación.**
- ❌ **Hitting `/api/auth/login` muchas veces seguidas** — activa rate limit (5/15min en memoria, se vacía con PM2 restart).

## 12. Variables de entorno críticas

Lista completa en `.env.example`. Críticas para producción:
- `DATABASE_URL` — `postgresql://botflow:BotFlowDB2026!@165.227.175.193:5432/sales_os`
- `NEXTAUTH_URL` — `https://automatizawpp.com`
- `NEXTAUTH_SECRET` — secret de 256 bits
- `NODE_ENV` — `production`
- `BIRD_API_KEY` + `BIRD_WORKSPACE_ID` + `BIRD_CHANNEL_ID` + `BIRD_PHONE_NUMBER`
- `BREVO_API_KEY` + `BREVO_SENDER_EMAIL`
- `RESEND_API_KEY` (fallback email)
- `OPENAI_API_KEY`
- `SMTP_HOST/PORT/USER/PASS` + `IMAP_HOST/PORT/USER/PASS` (Zoho)

## 13. Donde mirar primero ante un problema

| Síntoma | Mirar |
|---|---|
| App no arranca | `pm2 logs automatizawpp --err` |
| 500 en /api/auth/login | DATABASE_URL en `.env.production.local` |
| "Failed to find Server Action" | Cliente cacheó form de build viejo → hard reload (Cmd+Shift+R) |
| "Error en la autenticación" | Rate limit (5/15min) → PM2 restart limpia |
| Página vieja servida | DNS cache del usuario (`sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`) |
| ERR_CONNECTION_REFUSED | Nginx caído o sin SSL: `systemctl status nginx`, `certbot renew` |
| `.next` corrupto | `rm -rf .next && npm run build` |
| DNS apunta a Vercel | Nameservers GoDaddy → DigitalOcean (`ns1/2/3.digitalocean.com`) |

## 14. Documentos del proyecto

| Tema | Documento |
|---|---|
| Plan V.L.A.E.G. | `docs/plan.md` |
| Findings (errores + lecciones) | `docs/findings.md` |
| Progress (bitácora) | `docs/progress.md` |
| Arquitectura técnica legacy | `docs/legacy/architecture.md` |
| SEO setup | `docs/legacy/GOOGLE-SEO-SETUP.md` |
| Pre-deploy checklist | `docs/legacy/PRE_DEPLOYMENT_CHECKLIST.md` |
| Capa 1 A.N.T. (POPs) | `architecture/README.md` |
| Capa 2 A.N.T. (Núcleo) | `core/README.md` |
| Capa 3 A.N.T. (Tools) | `tools/README.md` |
| Schema Prisma | `prisma/schema.prisma` |

---

## Mensaje final para Claude

Cuando trabajes en este proyecto:

1. **Leer primero** `docs-veg/findings.md` para no repetir errores ya documentados.
2. **Aplicar V.L.A.E.G.** en cualquier tarea nueva (V→L→A→E→G).
3. **Preguntar** si una decisión cruza una regla de la sección 5 o 9.
4. **Verificar** con `npx tsc --noEmit` y curl manual antes de declarar terminado.
5. **No inventar.** Si falta un dato, preguntar a Eduardo.
6. **Registrar errores** nuevos en `docs-veg/findings.md` (con causa raíz + lección).
7. **Recordar:** producción es real, los errores tienen consecuencias para clientes reales.

✦ AutomatizaWPP · Barcelona/Brasil · 2026
