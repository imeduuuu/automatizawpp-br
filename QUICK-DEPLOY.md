# Quick Start — Deploy en 5 Minutos

**Tiempo de preparación**: 5 minutos (obteniendo credenciales)
**Tiempo de deployment**: 20-30 minutos (automático)
**Resultado**: Aplicación en vivo en `https://tu-dominio.com`

---

## Checklist Rápido

### Paso 1: Obtén tus credenciales (5 minutos)

```bash
# DO_TOKEN: https://cloud.digitalocean.com/account/api/tokens
# → Generate New Token → github-actions → read+write → Copia

# ANTHROPIC_API_KEY: https://console.anthropic.com/account/keys
# → Create Key → Copia

# APP_DOMAIN: Tu dominio (automatizawpp.com)

# APP_URL: https://[APP_DOMAIN]
```

### Paso 2: Crea tu archivo de config

```bash
cp .env.deploy.example .env.deploy
nano .env.deploy

# Rellena:
# DO_TOKEN=[pega-aqui]
# ANTHROPIC_API_KEY=[pega-aqui]
# APP_DOMAIN=tu-dominio.com
# APP_URL=https://tu-dominio.com
```

### Paso 3: Ejecuta el setup

```bash
bash scripts/deploy-setup.sh
```

### Paso 4: Monitorea

```bash
# Ve a GitHub Actions en tu navegador:
# https://github.com/[tu-usuario]/automatizawppBR/actions

# O en CLI:
bash scripts/deploy-verify.sh
```

### Paso 5: Configura DNS (Opcional)

Si tienes un dominio personalizado:
```
Tu proveedor DNS → A record → automatizawpp.com → [IP del droplet]
```

---

## ¿Dónde Obtener Qué?

| Credencial | URL | Tiempo |
|-----------|-----|--------|
| `DO_TOKEN` | https://cloud.digitalocean.com/account/api/tokens | 1 min |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/account/keys | 1 min |
| `BREVO_API_KEY` | https://app.brevo.com/settings/account/api | 2 min |
| `BIRD_API_KEY` | https://app.bird.com/account/settings | 2 min |
| `SSH Key` | ~/.ssh/id_ed25519.pub | ya existe |

---

## Lo Mínimo para Empezar

```bash
# Estos 3 valores son OBLIGATORIOS:
DO_TOKEN=...
ANTHROPIC_API_KEY=...
APP_DOMAIN=...

# El resto se puede completar después o dejar en blanco
```

---

## Después de 30 Minutos

```bash
# Verifica que todo está listo
bash scripts/deploy-verify.sh

# Debería decir:
# ✓ Secrets configurados
# ✓ Droplet activo
# ✓ Aplicación es sana
```

---

## Si Algo Falla

```bash
# Ver qué pasó:
gh run list --repo [tu-usuario]/automatizawppBR

# Ver logs completos:
gh run view [run-id] --log

# Reintentar setup:
bash scripts/deploy-setup.sh
```

---

## URLs Importantes

```
GitHub Actions:  https://github.com/[tu-usuario]/automatizawppBR/actions
GitHub Secrets:  https://github.com/[tu-usuario]/automatizawppBR/settings/secrets
DigitalOcean:    https://cloud.digitalocean.com/droplets
Tu Aplicación:   https://[APP_DOMAIN]
```

---

## Videos Útiles

Si necesitas ayuda visual:
- Crear DO token: https://docs.digitalocean.com/reference/api/
- GitHub Actions: https://docs.github.com/en/actions
- Anthropic API: https://docs.anthropic.com/

---

## Próximo Paso

```bash
# Una vez que todo esté listo, lee:
cat DEPLOYMENT.md

# Para operaciones avanzadas:
bash scripts/deploy-update-secrets.sh
```

---

**¡Eso es todo!** 🚀

El deployment se hace automáticamente. Solo siéntate, relaja y espera a que GitHub Actions termine su magia.
