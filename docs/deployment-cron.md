# Configuración Cron para Follow-ups — Production

**Objetivo**: Ejecutar `POST /api/followups/run` cada 5 minutos en DigitalOcean

---

## Opción 1: Cron Job en Droplet (Recomendado)

SSH a DigitalOcean Droplet (IP: `68.183.203.16`):

```bash
ssh root@68.183.203.16
```

Crear archivo cron script:

```bash
cat > /opt/automatizawpp/cron-followups.sh << 'EOF'
#!/bin/bash
# Ejecutar follow-ups cada 5 minutos
# Usar API token para autenticación si es necesario

curl -X POST http://localhost:3000/api/followups/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -s -o /dev/null -w "%{http_code}\n"
EOF

chmod +x /opt/automatizawpp/cron-followups.sh
```

Agregar a crontab:

```bash
crontab -e

# Agregar esta línea:
*/5 * * * * /opt/automatizawpp/cron-followups.sh >> /var/log/followups-cron.log 2>&1
```

Verificar:

```bash
crontab -l
```

---

## Opción 2: n8n Webhook (Si n8n está disponible)

1. En n8n, crear workflow:
   - **Trigger**: Cron (cada 5 min)
   - **Action**: HTTP Request → POST `https://automatizawpp.com/api/followups/run`

2. Configurar headers:
   ```
   Authorization: Bearer ${API_TOKEN}
   Content-Type: application/json
   ```

3. Activar workflow

---

## Opción 3: PM2 Cron (Inside Node App)

En `src/lib/schedules/followup-cron.ts`:

```typescript
import cron from 'node-cron';
import { runFollowUps } from '@/lib/followup/runner';

export function startFollowUpCron() {
  // Ejecutar cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    console.log('[CRON] Ejecutando follow-ups...');
    try {
      const result = await runFollowUps();
      console.log('[CRON] Resultado:', result);
    } catch (error) {
      console.error('[CRON] Error:', error);
    }
  });
}
```

En `src/app/api/system/cron/route.ts`:

```typescript
import { startFollowUpCron } from '@/lib/schedules/followup-cron';

export async function GET() {
  startFollowUpCron();
  return Response.json({ success: true, message: 'Cron iniciado' });
}
```

Llamar una sola vez al iniciar:
```bash
curl http://automatizawpp.com/api/system/cron
```

---

## Logs y Monitoreo

Ver logs cron:

```bash
# En droplet
tail -f /var/log/followups-cron.log

# O en PM2
pm2 logs automatizawpp | grep "Follow-up"
```

---

## Próximos Pasos

- [ ] Elegir Opción 1, 2, o 3
- [ ] Implementar cron job
- [ ] Verificar que `/api/followups/run` retorna 200
- [ ] Monitorear logs durante 1 hora
- [ ] Documentar en Obsidian

---

**Responsable**: Eduardo / Claude  
**Urgencia**: Alta (sigue siendo la última pieza para completar el pipeline)
