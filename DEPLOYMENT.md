# AutomatizaWPP — Guía de Deployment a DigitalOcean

Este documento guía el proceso completo de configuración y deployment automático de AutomatizaWPP Sales OS a DigitalOcean usando GitHub Actions.

---

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Ejecución del Setup](#ejecución-del-setup)
4. [Monitoreo del Deployment](#monitoreo-del-deployment)
5. [Solución de Problemas](#solución-de-problemas)
6. [Operaciones Posteriores](#operaciones-posteriores)

---

## Requisitos Previos

### Software

- **Git**: Sistema de control de versiones
  ```bash
  git --version  # Debe ser v2.20+
  ```

- **GitHub CLI (`gh`)**: Interfaz de línea de comandos de GitHub
  ```bash
  # Instala desde https://cli.github.com/
  gh --version
  gh auth login  # Autentica con tu cuenta de GitHub
  ```

- **OpenSSL**: Herramienta criptográfica (usualmente preinstalada)
  ```bash
  openssl version
  ```

- **SSH Keys**: Necesitas una llave SSH para acceder a DigitalOcean
  ```bash
  ls ~/.ssh/id_ed25519  # o ~/.ssh/id_rsa
  # Si no existe, crea una:
  ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
  ```

### Cuentas en la Nube

- **GitHub**: Repositorio público o privado con Actions habilitados
- **DigitalOcean**: Cuenta con créditos disponibles ($6-24/mes mínimo para producción)
- **Anthropic**: Cuenta con API key y créditos (para Claude)
- **Brevo/Bird**: Credenciales para email y mensajería (opcional)

---

## Configuración Inicial

### 1. Obtén tu DigitalOcean API Token

Este token permite a GitHub Actions crear y gestionar recursos en tu cuenta de DigitalOcean.

```bash
# 1. Ve a: https://cloud.digitalocean.com/account/api/tokens
# 2. Click "Generate New Token"
# 3. Nombre: "github-actions"
# 4. Scopes: Selecciona "read" y "write"
# 5. Click "Generate Token"
# 6. Copia el token (aparece una sola vez)
```

**Guarda el token en un lugar seguro** (Bitwarden, 1Password, etc.)

### 2. Agrega tu SSH Key Pública a DigitalOcean

GitHub Actions necesita acceso SSH al droplet para deployment.

```bash
# 1. Copia tu clave pública:
cat ~/.ssh/id_ed25519.pub | pbcopy

# 2. Ve a: https://cloud.digitalocean.com/account/security/keys
# 3. Click "Add SSH Key"
# 4. Pega el contenido
# 5. Click "Add SSH Key"
```

### 3. Obtén tus Credenciales de API

#### Anthropic Claude (Requerido)

```bash
# 1. Ve a: https://console.anthropic.com/account/keys
# 2. Click "Create Key"
# 3. Copia la key (formato: sk-ant-...)
# 4. Verifica que tu cuenta tenga créditos
```

#### Brevo Email (Opcional pero recomendado)

```bash
# 1. Login en: https://app.brevo.com/
# 2. Settings > Account > API
# 3. Click "Generate API Key"
# 4. Copia la key
```

#### Bird API (Opcional)

```bash
# 1. Login en: https://app.bird.com/
# 2. Account Settings > API Keys
# 3. Copia la API Key
```

### 4. Configura SMTP (Opcional)

Si usas Zoho Mail (recomendado):

```bash
# 1. Login en: https://mail.zoho.com/
# 2. Settings > Account
# 3. Genera App Password (para Zoho)
# 4. Usa en SMTP_PASS
```

Si usas Gmail:

```bash
# 1. Ve a: https://myaccount.google.com/apppasswords
# 2. Selecciona Mail y tu dispositivo
# 3. Copia la contraseña generada
# 4. Usa en SMTP_PASS
```

---

## Ejecución del Setup

### Paso 1: Crear el archivo de configuración

```bash
# En la raíz del proyecto
cp .env.deploy.example .env.deploy
```

### Paso 2: Rellenar las credenciales

```bash
# Abre el archivo con tu editor favorito
nano .env.deploy

# O con Vi/Vim:
vim .env.deploy

# O con VSCode:
code .env.deploy
```

**Variables Obligatorias** (sin estas, no funciona):

```
DO_TOKEN=                    # Tu token de DigitalOcean
ANTHROPIC_API_KEY=          # Tu API key de Anthropic
NEXTAUTH_SECRET=            # Se genera automáticamente si está vacío
APP_DOMAIN=                 # Tu dominio (ej: automatizawpp.com)
APP_URL=                    # URL completa (ej: https://automatizawpp.com)
```

**Variables Generadas Automáticamente** (si las dejas vacías):

```
DATABASE_PASSWORD=          # Se genera una contraseña aleatoria
REDIS_PASSWORD=             # Se genera una contraseña aleatoria
NEXTAUTH_SECRET=            # Se genera un secret aleatorio
```

**Variables Opcionales** (deja en blanco si no usas):

```
BIRD_API_KEY=               # Si no usas Bird
BREVO_API_KEY=              # Si no usas Brevo
SMTP_PASS=                  # Si no usas SMTP
```

### Paso 3: Ejecutar el script de setup

```bash
bash scripts/deploy-setup.sh
```

El script:
1. Valida que todas las variables obligatorias estén presentes
2. Genera automáticamente valores para variables faltantes
3. Configura GitHub Secrets automáticamente
4. Habilita GitHub Actions
5. Realiza un push para iniciar el primer deployment

**Salida esperada:**

```
════════════════════════════════════════════════════════════
AutomatizaWPP — Deployment Setup
════════════════════════════════════════════════════════════

✓ Configuración cargada
✓ GitHub CLI disponible
✓ Repositorio: tu-usuario/automatizawppBR

Configurando GitHub Secrets...
✓ Secrets configurados: 42
✓ GitHub Actions está habilitado
✓ Push realizado a main

PRÓXIMOS PASOS:
1. Ve a GitHub Actions: https://github.com/tu-usuario/automatizawppBR/actions
2. Monitorea el deployment (tardará ~20-30 minutos)
3. Una vez completado, accede a https://automatizawpp.com
```

---

## Monitoreo del Deployment

### Ver el progreso en GitHub Actions

```bash
# URL directa:
https://github.com/[tu-usuario]/automatizawppBR/actions

# O desde la CLI:
gh run list --repo [tu-usuario]/automatizawppBR --workflow deploy-do.yml
```

### Fases del Deployment

1. **Validate** (2-3 min): Valida que todos los secrets estén configurados
2. **Build** (5-10 min): Compila la imagen Docker
3. **Prepare Infrastructure** (10-15 min): Crea el droplet, firewall, IP flotante
4. **Deploy** (15-20 min): Copia código, configura SSL, inicia servicios
5. **Report** (1-2 min): Genera reporte final

**Tiempo total estimado: 20-30 minutos en el primer deployment**

### Ver logs en vivo

```bash
# Una vez que el deployment inicia, puedes ver los logs:
gh run view --repo [tu-usuario]/automatizawppBR [run-id] --log
```

### Verificar salud de la aplicación

```bash
# Una vez que el deployment se completa:
bash scripts/deploy-verify.sh
```

Este script verifica:
- Que todos los secrets estén en GitHub
- Estado del droplet en DigitalOcean
- Si la aplicación está respondiendo
- Estado del último deployment

---

## Configurar DNS (Si tienes un dominio)

Una vez que el droplet esté listo, necesitas apuntar tu dominio a la IP del droplet:

### 1. Obtén la IP del droplet

```bash
# Vía GitHub Actions logs o:
doctl auth init --access-token [DO_TOKEN]
doctl compute droplet list --format Name,PublicIPv4 --no-header
```

### 2. Configura tu DNS

En tu proveedor de dominio (Namecheap, GoDaddy, etc.):

```
A record:        automatizawpp.com → [Floating-IP-del-droplet]
CNAME record:    www.automatizawpp.com → automatizawpp.com
```

**Nota**: Los cambios de DNS pueden tardar 24-48 horas en propagarse.

### 3. Verifica que funciona

```bash
# Una vez que DNS está propagado:
curl https://automatizawpp.com/api/health

# Debería responder con:
# {"status":"ok","timestamp":"2026-04-30T..."}
```

---

## Solución de Problemas

### Error: "GitHub CLI not authenticated"

```bash
gh auth logout
gh auth login
# Selecciona GitHub.com, HTTPS, y autoriza en tu navegador
```

### Error: "Secrets not found"

Verifica que están en GitHub:
```bash
gh secret list --repo [tu-usuario]/automatizawppBR
```

Si faltan, ejecuta:
```bash
bash scripts/deploy-update-secrets.sh
```

### Deployment no inicia

1. Verifica que tienes créditos en DigitalOcean
2. Verifica que el workflow está en `.github/workflows/deploy-do.yml`
3. Haz un nuevo push:
   ```bash
   git add .
   git commit -m "Trigger deployment"
   git push origin main
   ```

### Droplet se crea pero la aplicación no responde

```bash
# SSH al droplet:
ssh root@[droplet-ip]

# Ver logs:
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs -f app

# Reiniciar servicios:
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml restart
```

### Errores de certificado SSL

Let's Encrypt obtiene certificados automáticamente. Si falla:

```bash
ssh root@[droplet-ip]
# Ver errores:
certbot logs

# Reintentar manualmente:
certbot certonly --standalone -d automatizawpp.com -d www.automatizawpp.com
```

---

## Operaciones Posteriores

### Actualizar secrets (ej: renovar API key)

```bash
bash scripts/deploy-update-secrets.sh

# Selecciona la opción 1 para actualizar un secret específico
```

### Redeployer la aplicación

```bash
# Simple: hacer un nuevo commit y push
git add .
git commit -m "Update application"
git push origin main

# GitHub Actions detectará el cambio y ejecutará el deployment automáticamente
```

### Ver logs de la aplicación en producción

```bash
ssh root@[droplet-ip]
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs -f app --tail 100
```

### Hacer backup de la base de datos

```bash
ssh root@[droplet-ip]
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml exec -T postgres pg_dump -U postgres sales_os > backup-$(date +%Y%m%d).sql
```

### Cambiar tamaño del droplet

```bash
# En DigitalOcean Console:
# 1. Ve a tu droplet
# 2. Settings > Resize
# 3. Selecciona nuevo tamaño
# 4. Confirma

# O vía doctl:
doctl auth init --access-token [DO_TOKEN]
doctl compute droplet-action resize [DROPLET-ID] --size s-4vcpu-8gb
```

---

## Notas de Seguridad

### Protege tus credenciales

- **NUNCA** comitees `.env.deploy` (está en `.gitignore`)
- **NUNCA** compartas tu `DO_TOKEN` o `ANTHROPIC_API_KEY`
- Usa un gestor de contraseñas: Bitwarden, 1Password, LastPass
- Rota tus keys de API periódicamente

### Monitoreo y alertas

Configura Slack webhooks para recibir notificaciones:

```bash
# 1. Ve a https://api.slack.com/apps
# 2. Create New App > From scratch
# 3. Incoming Webhooks > Add New Webhook to Workspace
# 4. Copia la URL
# 5. Ejecuta:
bash scripts/deploy-update-secrets.sh
# Opción 1 > SLACK_WEBHOOK_URL
```

### Backups automáticos

Habilita backups en DigitalOcean:

```bash
doctl auth init --access-token [DO_TOKEN]
doctl compute droplet-action enable-backups [DROPLET-ID]
```

---

## Referencias

- [DigitalOcean API Docs](https://docs.digitalocean.com/reference/api/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Reference](https://docs.docker.com/compose/reference/)
- [Anthropic Claude API](https://docs.anthropic.com/)

---

## Soporte

Si tienes problemas:

1. Verifica que todas las variables en `.env.deploy` estén correctas
2. Lee los logs en GitHub Actions
3. Ejecuta `bash scripts/deploy-verify.sh` para diagnósticos
4. SSH al droplet y verifica los logs de Docker

---

**Última actualización**: 2026-04-30
