# Plan — AutomatizaWPP Sales OS

**Fecha**: 2026-05-02  
**Estado**: Completando Fase 3 (Arquitectura)  
**Next**: Fase 4 (Estilo) → Fase 5 (Gatillo/Deploy)

---

## Checklist Maestro V.L.A.E.G.

### FASE 0 — Inicialización ✅
- [x] Estructura de carpetas creada (docs/, tools/, tmp/)
- [x] plan.md, findings.md, progress.md, constitution.md
- [x] .env configurado con credenciales
- [x] .gitignore actualizado

### FASE 1 — Visión ✅
- [x] 5 Preguntas de Descubrimiento respondidas
- [x] JSON Schemas (input/output) en constitution.md
- [x] Blueprint aprobado por usuario

### FASE 2 — Link ✅
- [x] Bird Email API testeada
- [x] PostgreSQL conectada
- [x] n8n workflows importados
- [x] Rate limits documentados

### FASE 3 — Arquitectura 🔄 (EN PROGRESO)

**Capa 1 — Agente (`agent/`)**
- [x] Orchestrator agent exists
- [x] Lead Response agent exists  
- [x] Qualification agent exists
- [x] Closer agent exists
- [x] Objection Handler agent exists

**Capa 2 — Núcleo (`core/`)**
- [x] Schema Prisma completo
- [x] Qualification logic
- [x] Activity logging
- [ ] **scheduler.ts** — FALTA (crear FollowUpTask)
- [ ] **runner.ts** — FALTA (ejecutar tarefas vencidas)

**Capa 3 — Tools (`tools/`)**
- [ ] `_check_bird.py` — Verificar Bird API
- [ ] `_check_db.py` — Verificar PostgreSQL
- [ ] Email sender tool (atómico)
- [ ] Followup runner tool (atómico)

### FASE 4 — Estilo (PRÓXIMA)
- [ ] Payload dashboard formateado
- [ ] Email templates profesionales
- [ ] Aprobación usuario en salida final

### FASE 5 — Gatillo (FINAL)
- [ ] Migrations restauradas (`prisma migrate deploy`)
- [ ] Scheduler/runner desplegados en producción
- [ ] n8n workflows activos
- [ ] Monitoreo en progress.md

---

## Tareas Inmediatas (Hoy)

### 1. Restaurar Migrations (10 min)
```bash
cd /Users/eduardosilva/Antigravity/automatizawppBR
npx prisma migrate deploy
```

### 2. Implementar `scheduler.ts` (40 min)
Archivo: `src/lib/followup/scheduler.ts`

```typescript
export async function scheduleFollowUp(
  leadId: string,
  temperature: number,
  lastAttempt: Date
) {
  // Lógica:
  // - temperature > 0.7 → delay +2 horas
  // - 0.5 < temperature <= 0.7 → delay +1 día
  // - temperature <= 0.5 → delay +3 días
  // - Máximo 3 intentos
  
  const delay = calculateDelay(temperature);
  const scheduledFor = new Date(Date.now() + delay);
  
  return await prisma.followUpTask.create({
    data: {
      leadId,
      scheduledFor,
      type: 'email',
      status: 'pending',
      attempts: 0
    }
  });
}
```

### 3. Implementar `runner.ts` (40 min)
Archivo: `src/lib/followup/runner.ts`

```typescript
export async function runFollowUps() {
  // Lógica:
  // - Buscar tarefas vencidas (scheduledFor <= now)
  // - Para cada tarea: invocar FollowUpAgent
  // - Enviar via routeMessage()
  // - Actualizar intentos
  // - Escalar si máximo alcanzado
  
  const tasks = await prisma.followUpTask.findMany({
    where: {
      status: 'pending',
      scheduledFor: { lte: new Date() }
    }
  });
  
  for (const task of tasks) {
    await executeFollowUp(task);
  }
}
```

### 4. Actualizar `/api/followups/run` (10 min)
Archivo: `src/app/api/followups/run/route.ts`

```typescript
export async function POST(req: Request) {
  // Llamar a runner.runFollowUps()
  const result = await runFollowUps();
  return Response.json(result);
}
```

### 5. Test E2E (20 min)
- POST /api/events/inbound (lead dummy)
- Verificar que se creó Lead + Response
- Esperar scheduler
- POST /api/followups/run
- Verificar que se ejecutó follow-up

---

## Timeline Total

| Tarea | Tiempo |
|---|---|
| Restaurar migrations | 10 min |
| scheduler.ts | 40 min |
| runner.ts | 40 min |
| Actualizar /api/followups/run | 10 min |
| Test E2E | 20 min |
| **TOTAL** | **~2 horas** |

**Objetivo**: Después de esto, pipeline completo end-to-end funcional.

---

## Criterios de Éxito

- [x] Fase 1 (Visión) → Schemas definidos
- [x] Fase 2 (Link) → Conexiones testeadas
- [ ] Fase 3 (Arquitectura) → Código completo
- [ ] Fase 4 (Estilo) → Payloads formateados
- [ ] Fase 5 (Gatillo) → En producción (DigitalOcean)

---

**Próximo paso**: Ejecutar tareas inmediatas en orden.
