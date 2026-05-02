# Findings — AutomatizaWPP

**Última actualización**: 2026-05-02

---

## Descubrimientos de Integración

### Bird Email API
- **Endpoint**: `https://api.bird.com/v1/send-email`
- **Auth**: Bearer token en header `Authorization`
- **Rate limit**: 100 req/min (10,000/day)
- **Headers obligatorios**: `Content-Type: application/json`
- **Response**: JSON con `message_id` si éxito
- **Error handling**: Retry exponential backoff (max 3 intentos)

### PostgreSQL + Prisma
- **DB**: `automatizawpp_db` en DigitalOcean
- **Prisma version**: ^5.0
- **Migrations**: Ubicadas en `prisma/migrations/`
- **Connection**: Via `.env.DATABASE_URL`
- **Constraint**: Foreign keys ON DELETE CASCADE en `FollowUpTask`

### n8n Workflows
- **Ubicación**: Importar desde `workflows/`
- **Webhooks**: Usar `WEBHOOK_DOMAIN` en .env (actual: `automatizawpp.com`)
- **Auth**: Bearer token en headers (configurar en n8n UI)
- **Status**: 2 workflows listos, requieren configuración de webhooks

### Anthropic SDK
- **Modelo**: Claude 3.5 Sonnet (via `claude-3-5-sonnet-20241022`)
- **API Key**: Via `.env.ANTHROPIC_API_KEY`
- **Rate limit**: 40K tokens/min
- **Tool calling**: Soportado nativamente

---

## Restricciones y Límites

### Database
- Max connections: 5 (limitado en plan DigitalOcean)
- Timeout connection: 10s
- Max batch size: 1000 records

### API Gateway
- Rate limit global: 5 req/s por IP
- Timeout endpoint: 30s
- Max payload: 1MB

### Agentes IA
- Max tokens input: 200K
- Max tokens output: 4K
- Temperature: Fixed at 0.7 (determinístico)

---

## Arquitectura Observaciones

### Agents Topology
```
POST /api/events/inbound
    ↓
Orchestrator Agent
    ├─→ Qualification Agent (score temperature)
    ├─→ Response Agent (generar respuesta)
    └─→ Router (enviar via Bird)
    
Cron /api/followups/run
    ↓
Runner Agent
    ├─→ FollowUp Agent (generar follow-up)
    └─→ Router (enviar via Bird)
    
Escalation Flow:
    ├─→ Closer Agent (si temperature > 0.9)
    ├─→ Objection Handler (si lead tiene objeción)
    └─→ Sales QA Agent (si presupuesto solicitado)
```

### Database Relationships
```
Lead (1) ←─→ (N) Response
Lead (1) ←─→ (N) FollowUpTask
Lead (1) ←─→ (N) ActivityLog
FollowUpTask (1) ←─→ (N) ActivityLog
```

---

## Issues Resueltos

### Problema: Migrations faltando
- **Causa**: Schema Prisma completo pero migrations/ no commiteada
- **Solución**: Ejecutar `prisma migrate deploy` para restaurar histórico

### Problema: scheduler.ts y runner.ts no existen
- **Causa**: Fueron planeados pero no implementados
- **Solución**: Implementar ahora siguiendo patrón A.N.T.

### Problema: n8n workflows requieren configuración
- **Causa**: No se configuraron webhooks
- **Solución**: Usar dominio `automatizawpp.com` en n8n UI

---

## Próximos Pasos de Investigación

- [ ] Verificar que rate limits de Bird no se alcanzan en load test
- [ ] Confirmar que PostgreSQL está totalmente sincronizada en production
- [ ] Testear escalabilidad con 1000+ leads/día

---

## Notas Técnicas

- **Lenguaje BD**: Portuguese (Brasil) - respetar en queries
- **Timezone**: UTC-3 (São Paulo) en scheduled tasks
- **Codificación**: UTF-8 en todos los archivos
- **Git hooks**: Pre-commit limpia tmp/ antes de commit
