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

_Pendiente de Fase 1 (Visión) — Eduardo debe responder formalmente las 5 Preguntas de Descubrimiento. La narrativa actual (extraída del código) está en `CLAUDE.md` § 1-3._
