# Constitution — AutomatizaWPP

> Constitución del proyecto. Documento inmutable salvo cambio explícito de Eduardo. Extraído del estado actual del proyecto (no inventado).

## 1. Identidad del proyecto

- **Nombre interno (package):** `sales-os`
- **Nombre público:** AutomatizaWPP
- **Versión:** 0.1.0
- **Stack:** Next.js 15.5.15 · TypeScript · React · Prisma 6.19 · NextAuth v5
- **Repo local:** `/Users/eduardosilva/Antigravity/automatizawppBR`
- **Producción:** Droplet DigitalOcean 568497325 — IP `68.183.203.16` — `https://automatizawpp.com`
- **DB:** PostgreSQL `165.227.175.193:5432/sales_os` — user `botflow`

## 2. Las 5 Preguntas — Respuestas extraídas del proyecto

### 2.1 Estrella Guía
Plataforma SaaS B2B de automatización WhatsApp + email + voz para captar, calificar y cerrar leads para PYMEs en Brasil/España. El cliente paga por servicios activos (sequences, voice agent, email outreach) y ve sus leads en un dashboard.

### 2.2 Integraciones (extraídas de `.env.example`)
| Servicio | Uso | Variables |
|---|---|---|
| **Bird** | Voice + WhatsApp + Email channel | `BIRD_API_KEY`, `BIRD_WORKSPACE_ID`, `BIRD_CHANNEL_ID`, `BIRD_PHONE_NUMBER`, `BIRD_EMAIL_CHANNEL_ID` |
| **Brevo** | Email transaccional principal | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` |
| **Resend** | Email fallback | `RESEND_API_KEY`, `RESEND_FROM` |
| **Zoho SMTP/IMAP** | Email outbound + inbound | `SMTP_*`, `IMAP_*` |
| **OpenAI** | LLM para clasificación / generación | `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-4.1` |
| **Vapi** | Voice agent (alternativa a Bird) | (revisar `.env`) |
| **n8n** | Orquestación de workflows | self-hosted |
| **Postgres** | Fuente de verdad | `DATABASE_URL` |
| **Redis** | Cache / colas | `REDIS_URL` |

### 2.3 Fuente de Verdad
PostgreSQL `sales_os` en `165.227.175.193`. Schema gestionado con Prisma. Modelos clave: `Workspace`, `User`, `Lead`, `Service`, `ClientServiceAccess`, `ServiceActivity`, `AuditLog`, `Session`, `PasswordResetToken`.

### 2.4 Payload de Entrega
- **Cliente final** ve resultados en dashboard web autenticado (`/dashboard`, `/services/[slug]`, `/leads`, `/sequences`, `/calls`).
- **Leads** se entregan por: WhatsApp (Bird) + Email (Brevo/Resend) + llamadas (Bird Voice / Vapi).
- **Inbound** (respuestas de leads) cierra el loop vía webhooks Bird → Postgres → dashboard.

### 2.5 Reglas de Comportamiento
1. Idioma del código, UI y comentarios: **PT-BR o ES**, nunca inglés (regla de Eduardo).
2. Tests de llamadas SOLO al número `+34680365779`. Nunca a leads reales.
3. Sin cambios de tema/visual sin autorización explícita del usuario.
4. Nunca confirmar emails enviados sin aprobación previa.
5. Nunca exponer paths privados ni secrets en archivos commiteados.
6. Solo reportar "done" cuando esté verificado funcionando (no antes).

## 3. Schemas críticos (Prisma)

Modelos principales documentados en `prisma/schema.prisma`. Los schemas JSON de payloads de integraciones (Bird webhook, Brevo bounce, etc.) se documentarán a medida que se descubran (Fase 2 — Link).

## 4. Invariantes arquitectónicos

- Auth: NextAuth v5 + endpoint custom `/api/auth/login` con bcrypt 12 salt rounds.
- Rate limit en login: 5 intentos / 15 min.
- Sessions JWT en cookies httpOnly.
- Workspace multi-tenant: cada `User` pertenece a un `workspaceId`. Toda query debe filtrar por workspace.
- Servicios: catálogo fijo en tabla `Service`, accesos por `ClientServiceAccess`.
- Idioma UI: `pt-BR` por defecto (HTML lang). Algunos componentes en español (auth en castellano según commit `1f9cf7a`).

## 5. Deuda técnica reconocida

- Estructura A.N.T. (3 capas) NO implementada — es Next.js monolítico estándar.
- `tools/` atómicas tipo Python no existen (la lógica está en `src/lib/`, `src/app/api/`).
- Workflows n8n viven fuera del repo (deuda de documentación).
- Algunos archivos auth tenían textos en portugués heredados de plantilla, ya corregidos a español (commit `1f9cf7a`).

## 6. Credenciales — Cómo acceder

- SSH al droplet: `ssh -i ~/.ssh/id_ed25519 root@68.183.203.16`
- Login admin: `admin@automatizawpp.com` / `Admin@2026!`
- DB credentials: `botflow` / `BotFlowDB2026!` en `165.227.175.193:5432/sales_os`
- DigitalOcean: token guardado en `/Users/eduardosilva/.claude/projects/-/memory/credentials_digitalocean.md`
- Dominio: GoDaddy (registrar). Nameservers: `ns1/2/3.digitalocean.com`.
