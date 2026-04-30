# Índice de Documentación — Deployment Automático

Este documento centraliza toda la información sobre el setup automático de deployment a DigitalOcean.

---

## Archivos de Configuración

### `.env.deploy.example`
- **Tipo**: Template de configuración
- **Líneas**: 297
- **Contenido**: Todas las credenciales necesarias con instrucciones
- **Uso**: Copiar a `.env.deploy` y rellenar valores
- **Ubicación**: Raíz del proyecto

```bash
cp .env.deploy.example .env.deploy
nano .env.deploy
```

---

## Scripts Ejecutables

Todos los scripts son **IDEMPOTENTES** — pueden ejecutarse múltiples veces sin problemas.

### `scripts/deploy-setup.sh`
- **Tipo**: Script principal de setup
- **Líneas**: 500+
- **Función**: Configura todo automáticamente
- **Pasos**:
  1. Valida variables en `.env.deploy`
  2. Genera contraseñas si están vacías
  3. Configura GitHub Secrets
  4. Activa GitHub Actions
  5. Realiza push para iniciar deployment

**Uso**:
```bash
bash scripts/deploy-setup.sh
```

**Tiempo**: 2-3 minutos

---

### `scripts/deploy-verify.sh`
- **Tipo**: Script de verificación (NUNCA modifica)
- **Líneas**: 350+
- **Función**: Verifica que todo esté configurado correctamente
- **Verifica**:
  - Todos los secrets en GitHub
  - Droplet en DigitalOcean
  - Salud de la aplicación

**Uso**:
```bash
bash scripts/deploy-verify.sh
```

**Cuándo usarlo**: 
- Después de `deploy-setup.sh`
- Antes de hacer cambios
- Para diagnosticar problemas

---

### `scripts/deploy-update-secrets.sh`
- **Tipo**: Script interactivo de actualización
- **Líneas**: 350+
- **Función**: Actualizar secrets sin reejecutar setup
- **Opciones**:
  1. Actualizar un secret específico
  2. Sincronizar todos de `.env.deploy`
  3. Ver secrets en GitHub
  4. Eliminar un secret
  5. Listar secrets disponibles

**Uso**:
```bash
bash scripts/deploy-update-secrets.sh
```

**Cuándo usarlo**: 
- Cambiar una credencial (API key renovada)
- Agregar un nuevo secret
- Sincronizar con GitHub

---

## Documentación

Leer en este orden:

### 1. `QUICK-DEPLOY.md` (Comienza aquí)
- **Tipo**: Guía rápida
- **Líneas**: 100
- **Tiempo**: 2 minutos de lectura
- **Contenido**:
  - Checklist de 5 pasos
  - URLs para obtener credenciales
  - Troubleshooting rápido

```bash
cat QUICK-DEPLOY.md
```

---

### 2. `DEPLOYMENT.md` (Guía completa)
- **Tipo**: Documentación detallada
- **Líneas**: 500+
- **Tiempo**: 15-20 minutos de lectura
- **Secciones**:
  1. Requisitos previos
  2. Obtención de credenciales (paso a paso)
  3. Configuración inicial
  4. Ejecución del setup
  5. Monitoreo del deployment
  6. Configuración de DNS
  7. Solución de problemas
  8. Operaciones posteriores

```bash
cat DEPLOYMENT.md
```

---

### 3. `DEPLOYMENT_SUMMARY.md` (Resumen ejecutivo)
- **Tipo**: Resumen técnico
- **Líneas**: 300+
- **Tiempo**: 5-10 minutos de lectura
- **Contenido**:
  - Tabla de archivos creados
  - Flujo de uso (primer deploy + posteriores)
  - Variables críticas
  - Características de idempotencia
  - Infraestructura automática

```bash
cat DEPLOYMENT_SUMMARY.md
```

---

## Flujo Recomendado

### Para Primer Deployment

```
1. Leer QUICK-DEPLOY.md (2 min)
   ↓
2. cp .env.deploy.example .env.deploy
   ↓
3. Obtener credenciales (5 min)
   DO_TOKEN: https://cloud.digitalocean.com/account/api/tokens
   ANTHROPIC_API_KEY: https://console.anthropic.com/account/keys
   ↓
4. nano .env.deploy (5 min)
   └─ Rellena al menos: DO_TOKEN, ANTHROPIC_API_KEY, APP_DOMAIN, APP_URL
   ↓
5. bash scripts/deploy-setup.sh (2 min)
   ↓
6. Espera 20-30 minutos (GitHub Actions automático)
   ↓
7. bash scripts/deploy-verify.sh (2 min)
   ↓
8. Aplicación en vivo!
```

**Tiempo total**: 45 minutos

---

### Para Actualizaciones Posteriores

#### Cambiar código
```bash
git add .
git commit -m "Update feature"
git push origin main
# GitHub Actions redeploya automáticamente (5-10 min)
```

#### Actualizar credencial
```bash
bash scripts/deploy-update-secrets.sh
# Selecciona opción 1, elige el secret
```

#### Verificar estado
```bash
bash scripts/deploy-verify.sh
```

---

## Variables Críticas

### Obligatorias (SIN ESTAS NO FUNCIONA)

| Variable | Dónde obtener | Ejemplo |
|----------|---------------|---------|
| `DO_TOKEN` | https://cloud.digitalocean.com/account/api/tokens | `dop_v1_xxx...` |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/account/keys | `sk-ant-...` |
| `APP_DOMAIN` | Tu dominio | `automatizawpp.com` |
| `APP_URL` | Tu URL completa | `https://automatizawpp.com` |

### Auto-generadas (si están vacías)

```
DATABASE_PASSWORD    → Contraseña aleatoria (64 chars)
REDIS_PASSWORD       → Contraseña aleatoria (64 chars)
NEXTAUTH_SECRET      → Secret aleatorio (64 chars)
```

### Opcionales (dejar en blanco si no usas)

```
BIRD_API_KEY         → Si no usas Bird
BREVO_API_KEY        → Si no usas Brevo
SMTP_PASS            → Si no usas SMTP
SLACK_WEBHOOK_URL    → Si no quieres alertas
```

---

## GitHub Actions

### Workflow Actual

**Archivo**: `.github/workflows/deploy-do.yml`

**Fases**:
1. **Validate** (2-3 min): Verifica secrets
2. **Build** (5-10 min): Compila imagen Docker
3. **Prepare Infrastructure** (10-15 min): Crea droplet, firewall, IP
4. **Deploy** (15-20 min): Copia código, SSL, inicia servicios
5. **Report** (1-2 min): Genera reporte

**Tiempo total**: 20-30 minutos (primer deployment)

---

## Infraestructura Automática

```
DigitalOcean
├─ Droplet (Ubuntu 24.04)
│  ├─ PostgreSQL 16 (Database)
│  ├─ Redis 7 (Cache)
│  ├─ Node.js 20 + Next.js (App)
│  └─ Nginx (Reverse Proxy)
├─ Firewall (puertos 22, 80, 443, 3000)
├─ Floating IP (IP estática)
└─ Let's Encrypt (SSL automático)

GitHub Actions
├─ Valida secrets
├─ Compila Docker image
├─ Crea/actualiza infraestructura
└─ Deploya y reinicia servicios
```

---

## Seguridad

### Lo que está protegido

- `.env.deploy` → Gitignored (no se comitea)
- Credenciales → GitHub Secrets (encriptadas)
- SSH keys → Solo en GitHub Actions (no visible)

### Buenas prácticas

- Guarda credenciales en gestor de contraseñas
- Rota keys periódicamente
- Usa app passwords en Gmail (no contraseña real)
- Monitorea con Slack webhooks

---

## Troubleshooting Rápido

### "GitHub CLI not found"
```bash
# Instala desde https://cli.github.com/
gh auth login
```

### "Secrets not configured"
```bash
bash scripts/deploy-update-secrets.sh
# Opción 2: Sincronizar todos
```

### "Deployment no inicia"
```bash
# Verifica créditos en DigitalOcean
# Haz nuevo push:
git add . && git commit -m "Trigger" && git push
```

### "App not responding"
```bash
# SSH al droplet:
ssh root@[droplet-ip]
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs app
```

---

## URLs Importantes

| Servicio | URL |
|----------|-----|
| DigitalOcean Tokens | https://cloud.digitalocean.com/account/api/tokens |
| Anthropic API Keys | https://console.anthropic.com/account/keys |
| Brevo API | https://app.brevo.com/settings/account/api |
| Bird Dashboard | https://app.bird.com/account/settings |
| GitHub Actions | https://github.com/[tu-usuario]/automatizawppBR/actions |
| GitHub Secrets | https://github.com/[tu-usuario]/automatizawppBR/settings/secrets |
| DigitalOcean Console | https://cloud.digitalocean.com/droplets |

---

## Checklists

### Antes de Setup

- [ ] GitHub CLI instalado (`gh --version`)
- [ ] GitHub CLI autenticado (`gh auth status`)
- [ ] Repositorio en GitHub
- [ ] Cuenta DigitalOcean con créditos
- [ ] Cuenta Anthropic con créditos
- [ ] SSH key en ~/.ssh/id_ed25519 (o id_rsa)

### Setup Inicial

- [ ] cp .env.deploy.example .env.deploy
- [ ] Rellenado DO_TOKEN
- [ ] Rellenado ANTHROPIC_API_KEY
- [ ] Rellenado APP_DOMAIN
- [ ] Rellenado APP_URL
- [ ] bash scripts/deploy-setup.sh ejecutado sin errores

### Post-Deployment

- [ ] GitHub Actions completó exitosamente
- [ ] bash scripts/deploy-verify.sh muestra todo verde
- [ ] Aplicación responde en APP_URL
- [ ] DNS apuntado al droplet (si dominio personalizado)
- [ ] Webhooks configurados en Bird/Brevo/n8n

---

## Versiones

| Archivo | Versión | Fecha | Estado |
|---------|---------|-------|--------|
| .env.deploy.example | 1.0 | 2026-04-30 | Stable |
| deploy-setup.sh | 1.0 | 2026-04-30 | Stable |
| deploy-verify.sh | 1.0 | 2026-04-30 | Stable |
| deploy-update-secrets.sh | 1.0 | 2026-04-30 | Stable |
| DEPLOYMENT.md | 1.0 | 2026-04-30 | Stable |
| DEPLOYMENT_SUMMARY.md | 1.0 | 2026-04-30 | Stable |
| QUICK-DEPLOY.md | 1.0 | 2026-04-30 | Stable |
| INDEX-DEPLOYMENT.md | 1.0 | 2026-04-30 | Stable |

---

## Soporte

Si tienes problemas:

1. **Leer** DEPLOYMENT.md (sección Troubleshooting)
2. **Ejecutar** bash scripts/deploy-verify.sh
3. **Revisar** GitHub Actions logs
4. **SSH** al droplet y ver docker logs
5. **Actualizar** si necesario con deploy-update-secrets.sh

---

**Última actualización**: 2026-04-30
**Estado**: Producción-ready
**Idempotencia**: Todos los scripts son completamente idempotentes
