# Resumen: Configuración de Deployment Automático

**Fecha**: 2026-04-30
**Proyecto**: AutomatizaWPP Sales OS
**Destino**: DigitalOcean (Docker Compose)
**CI/CD**: GitHub Actions (Workflow existente)

---

## Archivos Creados

### 1. Archivo de Configuración de Credenciales

**Ubicación**: `.env.deploy.example`

Este archivo es el TEMPLATE que contiene TODAS las credenciales necesarias con instrucciones detalladas de dónde obtener cada una.

**Contenido**:
- 8 secciones principales (GitHub, DigitalOcean, Database, AI, Email, App, Compliance, Monitoring)
- 50+ variables con documentación completa
- Instrucciones específicas para obtener cada credencial
- Valores por defecto donde aplica
- Indicación clara de qué es obligatorio vs opcional

**Uso**:
```bash
cp .env.deploy.example .env.deploy
nano .env.deploy  # Rellena tus valores
```

### 2. Script Principal de Setup (Idempotente)

**Ubicación**: `scripts/deploy-setup.sh`

Script principal que:
- Lee el archivo `.env.deploy`
- Valida que todas las variables obligatorias estén presentes
- Genera automáticamente valores para variables opcionales faltantes
- Configura GitHub Secrets automáticamente
- Habilita GitHub Actions
- Realiza un push para iniciar el primer deployment

**Características de idempotencia**:
- Si un secret ya existe, lo actualiza (no falla)
- Validación completa antes de actuar
- Puede ejecutarse múltiples veces sin efectos secundarios
- Genera automáticamente contraseñas seguras si están vacías

**Uso**:
```bash
bash scripts/deploy-setup.sh
```

### 3. Script de Verificación

**Ubicación**: `scripts/deploy-verify.sh`

Script que verifica el estado actual del deployment:
- Valida que todos los secrets estén en GitHub
- Verifica que GitHub Actions esté habilitado
- Muestra el estado del último deployment
- Verifica que el droplet de DigitalOcean sea accesible
- Intenta hacer health check de la aplicación

**Es completamente idempotente**: Solo verifica, no realiza cambios.

**Uso**:
```bash
bash scripts/deploy-verify.sh
```

### 4. Script de Actualización de Secrets

**Ubicación**: `scripts/deploy-update-secrets.sh`

Script interactivo que permite:
- Actualizar secrets individuales sin reejecutar todo el setup
- Sincronizar todos los secrets de `.env.deploy` con GitHub
- Ver secrets configurados en GitHub
- Eliminar secrets específicos
- Listar secrets disponibles

**Idempotente**: Actualiza valores sin causar problemas si se ejecuta múltiples veces.

**Uso**:
```bash
bash scripts/deploy-update-secrets.sh
```

### 5. Documentación Completa

**Ubicación**: `DEPLOYMENT.md`

Guía detallada (8 secciones) que cubre:
1. Requisitos previos (software, cuentas, herramientas)
2. Obtención de credenciales (paso a paso para cada servicio)
3. Configuración inicial (crear .env.deploy)
4. Ejecución del setup
5. Monitoreo del deployment
6. Configuración de DNS
7. Solución de problemas
8. Operaciones posteriores

**También incluye**:
- Comandos copy-paste listos para usar
- Troubleshooting común
- Notas de seguridad
- Referencias a documentación oficial

---

## Flujo de Uso

### Primer Deployment (Setup Inicial)

```
1. cp .env.deploy.example .env.deploy
   ↓
2. nano .env.deploy  (rellena credenciales)
   ↓
3. bash scripts/deploy-setup.sh
   ↓
4. GitHub Actions inicia automáticamente (20-30 minutos)
   ↓
5. bash scripts/deploy-verify.sh  (verificar estado)
   ↓
6. Aplicación disponible en APP_URL
```

### Actualizaciones Posteriores

```
1. Cambiar código → git push
   ↓
   GitHub Actions detecta → Redeploy automático

2. Actualizar credencial → bash scripts/deploy-update-secrets.sh
   ↓
   Secret se actualiza en GitHub

3. Verificar estado → bash scripts/deploy-verify.sh
```

---

## Variables Críticas

### Obligatorias (sin estas, no funciona)

```
DO_TOKEN                 # Token de DigitalOcean
ANTHROPIC_API_KEY        # API Key de Anthropic Claude
APP_DOMAIN              # Tu dominio (ej: automatizawpp.com)
APP_URL                 # URL completa (ej: https://automatizawpp.com)
```

### Generadas Automáticamente (si vacías)

```
DATABASE_PASSWORD       # Contraseña PostgreSQL (64 chars aleatorios)
REDIS_PASSWORD          # Contraseña Redis (64 chars aleatorios)
NEXTAUTH_SECRET         # Secret NextAuth (64 chars aleatorios)
```

### Opcionales

```
BIRD_API_KEY            # Si no usas Bird → dejar vacío
BREVO_API_KEY           # Si no usas Brevo → dejar vacío
SMTP_PASS               # Si no usas SMTP → dejar vacío
SLACK_WEBHOOK_URL       # Si no quieres alertas → dejar vacío
```

---

## Características de Idempotencia

Todos los scripts pueden ejecutarse múltiples veces sin problemas:

1. **GitHub Secrets**: Si un secret ya existe, se actualiza sin errores
2. **Validación**: Se hace antes de cualquier cambio
3. **Generación de valores**: Solo genera si está vacío
4. **Sin efectos secundarios**: No elimina ni cambia cosas innecesariamente
5. **Recuperable**: Si algo falla, puedes reintentar

### Ejemplos de Idempotencia

```bash
# Ejecutar múltiples veces — sin problemas
bash scripts/deploy-setup.sh
bash scripts/deploy-setup.sh
bash scripts/deploy-setup.sh

# Actualizar un secret específico — sin afectar a otros
bash scripts/deploy-update-secrets.sh
# (selecciona opción 1, actualiza DO_TOKEN)

bash scripts/deploy-update-secrets.sh
# (selecciona opción 1, actualiza ANTHROPIC_API_KEY)

# Verificar estado — nunca realiza cambios
bash scripts/deploy-verify.sh
bash scripts/deploy-verify.sh
bash scripts/deploy-verify.sh
```

---

## Infraestructura Automática

El script crea/usa automáticamente en DigitalOcean:

- **Droplet**: VM Ubuntu 24.04 (s-2vcpu-4gb recomendado)
- **Firewall**: Puertos abiertos (22, 80, 443, 3000)
- **Floating IP**: IP estática reasignada automáticamente
- **SSL/TLS**: Let's Encrypt (renovación automática)
- **Database**: PostgreSQL 16 (en Docker)
- **Cache**: Redis 7 (en Docker)
- **Reverse Proxy**: Nginx (en Docker)

---

## GitHub Actions Workflow

El workflow `.github/workflows/deploy-do.yml` hace:

1. **Validate**: Verifica que todos los secrets estén presentes
2. **Build**: Compila imagen Docker (ghcr.io)
3. **Prepare Infrastructure**: Crea/configura droplet, firewall, IP
4. **Deploy**: Copia código, configura SSL, inicia servicios
5. **Initialize Database**: Corre migraciones Prisma
6. **Health Check**: Verifica que la app responda
7. **Report**: Genera reporte final

**Tiempo**: ~20-30 minutos en primer deployment, ~5-10 minutos en redeploys

---

## Seguridad

### Lo que NO está expuesto

- Credenciales reales nunca están en Git (`.env.deploy` está en `.gitignore`)
- SSH keys privadas solo se usan dentro de GitHub Actions
- Secrets se almacenan encriptados en GitHub

### Lo que SÍ está documentado

- Dónde obtener cada credencial (URLs directas)
- Cómo generar contraseñas seguras
- Mejor prácticas (ej: app passwords en Gmail)
- Notas sobre rotación de keys

---

## Próximos Pasos (Después del Setup)

1. **DNS**: Apunta tu dominio al droplet (A record)
2. **Webhooks**: Configura en Bird, Brevo, n8n con tu dominio
3. **Monitoreo**: Habilita Slack webhooks para alertas
4. **Backups**: Habilita backups automáticos en DigitalOcean
5. **Certificados**: Let's Encrypt se renueva automáticamente

---

## Troubleshooting Rápido

```bash
# Si algo no funciona:
bash scripts/deploy-verify.sh

# Ver logs del último deployment:
gh run list --repo [tu-usuario]/automatizawppBR --workflow deploy-do.yml

# SSH al droplet y revisar:
ssh root@[droplet-ip]
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs -f app

# Actualizar un secret:
bash scripts/deploy-update-secrets.sh
```

---

## Resumen Técnico

| Aspecto | Detalle |
|--------|--------|
| **Orquestación** | GitHub Actions (nativo) |
| **Infraestructura** | DigitalOcean (Droplet) |
| **Contenedores** | Docker Compose (5 servicios) |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Web Server** | Nginx + Reverse Proxy |
| **App** | Node.js 20 + Next.js |
| **SSL** | Let's Encrypt (automático) |
| **Credenciales** | GitHub Secrets (encriptados) |
| **Configuración** | Variables de entorno |
| **Idempotencia** | Todos los scripts son idempotentes |

---

**Versión**: 1.0
**Última actualización**: 2026-04-30
**Estado**: Listo para producción
