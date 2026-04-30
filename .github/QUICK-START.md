# 🚀 AutomatizaWPP Deployment — Quick Start (5 minutos)

Configuración rápida para desplegar automáticamente a DigitalOcean.

---

## 1. Obtener DigitalOcean Token

```bash
# Ve a https://cloud.digitalocean.com/account/api/tokens
# Click: "Generate New Token"
# Nombre: github-actions
# Scopes: Selecciona "read" y "write"
# Copia el token (aparece una sola vez)
```

---

## 2. Preparar SSH Key

```bash
# Opción A: Usar llave existente
cat ~/.ssh/id_rsa.pub

# Opción B: Crear nueva
ssh-keygen -t ed25519 -f ~/.ssh/do_deploy -N ""
cat ~/.ssh/do_deploy.pub
```

**Luego:** Ve a https://cloud.digitalocean.com/account/security/keys → "Add SSH Key" → Pega la llave pública

---

## 3. Agregar Secrets a GitHub

Ve a: **Settings → Secrets and variables → Actions → New repository secret**

Copia estos 7 secrets obligatorios:

```
DO_TOKEN = [Tu token de paso 1]
DO_DROPLET_NAME = sales-os-prod
DO_SSH_PRIVATE_KEY = [Contenido de ~/.ssh/do_deploy o ~/.ssh/id_rsa]
DATABASE_PASSWORD = [Contraseña fuerte, ej: $(openssl rand -base64 32)]
REDIS_PASSWORD = [Contraseña fuerte, ej: $(openssl rand -base64 32)]
ANTHROPIC_API_KEY = [Tu llave de https://console.anthropic.com/account/keys]
NEXTAUTH_SECRET = [Contraseña de 32+ caracteres, ej: $(openssl rand -base64 32)]
```

---

## 4. Hacer Push

```bash
git add .
git commit -m "Configure automatic deployment"
git push origin main
```

---

## 5. Monitorear Deployment

Ve a: **GitHub → Actions → Selecciona el workflow más reciente**

Espera ~20 minutos. Verás:
- ✅ Validación de secrets
- ✅ Compilación de Docker
- ✅ Creación de droplet en DigitalOcean
- ✅ Instalación de servicios
- ✅ Configuración de SSL
- ✅ Health checks

---

## ✅ ¡Listo!

Tu app estará disponible en:
```
https://automatizawpp.com
```

---

## ⚡ Operaciones Comunes

### Actualizar código
```bash
git push origin main
# Deployment automático en ~10 minutos
```

### Reiniciar aplicación
1. GitHub → Actions
2. "Deploy to DigitalOcean (Manual with Inputs)"
3. action: `restart`
4. Run workflow

### Conectar por SSH
```bash
# Obtén la IP del workflow log
ssh -i ~/.ssh/do_deploy root@[IP]

# Ver logs
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml logs -f app

# Reiniciar servicios
docker-compose -f /opt/automatizawppBR/docker-compose.prod.yml restart
```

---

## 📖 Documentación Completa

Lee `README-DEPLOYMENT.md` para:
- Setup detallado paso a paso
- Troubleshooting
- Referencia técnica
- Seguridad y best practices

---

## 🆘 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| Secrets not found | Verifica que agregaste todos en GitHub Settings |
| Cannot connect to Docker | `ssh root@[IP] && systemctl start docker` |
| Application not responding | Ver logs: `docker-compose logs app` |
| SSL certificate error | Verifica DNS apunta a la IP del droplet |
| Timeout en deployment | Aumenta `timeout-minutes` en el workflow |

---

## 📝 Notas

- **Droplet size:** Por defecto `s-2vcpu-4gb` (~$24/mes)
- **Región:** Por defecto `nyc3` (Nueva York)
- **SSL:** Automático con Let's Encrypt
- **Backups:** Habilita en DigitalOcean dashboard
- **Logs:** Disponibles en GitHub Actions + SSH

---

¿Preguntas? Lee `README-DEPLOYMENT.md` completo.
