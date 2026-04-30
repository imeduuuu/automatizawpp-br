# AutomatizaWPP Deployment Guide — GitHub Actions to DigitalOcean

Guía completa para configurar deployment automático de AutomatizaWPP a DigitalOcean sin intervención manual.

**Última actualización:** 2026-04-29  
**Status:** ✅ Production Ready

---

## Tabla de Contenidos

- [Quick Start (3 minutos)](#quick-start)
- [Setup Completo (10 minutos)](#setup-completo)
- [Workflow Automático](#workflows-disponibles)
- [Secrets Requeridos](#secrets-requeridos)
- [Troubleshooting](#troubleshooting)
- [Referencia Técnica](#referencia-técnica)

---

## Quick Start

El deployment automático con GitHub Actions requiere solo 3 pasos:

### 1. Agregar SSH Key a DigitalOcean

```bash
# Generar SSH key (si no tienes una)
ssh-keygen -t ed25519 -f ~/.ssh/do_deploy -N ""

# Agregar a DigitalOcean
cat ~/.ssh/do_deploy.pub | pbcopy
# Luego en https://cloud.digitalocean.com/account/security/keys → Add SSH Key
```

### 2. Configurar Secrets en GitHub

Ve a: **Configuración del Repositorio → Settings → Secrets and Variables → Actions**

Haz click en **New repository secret** y agrega estos secrets (obtén valores en secciones a continuación):

```
DO_TOKEN
DO_DROPLET_NAME
DO_SSH_PRIVATE_KEY
DATABASE_PASSWORD
REDIS_PASSWORD
ANTHROPIC_API_KEY
```

### 3. Hacer Push o Disparar Manualmente

**Opción A: Push automático**
```bash
git add .
git commit -m "Deploy to DigitalOcean"
git push origin main
# ✅ Deployment automático se inicia
```

**Opción B: Disparo manual**
1. Ve a **Actions** en GitHub
2. Selecciona **"Deploy to DigitalOcean (Manual with Inputs)"**
3. Click **Run workflow**
4. Ingresa parámetros (opcional)
5. Click **Run workflow**

---

## Setup Completo

### Paso 1: Crear DigitalOcean Account

1. Regístrate en https://digitalocean.com
2. Crea un proyecto o usa uno existente
3. Ve a **API → Tokens → Generate New Token**
4. Copia el token (será tu `DO_TOKEN`)

**Permisos requeridos:** read + write

### Paso 2: Crear SSH Key

```bash
# Opción A: Usar llave existente
# Tu ~/.ssh/id_rsa (si existe)

# Opción B: Crear nueva llave
ssh-keygen -t ed25519 -f ~/.ssh/do_deploy -C "github-actions-do"

# Agregar a DigitalOcean
# 1. Copia la llave pública:
cat ~/.ssh/do_deploy.pub

# 2. Ve a https://cloud.digitalocean.com/account/security/keys
# 3. Click "Add SSH Key"
# 4. Pega el contenido y dale un nombre
```

### Paso 3: Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"**

Agrega estos secrets:

#### DO_TOKEN (obligatorio)
```
Valor: Token de DigitalOcean (de Paso 1)
Descripción: DigitalOcean API token
```

#### DO_DROPLET_NAME (obligatorio)
```
Valor: sales-os-prod
Descripción: Nombre del droplet a crear/usar
```

#### DO_SSH_PRIVATE_KEY (obligatorio)
```
Valor: Contenido completo de ~/.ssh/do_deploy (privada)
Comando: cat ~/.ssh/do_deploy | pbcopy
Descripción: Llave SSH privada para conectar con droplet
```

#### DO_REGION (opcional)
```
Valor: nyc3  (o tu región preferida)
Opciones: nyc1, nyc3, sfo2, sfo3, lon1, ams3, fra1, blr1, sgp1, tor1
```

#### DO_SIZE (opcional)
```
Valor: s-2vcpu-4gb
Opciones: s-1vcpu-512mb-10gb, s-2vcpu-2gb-60gb, s-2vcpu-4gb-80gb, s-4vcpu-8gb-160gb
```

#### DATABASE_PASSWORD (obligatorio)
```
Valor: contraseña_muy_fuerte_para_postgres
Requisito: Mínimo 16 caracteres, incluir mayúsculas, números, símbolos
Ejemplo: $(openssl rand -base64 32)
```

#### REDIS_PASSWORD (obligatorio)
```
Valor: contraseña_para_redis
Requisito: Mínimo 16 caracteres
```

#### ANTHROPIC_API_KEY (obligatorio)
```
Valor: sk-ant-xxxxxxxxxxxxx
Obtener en: https://console.anthropic.com/account/keys
```

#### ANTHROPIC_MODEL (opcional)
```
Valor: claude-sonnet-4-20250514
Descripción: Modelo de Anthropic a usar
```

#### BIRD_API_KEY (si usas Bird API)
```
Valor: Tu llave de Bird API
```

#### BIRD_WORKSPACE_ID
```
Valor: ID del workspace en Bird
```

#### BIRD_CHANNEL_ID
```
Valor: ID del canal en Bird
```

#### BIRD_EMAIL_CHANNEL_ID
```
Valor: ID del canal de email en Bird
```

#### BREVO_API_KEY (si usas Brevo)
```
Valor: xkeysib_xxxxxxxxxxxxx
Obtener en: https://app.brevo.com/settings/account/api
```

#### SMTP_HOST (si usas SMTP)
```
Valor: smtp.zoho.com (o tu servidor SMTP)
```

#### SMTP_PORT (opcional)
```
Valor: 587
```

#### SMTP_USER
```
Valor: tu_email@dominio.com
```

#### SMTP_PASS
```
Valor: contraseña_smtp
```

#### MAIL_FROM
```
Valor: AutomatizaWPP <noreply@automatizawpp.com>
```

#### NEXTAUTH_SECRET (obligatorio)
```
Valor: Contraseña segura de mínimo 32 caracteres
Generar: $(openssl rand -base64 32)
```

#### APP_DOMAIN (opcional)
```
Valor: automatizawpp.com
Descripción: Dominio para SSL/TLS
```

#### LE_EMAIL (para Let's Encrypt)
```
Valor: c.eduardo@me.com
Descripción: Email para certificados SSL
```

#### SLACK_WEBHOOK_URL (opcional)
```
Valor: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
Descripción: Para notificaciones de deployment en Slack
```

### Paso 4: Configurar DNS (si necesario)

Si tienes un dominio personalizado:

1. Ve a tu registrador de DNS (GoDaddy, Namecheap, etc.)
2. Apunta tu dominio a la IP del droplet:
   ```
   A record: automatizawpp.com → [IP_DROPLET]
   ```

### Paso 5: Hacer el Primer Push/Deployment

**Opción A: Automático (push a main)**
```bash
git add .
git commit -m "Initial deployment configuration"
git push origin main

# Espera ~15 minutos. El deployment se inicia automáticamente.
# Ve a Actions para ver el progreso.
```

**Opción B: Manual**
1. Ve a **Actions** en GitHub
2. Selecciona **"Deploy to DigitalOcean"**
3. Click **Run workflow** → **Run workflow**

---

## Workflows Disponibles

### 1. `deploy-do.yml` — Deployment Automático

**Cuándo se ejecuta:**
- Automáticamente en cada `git push` a `main`
- Puede dispararse manualmente desde GitHub Actions

**Qué hace:**
1. ✅ Valida configuración y secrets
2. ✅ Compila imagen Docker
3. ✅ Crea/actualiza droplet en DigitalOcean
4. ✅ Configura firewall y networking
5. ✅ Instala Docker y servicios
6. ✅ Clona el repositorio
7. ✅ Configura variables de entorno
8. ✅ Inicia PostgreSQL, Redis, App
9. ✅ Migra base de datos
10. ✅ Configura SSL con Let's Encrypt
11. ✅ Configura Nginx reverse proxy
12. ✅ Ejecuta health checks
13. ✅ Envía reporte

**Tiempo de ejecución:** ~20-30 minutos (primera vez), ~10 minutos (actualizaciones)

**Archivo:** `.github/workflows/deploy-do.yml`

---

### 2. `deploy-do-inputs.yml` — Deployment Manual con Opciones

**Cuándo se ejecuta:**
- Solo manualmente desde GitHub Actions
- Permite especificar parámetros antes de desplegar

**Parámetros disponibles:**
```
action:              deploy | restart | rollback | destroy
droplet_size:        s-1vcpu-512mb-10gb to s-6vcpu-16gb-320gb
region:              nyc1, nyc3, sfo2, sfo3, lon1, ams3, fra1, etc.
app_url:             https://tu-dominio.com
enable_backups:      true | false
enable_monitoring:   true | false
```

**Ejemplos:**

Desplegar en región específica:
```
action: deploy
region: lon1
droplet_size: s-2vcpu-4gb
app_url: https://automatizawpp.com
```

Simplemente reiniciar la app:
```
action: restart
```

Destruir completamente (¡CUIDADO!):
```
action: destroy
```

**Archivo:** `.github/workflows/deploy-do-inputs.yml`

---

## Secrets Requeridos

### Checklist de Configuración

```markdown
[ ] DO_TOKEN — Token de DigitalOcean API
[ ] DO_DROPLET_NAME — Nombre del droplet (ej: sales-os-prod)
[ ] DO_SSH_PRIVATE_KEY — Llave SSH privada
[ ] DATABASE_PASSWORD — Contraseña PostgreSQL
[ ] REDIS_PASSWORD — Contraseña Redis
[ ] ANTHROPIC_API_KEY — Llave de Anthropic Claude
[ ] NEXTAUTH_SECRET — Secreto para NextAuth
[ ] ANTHROPIC_MODEL — Modelo a usar (opcional)
[ ] BIRD_API_KEY — (si usas Bird)
[ ] BREVO_API_KEY — (si usas Brevo)
[ ] SMTP_* — Variables SMTP (si usas email)
[ ] APP_DOMAIN — Tu dominio (opcional)
[ ] LE_EMAIL — Email para Let's Encrypt
[ ] SLACK_WEBHOOK_URL — (opcional, para notificaciones)
```

### Validación de Secrets

GitHub valida automáticamente:
- ✅ Que todos los secrets obligatorios existan
- ✅ Que docker-compose.prod.yml sea válido
- ✅ Que el repositorio sea accesible

Si falta algo, el workflow fallará con mensaje claro.

---

## Workflows En Acción

### Ver Progreso de Deployment

1. Ve a **GitHub → Actions**
2. Selecciona el workflow más reciente
3. Haz click para ver logs detallados
4. Cada paso tiene output claro

**Ejemplo de output:**
```
✅ Validating configuration...
✅ All required secrets present
✅ docker-compose.prod.yml validated
📦 Creating new droplet: sales-os-prod
✅ Droplet created: ID=12345678, IP=192.0.2.100
🔥 Creating firewall...
✅ Firewall configured
⚙️ Setting up droplet...
🐳 Starting Docker services
📊 Initializing database
🔒 Configuring SSL certificate
⚙️ Configuring Nginx
🏥 Performing health check
✅ Application is healthy
```

### Acceder a Droplet

Una vez deployado:

```bash
# SSH al droplet
ssh -i ~/.ssh/do_deploy root@[DROPLET_IP]

# Ver logs
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs -f app

# Restart servicios
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml restart

# Verificar salud
curl https://automatizawpp.com/api/health
```

### Status de Servicios

```bash
ssh root@[DROPLET_IP]
cd /opt/automatizawppBR

# Ver estado
docker-compose -f docker-compose.prod.yml ps

# Output esperado:
# NAME                    STATUS
# sales-os-postgres       Up 5 minutes (healthy)
# sales-os-redis          Up 5 minutes (healthy)
# sales-os-app            Up 5 minutes (healthy)
# sales-os-nginx          Up 5 minutes
```

---

## Troubleshooting

### Problema: "Secrets not found"

**Causa:** Olvidaste agregar secrets a GitHub

**Solución:**
```bash
# Ve a Settings → Secrets → Add all required secrets
# Luego vuelve a disparar el workflow
```

### Problema: "Cannot connect to Docker daemon"

**Causa:** Docker no está iniciado en el droplet

**Solución:**
```bash
ssh root@[DROPLET_IP]
systemctl start docker
systemctl enable docker
docker ps
```

### Problema: "Database connection refused"

**Causa:** PostgreSQL no está listo

**Solución:**
```bash
ssh root@[DROPLET_IP]
cd /opt/automatizawppBR

# Ver logs de postgres
docker-compose -f docker-compose.prod.yml logs postgres

# Restart postgres
docker-compose -f docker-compose.prod.yml restart postgres

# Esperar 30 segundos y reintentar
sleep 30
docker-compose -f docker-compose.prod.yml exec -T app npm run db:push
```

### Problema: "SSL certificate error"

**Causa:** Let's Encrypt no puede validar el dominio

**Solución:**
```bash
# Verificar que tu DNS apunta al droplet
nslookup automatizawpp.com
# Debe mostrar la IP del droplet

# Luego retry certificado
ssh root@[DROPLET_IP]
certbot renew --force-renewal
```

### Problema: "Application not responding"

**Causa:** App no está healthy

**Solución:**
```bash
ssh root@[DROPLET_IP]
cd /opt/automatizawppBR

# Ver logs
docker-compose -f docker-compose.prod.yml logs app | tail -50

# Revisar environment variables
cat .env.production | grep -E "DATABASE|ANTHROPIC|APP_URL"

# Reiniciar
docker-compose -f docker-compose.prod.yml restart app
```

### Problema: "Workflow timeout"

**Causa:** Deployment tarda demasiado

**Solución:**
```
1. Aumenta el timeout en el workflow (timeout-minutes: 60)
2. Usa un droplet más grande
3. Revisa logs para ver dónde se tranca
```

### Ver Logs del Deployment

**GitHub Actions logs:**
```
Actions → Selecciona workflow → Click en "Deploy" → Ver cada step
```

**Logs en Droplet:**
```bash
ssh root@[DROPLET_IP]
cd /opt/automatizawppBR

# App logs
docker-compose logs -f app

# PostgreSQL logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis

# Nginx logs
docker-compose logs -f nginx
```

---

## Referencia Técnica

### Estructura del Deployment

```
GitHub → GitHub Actions → Docker Build
                         ↓
                    DigitalOcean API
                         ↓
                    Crea/Actualiza Droplet
                         ↓
                    Configura Firewall
                         ↓
                    Clona Repositorio
                         ↓
                    Configura Secrets
                         ↓
                    docker-compose up -d
                         ↓
                    Migraciones BD
                         ↓
                    Configura SSL
                         ↓
                    Configura Nginx
                         ↓
                    Health Checks
```

### Servicios Deployados

| Servicio | Puerto | Función |
|----------|--------|---------|
| **PostgreSQL** | 5432 | Base de datos principal |
| **Redis** | 6379 | Cache y sesiones |
| **Next.js App** | 3000 | Aplicación principal |
| **Nginx** | 80, 443 | Reverse proxy + SSL |

### Puertos Abiertos

| Puerto | Protocolo | Origen | Propósito |
|--------|-----------|--------|----------|
| 22 | TCP | Anywhere | SSH |
| 80 | TCP | Anywhere | HTTP (redirige a HTTPS) |
| 443 | TCP | Anywhere | HTTPS (aplicación) |
| 3000 | TCP | Anywhere | App directa (opcional) |

### Environment Variables

Todas las variables se inyectan desde GitHub Secrets en tiempo de deployment:

```env
DATABASE_*          # PostgreSQL credentials
REDIS_*             # Redis credentials
ANTHROPIC_*         # Anthropic API keys
BIRD_*              # Bird API integration
BREVO_*             # Brevo email service
SMTP_*              # SMTP server config
NEXTAUTH_*          # Authentication secrets
APP_URL             # Application domain
WORKSPACE_*         # Application settings
```

### SSL/TLS Automático

- **Proveedor:** Let's Encrypt
- **Certificado:** Válido por 90 días
- **Renovación:** Automática (cron job en droplet)
- **Fallback:** Si automático falla, renovación manual disponible

---

## Operaciones Comunes

### Actualizar Código (Automático)

```bash
git add .
git commit -m "Fix: xxx"
git push origin main

# Deployment automático se inicia
# Espera ~10 minutos para actualización
```

### Reiniciar la App (Sin Redeployed)

**Vía Workflow:**
1. Actions → "Deploy to DigitalOcean (Manual with Inputs)"
2. Selecciona **action: restart**
3. Run workflow

**Vía SSH:**
```bash
ssh root@[DROPLET_IP]
cd /opt/automatizawppBR
docker-compose -f docker-compose.prod.yml restart app
```

### Cambiar Variables de Entorno

1. Ve a **Settings → Secrets → Actions**
2. Edita el secret que necesites
3. Dispara el workflow manualmente (action: deploy)

### Backup de Base de Datos

**Manual:**
```bash
ssh root@[DROPLET_IP]
cd /opt/automatizawppBR

# Crear backup
docker-compose exec -T postgres pg_dump -U postgres sales_os > sales_os_backup_$(date +%Y%m%d).sql

# Descargar localmente
scp -i ~/.ssh/do_deploy root@[DROPLET_IP]:/opt/automatizawppBR/*.sql ./
```

**Automático:** Habilita backups en DigitalOcean dashboard

### Escalar el Droplet

```bash
# Aumentar resources (más CPU/RAM):
1. Apaga el droplet en DO dashboard
2. Redimensiona a tamaño mayor
3. Reinicia
4. Los servicios se recuperan automáticamente
```

---

## Seguridad

### Checklist

- [ ] SSH key segura (Ed25519 mínimo)
- [ ] Database password fuerte (32+ caracteres)
- [ ] NEXTAUTH_SECRET único y seguro
- [ ] Firewall limitando IPs (opcional)
- [ ] SSL/TLS activo (verificar con HTTPS)
- [ ] Logs revisados regularmente
- [ ] Backups habilitados

### Mejores Prácticas

1. **Rotación de Secrets:**
   - Cambia DATABASE_PASSWORD cada 3 meses
   - Usa `openssl rand -base64 32` para generar

2. **Monitoreo:**
   - Activa DO Monitoring en dashboard
   - Configura alertas de CPU/Memory

3. **Logs:**
   - Revisa logs regularmente: `docker-compose logs app`
   - Archiva logs importantes

4. **Backups:**
   - Habilita backups automáticos en DO
   - Prueba restauración cada mes

---

## Support & Resources

### Documentación

- **GitHub Actions:** https://docs.github.com/en/actions
- **DigitalOcean API:** https://docs.digitalocean.com/reference/api/
- **Docker Compose:** https://docs.docker.com/compose/
- **Next.js:** https://nextjs.org/docs
- **Anthropic Claude:** https://docs.anthropic.com

### Debugging

**Habilitar debug logs en workflow:**
```yaml
env:
  ACTIONS_STEP_DEBUG: true
```

**Ver logs completos en SSH:**
```bash
ssh root@[DROPLET_IP]
journalctl -u docker -f
```

### Contactar Soporte

- **DigitalOcean:** https://support.digitalocean.com
- **GitHub:** https://support.github.com
- **Anthropic:** https://support.anthropic.com

---

## Cambios Recientes

**2026-04-29:**
- ✅ Workflow `deploy-do.yml` completado
- ✅ Workflow `deploy-do-inputs.yml` con opciones manual
- ✅ Guía de setup detallada
- ✅ Troubleshooting comprehensive
- ✅ Seguridad y best practices

---

## FAQ

**P: ¿Cuánto cuesta?**
R: Droplet s-2vcpu-4gb = ~$24/mes en DigitalOcean

**P: ¿Se puede revertir?**
R: Sí, usa workflow con `action: rollback`

**P: ¿Se puede usar otro proveedor cloud?**
R: Actualmente GitHub Actions ↔ DigitalOcean. AWS/Azure requeriría adaptaciones.

**P: ¿Qué pasa si empujo cambios?**
R: Se inicia deployment automático. Espera a que termine antes de otro push.

**P: ¿Dónde veo los logs?**
R: GitHub Actions UI + SSH al droplet

**P: ¿Se puede programar deployments?**
R: Sí, usa `schedule:` en el workflow YAML

**P: ¿Se puede hacer deployment parcial?**
R: Sí, usa `deploy-do-inputs.yml` con `action: restart`

---

**¡Listo!** Tu deployment automático está configurado. 

Próximos pasos:
1. ✅ Agregar todos los secrets a GitHub
2. ✅ Haz `git push origin main`
3. ✅ Ve a Actions y observa el deployment
4. ✅ Espera ~20 minutos
5. ✅ Visita https://automatizawpp.com

¿Preguntas? Revisa los logs detallados en GitHub Actions.
