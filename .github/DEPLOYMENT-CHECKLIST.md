# AutomatizaWPP Deployment — Pre-Launch Checklist

Antes de hacer el primer deployment, verifica todos estos puntos.

---

## Pre-Deployment (ANTES de hacer push)

### DigitalOcean Setup

- [ ] Crear cuenta en https://digitalocean.com
- [ ] Generar API Token (Settings → API)
  - [ ] Token tiene permisos "read" y "write"
  - [ ] Copiar token (aparece una sola vez)
- [ ] Agregar SSH key pública a DigitalOcean
  - [ ] Generar o usar SSH key existente
  - [ ] Copiar llave pública
  - [ ] Agregar en https://cloud.digitalocean.com/account/security/keys

### Anthropic API

- [ ] Ir a https://console.anthropic.com/account/keys
- [ ] Crear nueva API key (si no existe)
- [ ] Copiar key (formato: sk-ant-xxxxx)

### GitHub Repository Secrets

- [ ] Ir a Settings → Secrets and variables → Actions
- [ ] Agregar secret: **DO_TOKEN**
  - [ ] Valor: Token de DigitalOcean
- [ ] Agregar secret: **DO_DROPLET_NAME**
  - [ ] Valor: sales-os-prod (o nombre deseado)
- [ ] Agregar secret: **DO_SSH_PRIVATE_KEY**
  - [ ] Valor: Contenido de archivo privado (~/.ssh/id_rsa o ~/.ssh/do_deploy)
- [ ] Agregar secret: **DATABASE_PASSWORD**
  - [ ] Valor: Contraseña fuerte (mínimo 16 caracteres)
  - [ ] Generar con: `openssl rand -base64 32`
- [ ] Agregar secret: **REDIS_PASSWORD**
  - [ ] Valor: Contraseña fuerte
  - [ ] Generar con: `openssl rand -base64 32`
- [ ] Agregar secret: **ANTHROPIC_API_KEY**
  - [ ] Valor: sk-ant-xxxxx (de Anthropic)
- [ ] Agregar secret: **NEXTAUTH_SECRET**
  - [ ] Valor: Contraseña de 32+ caracteres
  - [ ] Generar con: `openssl rand -base64 32`

### Secrets Opcionales

- [ ] **ANTHROPIC_MODEL**: claude-sonnet-4-20250514 (o versión actual)
- [ ] **DO_REGION**: nyc3, lon1, sfo3, etc. (tu región preferida)
- [ ] **DO_SIZE**: s-2vcpu-4gb (o tamaño deseado)
- [ ] **BIRD_API_KEY**: (si usas Bird)
- [ ] **BIRD_WORKSPACE_ID**: (si usas Bird)
- [ ] **BIRD_CHANNEL_ID**: (si usas Bird)
- [ ] **BIRD_EMAIL_CHANNEL_ID**: (si usas Bird)
- [ ] **BREVO_API_KEY**: (si usas Brevo)
- [ ] **SMTP_HOST**: smtp.zoho.com (o tu servidor)
- [ ] **SMTP_PORT**: 587
- [ ] **SMTP_USER**: email@dominio.com
- [ ] **SMTP_PASS**: contraseña
- [ ] **MAIL_FROM**: AutomatizaWPP <noreply@automatizawpp.com>
- [ ] **APP_DOMAIN**: automatizawpp.com (tu dominio)
- [ ] **LE_EMAIL**: tu@email.com (para Let's Encrypt)
- [ ] **APP_URL**: https://automatizawpp.com
- [ ] **SLACK_WEBHOOK_URL**: (si usas Slack)

### Código & Configuración

- [ ] Repositorio está en GitHub
- [ ] Rama principal es `main`
- [ ] Archivo `docker-compose.prod.yml` existe
- [ ] Archivo `Dockerfile` existe
- [ ] `.env.production.example` está actualizado
- [ ] No hay archivos sensibles en el repo (`.env` debe estar en `.gitignore`)
- [ ] `package.json` tiene scripts: `build`, `start`, `db:generate`, `db:push`

### DNS (si usas dominio personalizado)

- [ ] Dominio registrado y accesible
- [ ] DNS configurado para apuntar a DigitalOcean (cuando el droplet esté listo)
- [ ] Email para Let's Encrypt certificado

---

## Deployment (El Día)

### Ejecutar Workflow

- [ ] Hacer push a `main` branch
  ```bash
  git add .
  git commit -m "Setup GitHub Actions deployment"
  git push origin main
  ```

- [ ] **O** Disparar manualmente:
  1. GitHub → Actions
  2. Seleccionar workflow
  3. "Run workflow"

### Monitorear Deployment

- [ ] GitHub Actions mostrando workflow en progreso
- [ ] Ir a Actions y expandir cada job
- [ ] Leer logs para verificar cada paso:
  - [ ] ✅ Validación de secrets
  - [ ] ✅ Compilación de Docker
  - [ ] ✅ Creación de droplet
  - [ ] ✅ Configuración de firewall
  - [ ] ✅ Instalación de Docker
  - [ ] ✅ Clonación de código
  - [ ] ✅ Configuración de variables
  - [ ] ✅ Inicio de servicios
  - [ ] ✅ Migraciones de BD
  - [ ] ✅ Configuración de SSL
  - [ ] ✅ Health checks

- [ ] Deployment completado exitosamente (Green checkmarks)
- [ ] Tiempo total: ~20-30 minutos (primera vez), ~10 minutos (updates)

### Verificación Post-Deployment

- [ ] Droplet creado en DigitalOcean dashboard
- [ ] Droplet tiene dirección IP pública
- [ ] Firewall creado y configurado
- [ ] Ver logs desde droplet:
  ```bash
  ssh root@[DROPLET_IP]
  docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml ps
  # Debe mostrar todos los servicios como "healthy" o "Up"
  ```

- [ ] PostgreSQL está corriendo:
  ```bash
  docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml exec postgres psql -U postgres -d sales_os -c "SELECT 1"
  # Debe retornar: 1
  ```

- [ ] Redis está corriendo:
  ```bash
  docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml exec redis redis-cli ping
  # Debe retornar: PONG
  ```

- [ ] Aplicación está accesible:
  ```bash
  curl https://automatizawpp.com/api/health
  # Debe retornar: 200 OK
  ```

### DNS Setup (si es dominio personalizado)

- [ ] Obtener IP pública del droplet
  ```bash
  doctl compute droplet list
  # O desde DigitalOcean dashboard
  ```

- [ ] Apuntar DNS de tu dominio a esta IP:
  - [ ] A record: automatizawpp.com → [DROPLET_IP]
  - [ ] CNAME: www.automatizawpp.com → automatizawpp.com

- [ ] Verificar resolución DNS:
  ```bash
  nslookup automatizawpp.com
  # Debe mostrar la IP del droplet
  ```

- [ ] Esperar propagación (puede tomar 5-30 minutos)

- [ ] Verificar HTTPS:
  ```bash
  curl https://automatizawpp.com
  # Debe retornar contenido HTML (no error de certificado)
  ```

### Configurar Webhooks (Integraciones)

- [ ] Bird API: Actualizar webhook URLs
  - [ ] Cambiar: `https://tu-antiguo-dominio` → `https://automatizawpp.com`
  
- [ ] Brevo: Actualizar webhook URLs
  - [ ] Cambiar dominios en configuración
  
- [ ] n8n: Actualizar webhooks
  - [ ] Cambiar dominios en configuración

- [ ] Verificar webhooks funcionando:
  - [ ] Enviar test desde Bird → Debe llegar a `/api/events/inbound`
  - [ ] Enviar test desde Brevo → Debe procesarse

---

## Post-Deployment (Después de 48 horas)

### Monitoreo

- [ ] Revisar logs en GitHub Actions (histórico de deployments)
- [ ] Ver status en DigitalOcean dashboard
- [ ] CPU usage < 50%
- [ ] Memory usage < 70%
- [ ] Disk usage < 50%

### Alertas y Notificaciones

- [ ] Slack alertas funcionando (si configuraste)
- [ ] Email alertas configuradas (opcional)

### Backups

- [ ] Habilitar backups automáticos en DigitalOcean
  - [ ] Dashboard → Droplet → Settings → Backups
  - [ ] Habilitar semanal

- [ ] Crear backup manual de base de datos:
  ```bash
  ssh root@[DROPLET_IP]
  docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml exec postgres pg_dump -U postgres sales_os > backup_$(date +%Y%m%d).sql
  scp -i ~/.ssh/do_deploy root@[DROPLET_IP]:/opt/automatizawppBR/backup_*.sql ./backups/
  ```

### Seguridad

- [ ] Cambiar contraseña root si es necesario
- [ ] Configurar SSH key-only login (sin password)
  ```bash
  ssh root@[DROPLET_IP]
  nano /etc/ssh/sshd_config
  # PasswordAuthentication no
  systemctl restart sshd
  ```

- [ ] Revisar firewall rules en DigitalOcean

### Documentación

- [ ] Guardar credenciales en lugar seguro (1Password, Vault, etc.)
- [ ] Documentar:
  - [ ] Droplet IP
  - [ ] SSH key location
  - [ ] Acceso a DigitalOcean
  - [ ] Backup process
- [ ] Crear runbook para emergencias:
  - [ ] Cómo reiniciar
  - [ ] Cómo revertir
  - [ ] Cómo restaurar backup

---

## Troubleshooting Durante Deployment

### Si falla la validación de secrets

```bash
# Verifica que TODOS los 7 obligatorios están en GitHub
# Settings → Secrets and variables → Actions

# Vuelve a intentar (re-run workflow)
GitHub Actions → Workflow → Re-run all jobs
```

### Si falla la compilación de Docker

```bash
# El workflow lo mostrará claramente
# Revisa el error específico en GitHub Actions logs

# Soluciones comunes:
# 1. Dockerfile tiene errores de sintaxis
# 2. npm install falla → revisar package.json
# 3. npm run build falla → revisar errores de TypeScript
```

### Si falla la creación del droplet

```bash
# Verifica:
# 1. DO_TOKEN es válido y tiene permisos read+write
# 2. SSH key está agregada a DigitalOcean
# 3. No alcanzaste limite de droplets (ve a DigitalOcean dashboard)
# 4. Región especificada existe
```

### Si falla docker-compose up

```bash
# SSH al droplet y revisar logs manualmente:
ssh root@[DROPLET_IP]
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs -f

# Soluciones comunes:
# 1. Variables de entorno incompletas → revisar .env.production
# 2. PostgreSQL timeout → esperar, luego restart
# 3. Puerto en uso → revisar qué está usando el puerto
```

---

## Rollback (Revertir a versión anterior)

### Si deployment causa problema:

```bash
# Opción 1: Vía workflow manual
GitHub Actions → "Deploy to DigitalOcean (Manual with Inputs)"
action: rollback

# Opción 2: Vía SSH manual
ssh root@[DROPLET_IP]
cd /opt/automatizawppBR
git revert HEAD
docker-compose -f docker-compose.prod.yml restart app
```

---

## Checklist Final Antes de Ir a Producción

- [ ] Todos los secrets configurados
- [ ] Deployment completado sin errores
- [ ] Aplicación accesible en dominio
- [ ] SSL/HTTPS funcionando
- [ ] Webhooks de Bird/Brevo configurados
- [ ] Base de datos con datos iniciales
- [ ] Health checks pasando
- [ ] Logs sin errores
- [ ] Backup habilitado
- [ ] Notificaciones configuradas
- [ ] Team notificado de deployment exitoso
- [ ] Monitoreo en DigitalOcean habilitado

---

✅ **¡Listo para Producción!**

```
https://automatizawpp.com
```
