# Plan — AutomatizaWPP

> Protocolo V.L.A.E.G. aplicado retroactivamente. Proyecto ya en producción, ahora se documenta y se gobierna.

## Estado actual (2026-05-02)

- App Next.js 15.5.15 desplegada en DigitalOcean (Droplet 568497325, IP 68.183.203.16)
- Dominio `automatizawpp.com` apuntando a DO (DNS recién migrado de Vercel)
- SSL Let's Encrypt activo (vence 2026-07-31)
- Login funcional con `admin@automatizawpp.com` / `Admin@2026!`
- Base de datos PostgreSQL en `165.227.175.193:5432/sales_os` (user `botflow`)

## Fases V.L.A.E.G. — Estado actualizado (2026-05-02)

- [x] **Fase 0** — Estructura `CLAUDE.md` (raíz) + `docs/` + `architecture/` + `core/` + `tools/` + `.tmp/` creadas
- [x] **Fase 1 — V** — 5 Preguntas respondidas formalmente por Eduardo (estado real del código documentado en CLAUDE.md §1-3)
- [x] **Fase 1 — V** — Schemas A (login), B (inbound), C (orchestrator), D (outbound) escritos en CLAUDE.md §3
- [x] **Fase 2 — L** — 8 scripts `tools/_check_*.ts` ejecutados. Resultados en `findings.md`:
  - ✅ Postgres, Resend, Bird, Anthropic
  - ❌ Redis (puerto cerrado), Zoho SMTP/IMAP (auth caducada)
  - ⏭ Brevo (sin key)
- [ ] **Fase 3 — A** — Refactor a A.N.T. de 3 capas: DEUDA NO URGENTE (deuda reconocida en CLAUDE.md §2)
- [x] **Fase 4 — E** — Login form aprobado por Eduardo
- [x] **Fase 5 — G** — Desplegado en producción + rollback documentado

## Sprint Plan — cerrar 7 gaps detectados (aprobado 2026-05-02)

### Sprint 1 — Gaps críticos 🔴 (idioma + QA)

**Objetivo:** Hacer que el flujo inbound→outbound respete las reglas absolutas del producto antes de exponerlo a más leads.

| # | Tarea | Archivos afectados | Verificación |
|---|---|---|---|
| 1.1 | Traducir TODOS los prompts a PT-BR (idioma default del producto) | `src/lib/agents/*-agent.ts` (closer, lead-response, qa, orchestrator) | grep prompts en inglés → 0 matches |
| 1.2 | Cada agente lee `lead.preferredLanguage` y switchea `es ↔ pt-BR` | `src/lib/agents/lead-response-agent.ts`, `closer-agent.ts`, `qa-agent.ts` | unit test: lead `es` recibe respuesta ES; lead `pt-BR` recibe PT-BR |
| 1.3 | Cablear `qa-agent.ts` antes de cada `provider.send()` outbound | `src/lib/agents/lead-response.ts`, providers en `src/lib/email/`, `src/lib/wa/` | curl simulando inbound → AgentRun.qaPassed registrado; si false, no envío |

### Sprint 2 — Gaps altos 🟠 (escalación + lista negra)

| # | Tarea | Archivos afectados | Verificación |
|---|---|---|---|
| 2.1 | `processInboundMessage()` maneja action=ESCALATE → trigger `notifyAdmin` + `Lead.escalated=true` | `src/app/api/events/inbound/route.ts`, `src/lib/agents/orchestrator.ts`, `src/lib/notifications/triggers.ts` | mensaje con keyword "abogado" → ESCALATE → admin recibe alerta |
| 2.2 | Detección de keywords críticas → `ESCALATE` automático | `src/lib/agents/orchestrator.ts` | lista en CLAUDE.md §3 ("Escalación obligatoria") |
| 2.3 | Añadir lista negra al `LEAD_RESPONSE_PROMPT` (no precios, no SLAs, no garantías, no competidores) | `src/lib/agents/prompts/lead-response-prompt.ts` (o donde viva) | test: pregunta de precio → respuesta evade sin dar número |

### Sprint 3 — Observabilidad 🟡 (notificaciones + auto-detect idioma)

| # | Tarea | Archivos afectados | Verificación |
|---|---|---|---|
| 3.1 | Cablear `triggerHighIntentLead`, `triggerEmailFailed`, `triggerLeadQualified` desde el inbound flow | `src/app/api/events/inbound/route.ts`, `src/lib/notifications/triggers.ts` | lead alta intención → admin notificado |
| 3.2 | Auto-detect idioma del mensaje entrante (Claude Haiku, prompt corto) cuando `lead.preferredLanguage` esté vacío | `src/lib/agents/language-detector.ts` (nuevo, atómico) | mensaje en PT → detecta `pt-BR`, mensaje en ES → detecta `es` |

## Bloqueador de fases (regla del protocolo)

> Cada Sprint debe pasar las verificaciones antes de avanzar al siguiente. Sprint 1 tiene 3 tareas que pueden hacerse en paralelo (4 agentes). Sprint 2 espera Sprint 1 (depende del prompt actualizado). Sprint 3 puede arrancar tras Sprint 1.

## Próximo paso aprobado

Lanzar 4 agentes en paralelo para Sprint 1:
- Agente A: Auditoría completa de prompts existentes (qué archivos, qué idioma actual). Sin modificar.
- Agente B: Tras auditoría → traducir prompts a PT-BR + soporte switch ES/PT-BR.
- Agente C: Cableado de qa-agent al pipeline outbound.
- Agente D: Tests de verificación del flow completo (curl + assertions sobre AgentRun).
