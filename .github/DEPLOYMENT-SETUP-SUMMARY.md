# 🎯 AutomatizaWPP Deployment — Setup Summary

**Fecha:** 2026-04-29  
**Status:** ✅ Completado y listo para uso  
**Tiempo de setup:** ~5 minutos (si tienes DigitalOcean token)  

---

## Resumen de lo Creado

Se han creado los siguientes archivos para automatizar el deployment a DigitalOcean:

### 1. Workflows de GitHub Actions

#### `.github/workflows/deploy-do.yml`
- **Propósito:** Deployment automático principal
- **Disparo:** 
  - Automático en cada `git push` a `main`
  - Manual desde GitHub Actions
- **Acciones:**
  - Valida configuración y secrets
  - Compila imagen Docker
  - Crea/actualiza droplet
  - Configura firewall
  - Instala servicios
  - Migraciones de BD
  - SSL automático
  - Health checks
- **Duración:** 20-30 min (primera vez), 10 min (actualizaciones)

#### `.github/workflows/deploy-do-inputs.yml`
- **Propósito:** Deployment manual con opciones configurables
- **Disparo:** Manual con parámetros (action, region, size, etc.)
- **Acciones:**
  - `deploy` — Desplegar nueva versión
  - `restart` — Reiniciar aplicación
  - `rollback` — Revertir a versión anterior
  - `destroy` — Destruir droplet completamente
- **Opciones:**
  - Seleccionar región (nyc3, lon1, sfo3, etc.)
  - Seleccionar tamaño (s-1vcpu a s-6vcpu)
  - Activar/desactivar backups
  - Activar/desactivar monitoring

### 2. Documentación

#### `README-DEPLOYMENT.md` (17 KB)
- Setup completo paso a paso
- Explicación de cada workflow
- Lista completa de secrets requeridos
- Troubleshooting detallado
- Guía de operaciones comunes
- Referencia técnica
- FAQ

#### `QUICK-START.md` (3 KB)
- Guía rápida (5 minutos)
- Pasos simplificados
- Operaciones comunes
- Troubleshooting básico

#### `DEPLOYMENT-CHECKLIST.md` (9 KB)
- Checklist pre-deployment
- Checklist de ejecución
- Checklist post-deployment
- Validaciones de seguridad

### 3. Scripts Auxiliares

#### `.github/workflows/setup-secrets.sh` (11 KB)
- Script bash interactivo
- Genera contraseñas seguras
- Guía paso a paso
- Agrega secrets a GitHub automáticamente
- Usa `gh` CLI (debe estar autenticado primero)

---

## Quick Setup (5 minutos)

### Paso 1: Obtener Credenciales
```bash
# DigitalOcean Token
# → https://cloud.digitalocean.com/account/api/tokens
# → Generate New Token
# → Scopes: read + write
# → Copiar token (aparece UNA sola vez)

# Anthropic API Key
# → https://console.anthropic.com/account/keys
# → Crear/copiar key

# SSH Key
# → Usar ~/.ssh/id_rsa o crear nueva
# → Agregar pública a DigitalOcean
```

### Paso 2: Agregar Secrets a GitHub
```bash
# Settings → Secrets and variables → Actions → New repository secret

# 7 Secretos Obligatorios:
DO_TOKEN                  # De DigitalOcean
DO_DROPLET_NAME          # sales-os-prod
DO_SSH_PRIVATE_KEY       # Contenido de ~/.ssh/id_rsa
DATABASE_PASSWORD        # Fuerte: openssl rand -base64 32
REDIS_PASSWORD           # Fuerte: openssl rand -base64 32
ANTHROPIC_API_KEY        # De Anthropic
NEXTAUTH_SECRET          # Fuerte: openssl rand -base64 32
```

### Paso 3: Hacer Push
```bash
git add .
git commit -m "Deploy to DigitalOcean"
git push origin main

# Espera ~20 minutos
# Ve a: Actions → Ver progreso
```

---

## Estructura de Archivos

```
.github/
├── workflows/
│   ├── deploy-do.yml                 # Workflow automático (26 KB)
│   ├── deploy-do-inputs.yml          # Workflow manual (18 KB)
│   └── setup-secrets.sh              # Script setup (11 KB)
├── QUICK-START.md                    # Guía rápida (3 KB)
├── DEPLOYMENT-SETUP-SUMMARY.md       # Este archivo
└── DEPLOYMENT-CHECKLIST.md           # Checklist (9 KB)

/root
├── README-DEPLOYMENT.md              # Documentación completa (17 KB)
├── DEPLOYMENT.md                     # Manual anterior (mantener)
└── ... otros archivos
```

---

## Secrets Requeridos (Obligatorios)

| Secret | Descripción | Cómo obtenerlo |
|--------|-------------|----------------|
| **DO_TOKEN** | Token API DigitalOcean | https://cloud.digitalocean.com/account/api/tokens |
| **DO_DROPLET_NAME** | Nombre del servidor | Cualquier nombre (ej: sales-os-prod) |
| **DO_SSH_PRIVATE_KEY** | Llave SSH privada | `cat ~/.ssh/id_rsa` |
| **DATABASE_PASSWORD** | Contraseña PostgreSQL | `openssl rand -base64 32` |
| **REDIS_PASSWORD** | Contraseña Redis | `openssl rand -base64 32` |
| **ANTHROPIC_API_KEY** | Key de Anthropic Claude | https://console.anthropic.com/account/keys |
| **NEXTAUTH_SECRET** | Secreto de autenticación | `openssl rand -base64 32` |

---

## Secrets Opcionales (Integraciones)

```
ANTHROPIC_MODEL          # claude-sonnet-4-20250514 (default)
DO_REGION                # nyc3, lon1, sfo3, etc. (default: nyc3)
DO_SIZE                  # s-2vcpu-4gb, etc. (default)
BIRD_API_KEY             # Si usas Bird API
BIRD_WORKSPACE_ID        # Si usas Bird
BIRD_CHANNEL_ID          # Si usas Bird
BIRD_EMAIL_CHANNEL_ID    # Si usas Bird
BREVO_API_KEY            # Si usas Brevo
SMTP_*                   # Si usas email SMTP
APP_DOMAIN               # Tu dominio
LE_EMAIL                 # Email para Let's Encrypt
APP_URL                  # URL de aplicación
SLACK_WEBHOOK_URL        # Si usas Slack
```

---

## Flujo de Deployment

```
Git Push a Main
       ↓
GitHub Actions Triggered
       ↓
Validation Job
  - Verifica secrets
  - Valida docker-compose.yml
  - Genera image tag
       ↓
Build Job
  - Compila Docker image
  - Pushea a GitHub Container Registry
       ↓
Infrastructure Job
  - Crea/actualiza Droplet
  - Configura Firewall
  - Reserva Floating IP
       ↓
Deploy Job
  - Conecta por SSH
  - Instala Docker/servicios
  - Clona código
  - Configura variables
  - Inicia docker-compose
  - Ejecuta migraciones
  - Configura SSL
  - Configura Nginx
  - Health checks
       ↓
Report Job
  - Genera reporte de deployment
  - Envía notificación Slack (opcional)
  - Publica release en GitHub
       ↓
✅ Aplicación Live en HTTPS
```

---

## Comandos Útiles

### Generar contraseñas seguras
```bash
openssl rand -base64 32
```

### Ver status de deployment
```bash
# GitHub Actions UI
# → Actions → Selecciona workflow → Expandir jobs
```

### Conectar al droplet
```bash
# Obtén IP del workflow o dashboard de DigitalOcean
ssh -i ~/.ssh/id_rsa root@[IP]

# O si creaste llave nueva:
ssh -i ~/.ssh/do_deploy root@[IP]
```

### Ver logs de aplicación
```bash
ssh root@[IP]
cd /opt/automatizawppBR
docker-compose -f docker-compose.prod.yml logs -f app
```

### Reiniciar aplicación
```bash
ssh root@[IP]
cd /opt/automatizawppBR
docker-compose -f docker-compose.prod.yml restart app
```

### Verificar servicios
```bash
ssh root@[IP]
cd /opt/automatizawppBR
docker-compose -f docker-compose.prod.yml ps
```

---

## Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| `Secrets not found` | Ve a Settings → Secrets, agrega los 7 obligatorios |
| `Cannot connect to Docker` | SSH y ejecuta: `systemctl start docker` |
| `Database connection refused` | SSH y ejecuta: `docker-compose restart postgres` |
| `SSL certificate error` | Verifica DNS apunta a IP del droplet |
| `Application timeout` | Aumenta `timeout-minutes` en workflow |
| `Permission denied (SSH)` | Verifica llave SSH privada en secret |
| `Docker image pull fails` | Verifica GITHUB_TOKEN tiene permisos |

---

## Checklist Pre-Launch

**Antes de hacer push:**
- [ ] 7 secrets obligatorios agregados a GitHub
- [ ] SSH key agregada a DigitalOcean
- [ ] DigitalOcean token válido
- [ ] Anthropic API key activa
- [ ] docker-compose.prod.yml actualizado
- [ ] Dockerfile validado
- [ ] Todos los scripts `.sh` tienen permisos correctos

**Después de deployment:**
- [ ] GitHub Actions workflow completado sin errores
- [ ] Droplet visible en DigitalOcean dashboard
- [ ] Aplicación responde en puerto 3000
- [ ] SSL certificado válido (Let's Encrypt)
- [ ] Nginx proxy funcionando
- [ ] Base de datos inicializada
- [ ] Health checks pasando
- [ ] DNS configurado (si dominio personalizado)

---

## Documentación Disponible

1. **QUICK-START.md** — 5 minutos para empezar
2. **README-DEPLOYMENT.md** — Guía completa y detallada (17 KB)
3. **DEPLOYMENT-CHECKLIST.md** — Checklist ejecutivo
4. **setup-secrets.sh** — Script interactivo para secrets

---

## Próximos Pasos

### 1. Agregar Secrets (5 min)
```bash
# Ve a GitHub Settings → Secrets
# O usa el script:
.github/workflows/setup-secrets.sh
```

### 2. Hacer Push (1 min)
```bash
git add .
git commit -m "Configure GitHub Actions deployment"
git push origin main
```

### 3. Monitorear (20-30 min)
```bash
# Ve a Actions en GitHub
# Observa cada job completarse
# Lee logs si hay errores
```

### 4. Verificar (5 min)
```bash
# Visita: https://automatizawpp.com
# O desde SSH: curl http://localhost:3000/api/health
```

---

## Características Incluidas

- ✅ **Automático:** Git push → Deployment automático
- ✅ **Manual:** Opciones de control manual
- ✅ **Validación:** Verifica secrets y configuración
- ✅ **Docker:** Compilación y push a registry
- ✅ **DigitalOcean:** Creación/actualización automática
- ✅ **Firewall:** Configuración automática
- ✅ **SSL:** Let's Encrypt automático
- ✅ **Nginx:** Reverse proxy con HTTPS
- ✅ **BD:** Migraciones automáticas
- ✅ **Health checks:** Validación post-deploy
- ✅ **Rollback:** Revert a versión anterior
- ✅ **Notificaciones:** Slack (opcional)
- ✅ **Logs:** Completos y detallados
- ✅ **Backups:** Configuración y documentación

---

## Costo Estimado

| Item | Costo Mensual |
|------|---------------|
| Droplet (s-2vcpu-4gb) | $24 |
| Floating IP | $6 |
| Backups (auto) | Incluido |
| Bandwidth | Incluido (1 TB) |
| **Total** | **~$30-40/mes** |

*Puede variar según región y uso*

---

## Soporte y Recursos

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **DigitalOcean API:** https://docs.digitalocean.com/reference/api/
- **doctl CLI:** https://docs.digitalocean.com/reference/doctl/
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Anthropic Claude:** https://docs.anthropic.com

---

## Notas Importantes

1. **Secrets son sensibles:** No los compartas ni los loguees
2. **Backups:** Habilita en DigitalOcean dashboard
3. **Monitoreo:** Usa DO dashboard para CPU/Memory/Disk
4. **Logs:** Disponibles en GitHub Actions + SSH droplet
5. **Rollback:** Usa workflow manual con `action: rollback`
6. **Escalado:** Aumenta droplet size sin perder datos

---

## Changelog

**2026-04-29:**
- ✅ Workflow `deploy-do.yml` completado (26 KB)
- ✅ Workflow `deploy-do-inputs.yml` completado (18 KB)
- ✅ Script `setup-secrets.sh` completado (11 KB)
- ✅ Documentación completa (README-DEPLOYMENT.md)
- ✅ QUICK-START guide
- ✅ DEPLOYMENT-CHECKLIST
- ✅ Este documento resumen

---

## Contacto y Preguntas

Para preguntas o issues:
1. Revisa `README-DEPLOYMENT.md` (sección Troubleshooting)
2. Revisa logs en GitHub Actions
3. SSH al droplet y revisa logs Docker
4. Abre issue en GitHub repository

---

## ¡Listo!

Tu sistema de deployment automático está completamente configurado.

**Próximo paso:** Agregar los 7 secrets a GitHub y hacer push.

```
Tiempo estimado para primer deployment: 20-30 minutos
Aplicación estará en: https://automatizawpp.com
```

---

**Estado:** ✅ **COMPLETADO Y LISTO PARA USAR**

**Última actualización:** 2026-04-29
