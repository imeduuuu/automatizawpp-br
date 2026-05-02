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

## Servicios y rate limits

_Pendiente de Fase 2 (Link). Próxima sesión: crear `tools-veg/_check_<servicio>.py` para Bird, Brevo, Resend, OpenAI, Postgres, Redis._

## Restricciones de negocio

_Pendiente de Fase 1 (Visión)._
