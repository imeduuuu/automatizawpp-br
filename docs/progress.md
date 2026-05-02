# Progress — AutomatizaWPP

> Bitácora de qué se hizo, errores encontrados, tests, resultados. Append-only.

---

## 2026-05-02 — Sesión: Migración Vercel→DO + Fix login + Aplicación retroactiva V.L.A.E.G.

### Hecho
1. Migración DNS de Vercel a DigitalOcean (cambio nameservers en GoDaddy a `ns1/2/3.digitalocean.com`).
2. Verificación propagación DNS con `dig @8.8.8.8` y `dig @1.1.1.1` (asimétrico).
3. Instalación SSL Let's Encrypt en nginx (DO): `certbot --nginx -d automatizawpp.com -d www.automatizawpp.com --redirect`. Vence `2026-07-31`.
4. Reescritura de `LoginForm.tsx`, `AuthPageShell.tsx`, `SubmitButton.tsx` con estilos inline (eliminando dependencia de clases `.ds-*` no definidas).
5. Corrección de `globals.css` con definiciones faltantes para `.ds-*` (fallback).
6. Build + deploy + restart PM2 en droplet.
7. Verificado login funcional vía `curl -X POST /api/auth/login`: retorna `{"ok":true,"user":...}`.
8. Aplicación retroactiva del Protocolo V.L.A.E.G. — creación de `docs-veg/`, `tools-veg/`, `tmp-veg/`.
9. Documentación `plan.md`, `findings.md`, `constitution.md`, `progress.md`.

### Errores encontrados (todos en `findings.md`)
- DNS apuntaba a Vercel cuando producción estaba en DO.
- Nginx sin SSL al migrar dominio a DO.
- Login form con clases CSS sin estilos (botón a la derecha en lugar de full-width abajo).

### Anti-patrones cometidos por Claude esta sesión (auto-crítica)
- Cambiar CSS sin tener el Schema confirmado.
- Marcar "done" antes de verificar que funcionara end-to-end (3 veces).
- Adivinar la causa del bug (CSS) en lugar de diagnosticar (era DNS+SSL).
- No aplicar el Protocolo V.L.A.E.G. desde el primer mensaje a pesar de que el usuario lo mencionó (no estaba en memoria).

### Estado de producción al cierre
- ✓ `https://automatizawpp.com` resuelve a `68.183.203.16` (DigitalOcean)
- ✓ HTTPS válido (Let's Encrypt, redirect de HTTP→HTTPS)
- ✓ PM2 `automatizawpp` online, PID dinámico, port 3000
- ✓ Nginx reverse proxy 443→3000
- ✓ Login funcional con `admin@automatizawpp.com` / `Admin@2026!`
- ⚠ DNS en propagación parcial — algunos resolvers (CloudFlare 1.1.1.1) todavía cacheaban Vercel al cierre

### Plan de Rollback (Fase 5 — Gatillo)

**Si el deploy nuevo falla:**
1. Verificar PM2: `ssh root@68.183.203.16 "pm2 logs automatizawpp --err --lines 50 --nostream"`
2. Restart: `ssh root@68.183.203.16 "pm2 restart automatizawpp"`
3. Si build corrupto, volver a build anterior: `ssh root@68.183.203.16 "cd /opt/automatizawpp && git log --oneline -5"` y `git checkout <commit-anterior> && rm -rf .next && npm run build && pm2 restart automatizawpp`

**Si el dominio cae:**
1. Verificar nginx: `ssh root@68.183.203.16 "systemctl status nginx"`
2. Restart nginx: `ssh root@68.183.203.16 "systemctl restart nginx"`
3. Si SSL caducado: `ssh root@68.183.203.16 "certbot renew"`

**Si la DB cae:**
- Conectar a `165.227.175.193:5432` y verificar Postgres. Credenciales en `constitution.md` §6.

### Fix adicional al cierre — DATABASE_URL corregido

`.env.production.local` tenía credenciales placeholder (`postgres:postgres`). Reescrito con `botflow:BotFlowDB2026!`. PM2 delete + start (no restart, porque restart no recarga env vars). Login API ahora retorna `{"ok":true,"user":{"id":"admin_automatizawpp_usr","email":"admin@automatizawpp.com","role":"admin"}}` desde dominio público.

### Estado FINAL verificado (2026-05-02 07:15 UTC)

| Componente | Estado | Verificación |
|---|---|---|
| DNS (Google) | ✓ | `dig @8.8.8.8 → 68.183.203.16` |
| DNS (CloudFlare) | ⏳ propagando | `dig @1.1.1.1 → todavía Vercel` (caché) |
| HTTPS | ✓ | `curl -sI → HTTP/1.1 200, Server: nginx/1.24.0` |
| Login form layout | ✓ | inline styles `display:grid;grid-template-columns:1fr;gap:12px`, botón `width:100%;background:#25D366` |
| Login API | ✓ | `{"ok":true,"user":{...}}` |
| Dashboard redirect | ✓ | `307 Temporary Redirect` (correcto, redirige a login si no auth) |
| PM2 | ✓ | online, PID 24525 |

### Pendientes (próxima sesión)
- [ ] Cierre formal de Fase 4 — Eduardo aprueba el login form definitivo (con screenshot tras flush DNS)
- [ ] Fase 2 — `tools-veg/_check_<servicio>.py` para Bird, Brevo, Resend, OpenAI, Postgres, Redis
- [ ] Documentar rate limits de cada API en `findings.md`
- [ ] Decisión: ¿refactor a A.N.T. de 3 capas, o aceptar deuda y consolidar Next.js monolítico?
