# Progress — AutomatizaWPP

> Bitácora de qué se hizo, errores encontrados, tests, resultados. Append-only.

---

## 2026-05-03 — Sesión: Limpieza backlog (5 deudas cerradas)

### Hallazgo crítico durante deuda #1
La migration original `add_notifications_schema` falló silenciosamente en producción (error `42710 type "NotificationTemplate" already exists`) y quedó marcada como `applied` sin DDL ejecutado. **Tablas `Notification`, `NotificationPreference`, `NotificationTemplateConfig` NO existían en DB de producción.** Por eso el guard del Sprint 3.1 era necesario.

### Deuda #1 — `model Notification` declarado + guard removido
- 3 tablas creadas en DB: `Notification` (22 cols), `NotificationPreference` (15 cols), `NotificationTemplateConfig` (12 cols).
- 4 enums creados: `NotificationChannel`, `NotificationPriority`, `NotificationStatus`, `NotificationTemplate`.
- Schema.prisma: ~120 líneas añadidas (3 models + 4 enums + 6 relaciones inversas en Workspace/User/Lead).
- Migration `20260503153654_lead_lang_optional_and_notifications_sync` aplicada (idempotente con `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$`).
- `service.ts`: guard `canPersist` eliminado. `prisma.notification.create` ahora persiste real.

### Deuda #2 — `Lead.preferredLanguage` ahora `String?` (sin default)
- Schema: `String @default("es")` → `String?`.
- DB: `ALTER TABLE "Lead" ALTER COLUMN "preferredLanguage" DROP DEFAULT; DROP NOT NULL;`.
- `route.ts`: flag `isNewLead` eliminado. Ahora simplemente `if (!lead.preferredLanguage) { auto-detect; persist }`.

### Deuda #4 — `detectObjectionType` solo PT-BR + ES
- Mapa `OBJECTION_KEYWORDS: Record<Language, ...>` con 5 categorías × 2 idiomas (PT-BR + ES). Keywords EN eliminadas.
- Firma: `detectObjectionType(text, lang?)`. Evalúa idioma del lead primero, otro como fallback (mensajes mixtos).
- Categorías técnicas (PRICE/TIMING/SEND_INFO/NEED_TO_THINK/NOT_INTERESTED/OTHER) en EN porque son enum interno, no UI.

### Deuda #5 — `normalizePayload()` aplicado a 5 agentes
| Agente | Cadena de candidatos para `payload.message` |
|---|---|
| `lead-response-agent` | `message → response → text → fallback` |
| `qualification-agent` | `message → nextQuestion → response → fallback` |
| `closer-agent` | `message → cta → ctaMessage → response → fallback` |
| `followup-agent` | `message → response → text → fallback` |
| `writer-agent` | `message → finalMessage → text → fallback` |

Aliases originales preservados en payload junto al `message` normalizado. `memory-agent` y `call-agent` documentados como "no aplicable" (no generan respuesta al lead).

### Deuda #6 — Summaries traducidos a PT-BR
8 strings traducidos:
- "Inbound lead response generated." → "Resposta ao lead inbound gerada."
- "Qualification assessment completed." → "Avaliação de qualificação concluída."
- "Objection analyzed and response drafted." → "Objeção analisada e resposta preparada."
- "Closer message and CTA produced." → "Mensagem de fechamento e CTA gerados."
- "Follow-up task recommendation generated." → "Recomendação de tarefa de follow-up gerada."
- "Message polished for channel consistency." → "Mensagem polida para consistência de canal."
- "Memory snapshot refreshed." → "Snapshot de memória atualizado."
- "Call workflow package created." → "Pacote de fluxo de chamada criado."

### Deuda #3 — baseline `0_init` vacía (NO arreglada, workaround documentado)
Sigue requiriendo `db execute` + `migrate resolve --applied` para futuras migrations. Reescribir baseline es invasivo y arriesga la aplicación productiva. Aceptado como deuda no urgente.

### Verificación E2E (BUILD `kHmUTNKOjT6TOFj9gYG6z`)
4/4 tests passed:
- **#1 Notification persiste:** count 0 → 2 tras un POST inbound. Filas `LEAD_CREATED / EMAIL / SENT` y `LEAD_CREATED / IN_APP / FAILED` (FAILED por falta config slack/in-app, esperado).
- **#2 Auto-detect con NULL:** INSERT manual con `preferredLanguage=NULL` exitoso (antes fallaba). Tras POST con mensaje PT-BR, lead actualizado a `preferredLanguage='pt-BR'`.
- **#3 HANDLE_OBJECTION normalizePayload:** AgentRun.outputPayload.draft con texto PT-BR completo ("Entendo sua preocupação com o investimento...").
- **#4 Summaries PT-BR:** búsqueda de strings EN residuales (`generated`, `completed`, etc.) → 0 rows. memorySummary, language y otros campos en PT-BR confirmados.

### Estado final del Sprint 3 + Limpieza
```
✅ Sprint 3.1 - Notification triggers cableados + guard removido
✅ Sprint 3.2 - language-detector.ts (función)
✅ Sprint 3.3 - ObjectionHandler normalizePayload
✅ Sprint 3.4 - detectLanguage cableado en route.ts
✅ Limpieza #1 - model Notification declarado
✅ Limpieza #2 - Lead.preferredLanguage opcional
✅ Limpieza #4 - detectObjectionType solo PT-BR/ES
✅ Limpieza #5 - normalizePayload en 5 agentes
✅ Limpieza #6 - 8 summaries traducidos
⚠️ Limpieza #3 - baseline 0_init queda como workaround
```

---

## 2026-05-03 — Sesión: Sprint 3 V.L.A.E.G. (observabilidad + bugs descubiertos)

### Sprint 3.1 — Notification triggers cableados
**Bug `notification.create undefined`** descubierto: `service.ts` usa `prisma.notification.X` (lowercase, correcto por convención) pero el modelo `Notification` está SOLO en migration SQL (`add_notifications_schema/migration.sql`), no en `prisma/schema.prisma`. Cliente Prisma no expone delegate.
- Fix temporal: guard defensivo en `service.ts` (`canPersist` check). Logs `[NOTIFICATION WARN] prisma.notification delegate ausente` en lugar de errores. Triggers no rompen el flow.
- Deuda: declarar `model Notification` + `NotificationPreference` + `NotificationTemplateConfig` en `schema.prisma` + `prisma generate`. Requiere autorización humana.

**4 triggers cableados** en `src/app/api/events/inbound/route.ts`:
| Trigger | Cuándo | Línea |
|---|---|---|
| `triggerLeadCreated` | tras `prisma.lead.create` | 130 |
| `triggerHighIntentLead` | si `score>=70 && intentLevel=HIGH && action ∈ {RESPOND,QUALIFY}` | 187 |
| `triggerEmailFailed` | si `delivery.sent=false && delivery.error` | 485 |
| `triggerSystemError` | catch global del endpoint, antes del 500 | 569 |

Cada uno con try/catch. Verificación E2E: triggers se invocan, logs muestran WARN del guard pero sin tirar el flow.

### Sprint 3.2 (parcial) — Language detector creado, NO cableado
- ✅ `src/lib/agents/language-detector.ts` creado: `detectLanguage(text)` async + `detectLanguageHeuristic(text)` sync. Usa heurística (markers PT-BR vs ES) → si decisiva retorna; si ambigua llama Claude Haiku con timeout 5s + fallback `'es'`.
- ✅ Smoke test passed: PT-BR ✓, ES ✓, ambiguity → null (que fallback hace LLM call), empty → null.
- ❌ **NO cableado en `route.ts`**: el endpoint sigue usando `lead.preferredLanguage ?? 'es'` sin invocar `detectLanguage` cuando es null.
- Deuda Sprint 3.4 (mini): cablear caller (~10 líneas).

### Sprint 3.3 — ObjectionHandler `payload.message=""` arreglado
**Diagnóstico:** prompt `objection` (PT-BR/ES) en `prompts.ts:167-192` instruye al LLM a devolver `{type, reframedResponse, buyingSignalDetected}`. Fallback hardcoded del agente devolvía `{objectionType, response, followUpQuestion}`. `route.ts` esperaba `payload.message` → recibía `undefined` → string vacío → QA bloqueaba.

**Fix:** `normalizePayload()` en `objection-agent.ts` mapea con cascada `message ← reframedResponse | response | text | fallback bilingüe`. Fallback PT-BR/ES con texto útil ("Entendo sua preocupação..." / "Entiendo tu preocupación...").

**Verificación E2E (BUILD `E-zeNOrTIQPC3UyuoR2dV`):**
- Test lead `lead-veg3-obj-1777814108` con mensaje "muito caro pra mim".
- Action=`HANDLE_OBJECTION`, AgentRun OBJECTION_HANDLER status=`CANCELLED`.
- `outputPayload.draft` contiene texto PT-BR completo (~280 chars): "Entendo sua preocupação com o investimento. Muitos clientes como você tiveram a mesma dúvida inicialmente. Posso mostrar o ROI em 60 dias..."
- QA bloqueó por mencionar "ROI em 60 dias" (promesa de resultado, lista negra Sprint 2.3) — comportamiento DESEADO. Bug del draft vacío resuelto.

### Verificación triggers E2E
- `triggerLeadCreated`: invocado tras `prisma.lead.create`. Log WARN del guard visible.
- `triggerHighIntentLead`: lead con score=80 + intentLevel=HIGH disparó el trigger. Log visible.
- `triggerEmailFailed` y `triggerSystemError`: cableados pero no provocados en estos tests (necesitarían fallo intencionado).

### Sprint 3.4 — Cableado `detectLanguage` en route.ts
- Import `detectLanguage` + `detectLanguageHeuristic` en `route.ts` línea 15.
- Flag `isNewLead` añadido (línea 116) — necesario porque `Lead.preferredLanguage String @default("es")` impide null en `prisma.lead.create`.
- Bloque auto-detect (líneas 150-172) tras find-or-create + ANTES del orchestrator: heurística sync → si null, LLM async → `prisma.lead.update({preferredLanguage})` + actualiza copia local.
- Try/catch para no romper flow si detector falla.

**Verificación E2E (BUILD `LBYZWNoZDb3vOoXgLVVyX`):**
- Lead nuevo creado por endpoint con mensaje PT-BR ("Olá, gostaria de saber mais...").
- HTTP 200, `delivery.sent=true`, `qaPassed=true`.
- Lead `cmopt2dy60001l0d7fvr38c9u` → `preferredLanguage='pt-BR'` en DB (cacheado).
- Agente respondió en PT-BR coherente.

### Estado del Sprint 3 (cerrado al 100%)
- 3.1 ✅ cerrado E2E (notifications cableadas + bug `notification.create` silenciado por guard)
- 3.2 ✅ función `detectLanguage` + `detectLanguageHeuristic` creadas
- 3.3 ✅ cerrado E2E (ObjectionHandler `payload.message` normalizado)
- 3.4 ✅ cerrado E2E (`detectLanguage` cableado en route.ts + caché en DB)

---

## 2026-05-03 — Sesión: Sprint 2.4 V.L.A.E.G. cerrado (6 deudas Sprint 2)

### Cambios aplicados (4 agentes paralelos/secuenciales)

**Schema + notifications:**
- Migration `20260503125259_add_lead_escalation`: `Lead.escalated:Boolean @default(false)`, `Lead.escalatedAt:DateTime?`. Aplicada en producción vía `db execute` + `migrate resolve --applied` (workaround porque `0_init` está vacía).
- `triggerEscalation(event)` añadido a `notifications/triggers.ts` con firma `{leadId, workspaceId, reason, fullName?, ownerUserId?, recipientEmail?}`.
- Regla `lead-escalated` en `alert-rules.ts` con `priority:URGENT`, `channels:[IN_APP, EMAIL]`.
- Template `LEAD_ESCALATED` en `templates.ts` (variantes email/whatsapp/inApp/slack en PT-BR).

**Orchestrator:**
- `detectEscalationKeywords(text, leadLanguage)` reescrito con regex word-boundary `\b...\b /iu`.
- Keywords reagrupadas: 13 PTBR_ONLY + 15 ES_ONLY + 3 COMMON (supervisor, fraude, ridículo).
- Tiebreaker para keywords COMMON: usa `leadLanguage` en lugar de PTBR-first.
- `checkCompliance(lead, workspaceTimezone?)` ahora usa `Intl.DateTimeFormat` con TZ del workspace. Fallback UTC con warning si TZ ausente o inválida.
- `runOrchestratorAgent` hace `include: { workspace: { select: { timezone: true } } }` en Prisma query.

**route.ts:**
- Branch `ESCALATE` actualizado a `lead.update({escalated:true, escalatedAt:new Date()})` + `triggerEscalation(...)` (no más `nextAction='ESCALATED'` workaround).
- Nuevos branches `HANDLE_OBJECTION`, `CLOSE`, `FOLLOW_UP` con mismo flow que RESPOND: agente → draft → QA → routeMessage → AgentRun close. Helper local `runDraftAgent(action, context)` evita duplicación.

### Verificación E2E (BUILD `sYPD3EWCBk2RZXio2F7Y1`)
4/4 tests passed:
- ESCALATE PT-BR ("advogado") → `Lead.escalated=true`, `escalatedAt` poblado, `notifiedAdmin:true`, AgentRun ORCHESTRATOR COMPLETED.
- ESCALATE ES ("supervisor") → `outputPayload.reason: "...idioma=es"` (bug Sprint 2 RESUELTO).
- HANDLE_OBJECTION → orchestrator detectó objeción, AgentRun OBJECTION_HANDLER COMPLETED (draft vacío = deuda del agente, no del cableado).
- Quiet hours timezone-aware → Madrid 15:04 → action≠HOLD, coherente con TZ local.

### Deuda nueva detectada en Sprint 2.4-D (Sprint 3 candidato)
1. `[NOTIFICATION ERROR] notification.create undefined` en logs PM2 — modelo Prisma probablemente es `Notification` (capitalizado), código usa `notification` lowercase.
2. `ObjectionHandlingAgent` retornó `payload.message=""` en producción — investigar si fallback EN sigue activo o si la API Anthropic falla silenciosa.
3. Baseline `0_init` de Prisma migrations está vacía → `prisma migrate dev` falla. Workaround temporal: `db execute` + `migrate resolve --applied`.

---

## 2026-05-03 — Sesión: Sprint 2 V.L.A.E.G. cerrado E2E (gaps 🟠 altos)

### Sprint 2.1 — Branch ESCALATE en route.ts
Antes: solo RESPOND/QUALIFY/HOLD manejados. ESCALATE caía a default (silencio).
Ahora: cuando `decision.action === 'ESCALATE'`, route.ts:
- Marca `Lead.nextAction='ESCALATED'` + `nextActionAt=NOW()` (workaround porque schema no tiene `escalated:Boolean`).
- Dispara notificación admin via `triggerLeadCreated` (workaround porque no existe `triggerEscalation`).
- Cierra `AgentRun(agent:'ORCHESTRATOR', status:COMPLETED, outputPayload.escalated:true)`.
- NO invoca lead-response, qa-agent, ni routeMessage.
- Retorna HTTP 200 con `{success, action:'ESCALATE', escalated:true, agentRunId, notifiedAdmin}`.

### Sprint 2.2 — Detección keywords críticas en orchestrator
`detectEscalationKeywords(text)` añadido a `runOrchestratorAgent` y `OrchestratorAgent.run`. Se ejecuta DESPUÉS del compliance check y ANTES del LLM call.
- 18 keywords ES: queja, abogado, denuncia, demanda, devolución, hablar con persona, agente humano, supervisor, estafa, fraude, ladrones, ridículo, vergonzoso, ...
- 16 keywords PT-BR: queixa, reclamação, advogado, denúncia, processar, devolução, falar com humano, atendente humano, golpe, fraude, ridículo, ...
- Match case-insensitive con `String.includes()`.

### Sprint 2.3 — Lista negra en LEAD_RESPONSE_PROMPT
Sección "## Restrições / Restricciones" añadida a `leadResponse` en ambos idiomas (PT-BR + ES). 5 puntos prohibidos:
1. Precios concretos en € o R$.
2. Plazos/SLAs específicos.
3. Garantías de resultados ("vas a vender 10x más").
4. Comparar con competidores por nombre (ManyChat, Wati, Take Blip).
5. URLs externas no aprobadas (solo `automatizawpp.com`).

Cada punto incluye redirección sugerida.

### Verificación E2E (BUILD `2O7obKvJuucWGAPjUl3KR`)
4/4 tests reales passed:
- ESCALATE PT-BR ("advogado") → action:ESCALATE, escalated:true, notifiedAdmin:true, 0 OUTBOUND
- ESCALATE ES ("supervisor") → idem
- Lista negra precio (PT-BR) → respuesta sin `R$ X`, redirige con "depende"/"conversar"
- Lista negra competidor (ES) → respuesta no ataca ni menciona ManyChat

### Deuda detectada en Sprint 2 (Sprint 2.4 candidato)
1. `route.ts` no tiene branches para `HANDLE_OBJECTION`, `CLOSE`, `FOLLOW_UP` → el orchestrator puede decidirlas y queda silencio. Solo `RESPOND/QUALIFY/HOLD/ESCALATE` están cableados.
2. Bug cosmético: `escalationCheck.language` retorna `pt-BR` para keyword "supervisor" aunque el lead sea `es` (la keyword "supervisor" está en ambas listas; loop PT-BR evalúa primero).
3. `triggerEscalation` no existe en `notifications/triggers.ts` (workaround `triggerLeadCreated`). Recomendable añadir trigger dedicado + template + alert-rule.
4. Schema `Lead` sin `escalated:Boolean` ni `escalatedAt:DateTime?`. Workaround: `nextAction='ESCALATED'` (colisiona si más tarde algo escribe `nextAction`).
5. Detección keywords con `includes()` simple → falsos positivos posibles ("supervisor" en "superviso a mi equipo"). Mejora: word-boundary regex.

---

## 2026-05-03 — Sesión: Sprint 1 cerrado al 100% (1.5 + 1.6 + 1.7)

### Sprint 1.5 — Bugs descubiertos en verificación E2E
- **1.5.1** `route.ts` ahora usa la **clase `LeadResponseAgent`** (con i18n) en lugar de la función legacy `runLeadResponseAgent` (hardcoded ES). Bug original: respuestas en PT-BR llegaban "por suerte" del LLM detectando idioma del input, no por el switch.
- **1.5.2** `salesQa` prompt reescrito a estructura bilingüe `{ ptBR, es }` + `qa-agent.ts` lee `lead.preferredLanguage` y pasa `lang` a `getPrompt('salesQa', lang)`. Fallback EN traducido.
- Verificación E2E: PT-BR (8 marcadores) y ES (9 marcadores) confirmados sin contaminación cruzada.

### Sprint 1.6 — JSON parse hardening
Bug crítico pre-existente: `callAIStructured` crasheaba HTTP 500 cuando Claude Haiku devolvía texto plano (formato email) en lugar de JSON.
- **Prefill assistant `{`** (técnica nativa Anthropic) — fuerza al modelo a continuar JSON.
- **`stripToJson()`** defensivo — elimina markdown fences, recorta a `{...}` o `[...]`.
- **Fallback silencioso** — si `JSON.parse` falla, `console.error` + return null. Sin throw.
- Endurecidos los 20 prompts (10 agentes × PT-BR + ES) con instrucción `"Devuelve EXCLUSIVAMENTE JSON válido (sin markdown, sin texto antes/después)"`.
- Build deployado, BUILD_ID `kSy245115EtwKddMIvn3e`.
- Verificación E2E: HTTP 200 en ambos tests, cero crashes "Failed to parse" en logs.

### Sprint 1.7 — Persistencia OUTBOUND + AgentRun trazable
Cerrar 3 bugs de persistencia descubiertos por la verificación del 1.6.

- **Bug A:** `src/lib/channels/router.ts` reescrito (~210 líneas). Nuevo `RoutePersistContext`. `routeMessage()` persiste `Message` OUTBOUND con metadata completo (provider, deliveryStatus, error si falla, language, agentRunId).
- **Bug B:** `src/app/api/events/inbound/route.ts` ahora crea `AgentRun(status:'RUNNING')` ANTES de invocar agentes. Cierra con `COMPLETED`/`CANCELLED`/`FAILED` según resultado. Mapeo `decision.action → AgentName`.
- **Bug C:** `src/lib/agents/contracts.ts` ahora tiene `agentRunId?: string` en `AgentContext`. `route.ts` construye `memorySummary` desde últimos 5 `Message` del lead y lo pasa al `LeadResponseAgent` y `SalesQaAgent`.

#### Verificación E2E final (BUILD_ID `w9GfdcxLOGo6pN438-QqE`)
Test PT-BR con lead `lead-veg17-ptbr-1777811026`:
- HTTP 200, `qaPassed:true`, `action:RESPOND`
- `agentRunId:cmopqsdc00005l0mb0syu0oxs`
- DB verificada:
  - 1 Message INBOUND + 1 Message OUTBOUND ambos con metadata completo (Bug A ✓)
  - 1 AgentRun `LEAD_RESPONSE` `status=COMPLETED` (Bug B ✓)
  - `outputPayload` contiene `draft`, `language=pt-BR`, `qaPassed`, `memorySummary`, `agentRunId`, `delivery{}` (Bug C ✓)
- Idioma 100% PT-BR sin contaminación.

### Sprint 1.8 — Resend API key rotada → entrega real funcional
Antes: `.env.production.local` no tenía `RESEND_API_KEY`, heredaba placeholder `"your-resend-key-here"` del `.env` legacy → `401 invalid`.

Después: copiada la key válida (`re_Nd1ybj1K_...`, dominio `automatizawpp.com` verified, plan free 5 req/sec) + `RESEND_FROM` a `.env.production.local`. `pm2 restart --update-env`.

Test E2E final (lead `lead-veg18-1777811464`, BUILD `w9GfdcxLOGo6pN438-QqE`):
- HTTP 200, `delivery.sent: TRUE`
- `providerMessageId: ac7b2173-bb6a-4292-a3b7-c4fd25a00611` (de Resend)
- `Message.metadata`: `deliveryStatus:sent, providerMessageId, language:pt-BR, agentRunId, deliveryError:null`
- Resend ACEPTÓ la entrega. Si fuera dominio real, llegaría al destinatario.

Quiet hours overrides restaurados a defaults. PM2 online sin overrides.

### Estado V.L.A.E.G. al cierre
```
Fase 0 (Inicialización):  ✅ COMPLETO
Fase 1 (Visión):          ✅ COMPLETO
Fase 2 (Link):            ✅ COMPLETO con deuda (Redis, Zoho SMTP/IMAP, Brevo, ahora también Resend key)
Fase 3 (Arquitectura):    ⚠️ DEUDA reconocida (Next.js monolítico)
Fase 4 (Estilo):          ✅ Sprint 1 verificado E2E
Fase 5 (Gatillo):         ✅ Deployado, payload persiste en DB (destino global parcial)
```

---

## 2026-05-02 — Sesión: Sprint 1 V.L.A.E.G. (gaps críticos cerrados)

### Hecho

**Aplicación retroactiva del Protocolo V.L.A.E.G. v2:**
- Estructura completa: `CLAUDE.md` (raíz), `docs/{plan,findings,progress}.md`, `architecture/`, `core/`, `tools/`, `.tmp/`
- 23 archivos legacy preservados en `docs/legacy/`
- READMEs en `architecture/`, `core/`, `tools/` documentando deuda técnica A.N.T.

**Fase 2 — Link (8 scripts atómicos):**
- `tools/_check_{postgres,resend,bird,anthropic}.ts` → ✅ OK
- `tools/_check_{redis,smtp,imap}.ts` → ❌ FAIL (ver findings.md)
- `tools/_check_brevo.ts` → ⏭ SKIP (key vacía)
- `tools/_check_openai.ts` → eliminado (proyecto usa Anthropic)
- API key Anthropic actualizada en local + producción

**Fase 1 — Visión completada con Eduardo:**
- 5 Preguntas respondidas formalmente
- 4 schemas en CLAUDE.md §3 (Login, Inbound, Orchestrator, Outbound)
- Constitución del Lead Response Agent escrita
- 7 gaps detectados → plan en 3 sprints aprobado

**Sprint 1 ejecutado por 4 agentes paralelos/secuenciales:**

*Agente A (auditoría read-only):*
- Mapa de 27 archivos con prompts
- 9 prompts EN concentrados en `src/lib/agents/prompts.ts`
- Confirmado gap #2: ningún archivo lee `preferredLanguage`
- Sorpresas: doble cliente AI (`client.ts` con OpenAI gpt-4o vs `anthropic-client.ts`), orchestrator duplicado, `ai-qualification.ts` con modelo distinto, fallbacks EN en todos los agentes

*Agente C (qa-agent cableado en `src/app/api/events/inbound/route.ts`):*
- API descubierta: `SalesQaAgent.run()` retorna `{ passed, riskScore, feedback, shouldBlock }` (prompt) o `{ qaScore, issues, recommendations, approved }` (fallback) — soporta ambas
- Inserción entre draft generado y `routeMessage()`: si rechaza → no envía, registra AgentRun con `outputPayload.qaPassed=false`, `status=CANCELLED`
- Deuda anotada: `AgentRun` sin columnas `qaPassed`/`qaNotes` ni estado `BLOCKED_BY_QA`

*Agente B (traducción + switch i18n) — 12 archivos modificados:*
- `prompts.ts` reescrito a estructura `Record<PromptName, Record<Language, string>>` + `getPrompt(name, lang)` + `resolveLanguage(value)`
- 9 prompts traducidos a estructura bilingüe (PT-BR + ES)
- Fallbacks bilingües en 8 agentes
- `buildUserPrompt` y `buildOrchestratorContext` traducidos (eliminada duplicación)
- Exports legacy mantenidos como `@deprecated` (no rompe imports)
- `LeadView.preferredLanguage?: 'es' | 'pt-BR' | null` añadido a `src/lib/types.ts`
- Comentarios añadidos en PT-BR/ES

*Agente D (verificación estática):*
| Verificación | Resultado |
|---|---|
| `tsc --noEmit` errores Sprint 1 | 0 (14 pre-existentes en `EmptyState.tsx`/`ErrorState.tsx`) |
| Inglés residual en `src/lib/agents/` | ninguno |
| 9 agentes leen `preferredLanguage` + usan `getPrompt` | ✅ todos |
| QA cableado: draft → qa → routeMessage o skip | ✅ |
| Imports legacy `ORCHESTRATOR_PROMPT` etc. siguen resolviendo | ✅ |
| Smoke: `getPrompt('leadResponse', 'pt-BR')` ≠ `getPrompt('leadResponse', 'es')` | ✅ "Você é" vs "Eres" |
| `resolveLanguage(null) === 'es'` | ✅ |

### Deuda técnica nueva detectada (NO arreglada — pendiente sprints futuros)
1. **Schema `AgentRun` sin columnas dedicadas** `qaPassed`, `qaNotes`, `BLOCKED_BY_QA` — workaround usando `outputPayload` Json + status `CANCELLED`. Migración Prisma pendiente.
2. **Doble cliente AI conflictivo:** `src/lib/ai/client.ts` (OpenAI gpt-4o) vs `src/lib/ai/anthropic-client.ts` (Claude). Ambos exportan `callAI`. Importadores actuales usan Anthropic.
3. **`ai-qualification.ts`** crea su propio cliente Anthropic con modelo distinto (`claude-opus-4-1-20250805`).
4. **`lead-response.ts` y `qualification.ts` son legacy paralelos** a sus versiones `*-agent.ts`. `sales-engine.ts` usa la versión legacy.
5. **`qa-agent.ts` fallback EN** ("Shorten first sentence and make CTA explicit.") sin traducir (Sprint 1 no lo tocó).
6. **`events/inbound/route.ts` no propaga `preferredLanguage` al QA AgentContext** — funciona con default 'es', inconsistente para leads PT-BR.
7. **`closer` prompt JSON schema mismatch:** prompt define `cta/option1/option2`, código emite `message/ctaType/...`.
8. **`detectObjectionType`** mezcla keywords EN+ES.

### Resultado
✅ **Sprint 1 cerrado.** Aprobado para Sprint 2 (ESCALATE + lista negra).

---

## 2026-05-02 — Sesión: Migración Vercel→DO + Fix login + Aplicación retroactiva V.L.A.E.G.

---

## 2026-05-02 — Sesión: Migración Vercel→DO + Fix login + Aplicación retroactiva V.L.A.E.G.

### Hecho
1. Migración DNS de Vercel a DigitalOcean (cambio nameservers en GoDaddy a `ns1/2/3.digitalocean.com`).
2. Verificación propagación DNS con `dig @8.8.8.8` y `dig @1.1.1.1` (asimétrico).
3. Instalación SSL Let's Encrypt en nginx (DO): `certbot --nginx -d automatizawpp.com -d www.automatizawpp.com --redirect`. Vence `2026-07-31`.
4. Reescritura de `LoginForm.tsx`, `AuthPageShell.tsx`, `SubmitButton.tsx` con estilos inline (eliminando dependencia de clases `.ds-*` no definidas).
5. Corrección de `globals.css` con definiciones faltantes para `.ds-*` (fallback).
6. Build + deploy + restart PM2 en droplet.
7. Verificado login funcional vía `curl -X POST /api/auth/login`: retorna `{"ok":true,"user":...}`.
8. Aplicación retroactiva del Protocolo V.L.A.E.G. — creación de `docs-veg/`, `tools-veg/`, `tmp-veg/`.
9. Documentación `plan.md`, `findings.md`, `constitution.md`, `progress.md`.

### Errores encontrados (todos en `findings.md`)
- DNS apuntaba a Vercel cuando producción estaba en DO.
- Nginx sin SSL al migrar dominio a DO.
- Login form con clases CSS sin estilos (botón a la derecha en lugar de full-width abajo).

### Anti-patrones cometidos por Claude esta sesión (auto-crítica)
- Cambiar CSS sin tener el Schema confirmado.
- Marcar "done" antes de verificar que funcionara end-to-end (3 veces).
- Adivinar la causa del bug (CSS) en lugar de diagnosticar (era DNS+SSL).
- No aplicar el Protocolo V.L.A.E.G. desde el primer mensaje a pesar de que el usuario lo mencionó (no estaba en memoria).

### Estado de producción al cierre
- ✓ `https://automatizawpp.com` resuelve a `68.183.203.16` (DigitalOcean)
- ✓ HTTPS válido (Let's Encrypt, redirect de HTTP→HTTPS)
- ✓ PM2 `automatizawpp` online, PID dinámico, port 3000
- ✓ Nginx reverse proxy 443→3000
- ✓ Login funcional con `admin@automatizawpp.com` / `Admin@2026!`
- ⚠ DNS en propagación parcial — algunos resolvers (CloudFlare 1.1.1.1) todavía cacheaban Vercel al cierre

### Plan de Rollback (Fase 5 — Gatillo)

**Si el deploy nuevo falla:**
1. Verificar PM2: `ssh root@68.183.203.16 "pm2 logs automatizawpp --err --lines 50 --nostream"`
2. Restart: `ssh root@68.183.203.16 "pm2 restart automatizawpp"`
3. Si build corrupto, volver a build anterior: `ssh root@68.183.203.16 "cd /opt/automatizawpp && git log --oneline -5"` y `git checkout <commit-anterior> && rm -rf .next && npm run build && pm2 restart automatizawpp`

**Si el dominio cae:**
1. Verificar nginx: `ssh root@68.183.203.16 "systemctl status nginx"`
2. Restart nginx: `ssh root@68.183.203.16 "systemctl restart nginx"`
3. Si SSL caducado: `ssh root@68.183.203.16 "certbot renew"`

**Si la DB cae:**
- Conectar a `165.227.175.193:5432` y verificar Postgres. Credenciales en `constitution.md` §6.

### Fix adicional al cierre — DATABASE_URL corregido

`.env.production.local` tenía credenciales placeholder (`postgres:postgres`). Reescrito con `botflow:BotFlowDB2026!`. PM2 delete + start (no restart, porque restart no recarga env vars). Login API ahora retorna `{"ok":true,"user":{"id":"admin_automatizawpp_usr","email":"admin@automatizawpp.com","role":"admin"}}` desde dominio público.

### Estado FINAL verificado (2026-05-02 07:15 UTC)

| Componente | Estado | Verificación |
|---|---|---|
| DNS (Google) | ✓ | `dig @8.8.8.8 → 68.183.203.16` |
| DNS (CloudFlare) | ⏳ propagando | `dig @1.1.1.1 → todavía Vercel` (caché) |
| HTTPS | ✓ | `curl -sI → HTTP/1.1 200, Server: nginx/1.24.0` |
| Login form layout | ✓ | inline styles `display:grid;grid-template-columns:1fr;gap:12px`, botón `width:100%;background:#25D366` |
| Login API | ✓ | `{"ok":true,"user":{...}}` |
| Dashboard redirect | ✓ | `307 Temporary Redirect` (correcto, redirige a login si no auth) |
| PM2 | ✓ | online, PID 24525 |

### Pendientes (próxima sesión)
- [ ] Cierre formal de Fase 4 — Eduardo aprueba el login form definitivo (con screenshot tras flush DNS)
- [ ] Fase 2 — `tools-veg/_check_<servicio>.py` para Bird, Brevo, Resend, OpenAI, Postgres, Redis
- [ ] Documentar rate limits de cada API en `findings.md`
- [ ] Decisión: ¿refactor a A.N.T. de 3 capas, o aceptar deuda y consolidar Next.js monolítico?
- [ ] Canal WhatsApp Bird — aguardando `BIRD_WHATSAPP_CHANNEL_ID` + template HSM aprovado pelo Meta
- [ ] Deploy a prod das mudanças desta sessão (TS fixes + NotificationBell + isChannelEnabled)

---

## Sessão 2026-05-04 — Limpeza de dívidas pós V.L.A.E.G.

**Contexto:** Continuação de "onde paramos". Eduardo pediu fechar 5 dívidas (a-e).

### Realizado

1. **(e) Memória GSC atualizada** — `routine_gsc_monitoring.md` corrigido com IP novo `68.183.203.16` (era `143.198.46.37` desatualizado).

2. **(b) 14 erros TS resolvidos** em `src/components/ui/EmptyState.tsx` + `ErrorState.tsx`. Causa: sintaxe `icon?: React.ReactNode` inválida dentro do destructuring. Fix: separar destructuring (sem tipos) do parâmetro tipado. Total de erros TS do projeto segue em 184 (preexistentes, fora de escopo).

3. **(c) Banner in-app implementado:**
   - `<NotificationBell />` agora montado em `src/components/ui/TopBar.tsx` (antes era código solto, sem consumidores)
   - `isChannelEnabled(channel)` em `src/lib/notifications/service.ts` — filtra canais sem env config; SLACK sem webhook não cria mais `Notification` record FAILED
   - Documentado em `findings.md` Gap #8

4. **(d) Backup BD + cleanup _prisma_migrations:**
   - `pg_dump` full + schema-only em `/opt/automatizawpp/backups/sales_os_{full,schema}_20260504_060258.sql` (1.2M + 76K)
   - Removidos 2 records `add_notifications_schema` pending duplicados de `_prisma_migrations` (backup `_prisma_migrations_pre_cleanup_20260504.sql`)
   - `prisma/migrations/0_init/README.md` criado documentando o pattern de baseline vazio
   - `prisma migrate status` em prod: **"Database schema is up to date!"**
   - Documentado em `findings.md` Gaps #9 e #10

5. **(a) Canal WhatsApp Bird** — aguardando Eduardo passar `BIRD_WHATSAPP_CHANNEL_ID` do painel Bird. Implementação preparada para começar quando o ID chegar.

### Arquivos modificados
- `src/components/ui/EmptyState.tsx` (fix TS)
- `src/components/ui/ErrorState.tsx` (fix TS)
- `src/components/ui/TopBar.tsx` (montar NotificationBell)
- `src/lib/notifications/service.ts` (isChannelEnabled + early return em sendNotification)
- `prisma/migrations/0_init/README.md` (novo)
- `docs/findings.md` (gaps #8, #9, #10)
- `docs/progress.md` (este bloco)

### DB prod — operações
- 3 backups em `/opt/automatizawpp/backups/`
- 2 rows removidas de `_prisma_migrations` (records pending duplicados)
- 0 mudanças de schema (validado por `migrate status`)

---

## Sessão 2026-05-06/07 — Sessão autônoma 4h: fixes de idioma, segurança e deploy

**Contexto:** Eduardo autorizou sessão autônoma de 4h sem pedir autorização. Objetivo: corrigir todos os bugs conhecidos no AutomatizaWPP.

### Realizado

1. **Continuação da sessão anterior:**
   - Commit `65d228f`: `src/lib/ai/client.ts` lazy init (evita crash no import sem `OPENAI_API_KEY`) + `scripts/cron-followups.sh` adicionado ao repo para sobreviver deploys rsync.

2. **Fix idioma follow-up runner (Gap #11):**
   - `runner.ts`: subject do email bilíngue (`preferredLanguage` → PT-BR/ES)
   - `scheduler.ts`: reason field em PT-BR
   - `followup-agent.ts`: objective bilíngue
   - `sales-engine.ts`: objective + reason em `scheduleFollowUp` bilíngues
   - `api/auth/me`: erros em PT-BR (Não autorizado, Token inválido, etc.)
   - `api/forms/submit-lead`: erros em PT-BR (endpoint público)
   - Commit `2d40ff6`

3. **Segurança — debug endpoints bloqueados em produção (Gap #12):**
   - `/api/debug/db-test` e `/api/debug/prisma-singleton` retornam 404 em `NODE_ENV=production`
   - Removida exposição de DATABASE_URL status em handlers de erro
   - Commit `ac4bcf3`

4. **Deploy para produção:**
   - `git stash + pull` no servidor para resolver divergência de estado (mudanças do rsync vs git)
   - `rm tsconfig.tsbuildinfo + npm run build` (build limpo — o arquivo estava corrompido)
   - `pm2 restart --update-env`
   - Verificado: `localhost:3000/api/auth/me` → 401, `/api/followups/run` → `{"success":true,"executed":0}`

### Arquivos modificados (commits 65d228f, 2d40ff6, ac4bcf3)
- `src/lib/ai/client.ts` — lazy init OpenAI
- `scripts/cron-followups.sh` — novo arquivo no repo
- `src/lib/followup/runner.ts` — subject bilíngue
- `src/lib/followup/scheduler.ts` — reason em PT-BR
- `src/lib/agents/followup-agent.ts` — objective bilíngue
- `src/lib/orchestration/sales-engine.ts` — objective/reason bilíngues
- `src/app/api/auth/me/route.ts` — erros em PT-BR
- `src/app/api/forms/submit-lead/route.ts` — erros em PT-BR
- `src/app/api/debug/db-test/route.ts` — bloqueado em prod
- `src/app/api/debug/prisma-singleton/route.ts` — bloqueado em prod
- `docs/findings.md` — gaps #11 e #12 documentados

### Estado de produção ao cierre
- ✅ `https://automatizawpp.com` operacional (PM2 online, Nginx, SSL)
- ✅ Follow-ups cron: `/var/log/automatizawpp-followups.log` com HTTP 200 a cada 5min
- ✅ `scripts/cron-followups.sh` no repo — sobreviverá próximos deploys
- ✅ Debug endpoints bloqueados em produção
- ✅ Emails de follow-up agora em PT-BR ou ES conforme preferredLanguage do lead

4. **Bug crítico: Bird workspace ID ≠ App workspace ID (Gap #13):**
   - Erro encontrado nos logs: `Foreign key constraint violated on the constraint: Notification_workspaceId_fkey`
   - Causa raíz: `BIRD_WORKSPACE_ID = '5996a896-...'` (UUID externo Bird) ≠ `demo_workspace` (workspace da app na BD)
   - `bird-normalizer.ts`: removida prioridade de `event.workspace?.id` do Bird
   - 3 endpoints mudados de `BIRD_WORKSPACE_ID` para `APP_WORKSPACE_ID ?? 'demo_workspace'`
   - Servidor: `APP_WORKSPACE_ID=demo_workspace` adicionado ao `.env.production.local`
   - Verificado E2E: lead criado, agente respondeu PT-BR, QA passou, FK violations desapareceram dos logs
   - Commit `9e64e39`

### Estado de produção ao cierre (2026-05-07 ~12:30 UTC)
- ✅ `https://automatizawpp.com` operacional
- ✅ Follow-ups cron: HTTP 200 a cada 5min
- ✅ Bug de workspaceId resolvido — notifications persistem corretamente
- ✅ Debug endpoints bloqueados em produção
- ✅ E2E verificado: inbound → lead criado → agente PT-BR → QA pass

### Pendentes (próxima sessão)
- [ ] Verificação GSC (Google Search Console) — Eduardo deve verificar manualmente
- [ ] Canal WhatsApp Bird — aguardando `BIRD_WHATSAPP_CHANNEL_ID` de Eduardo
- [ ] Webhook Bird: adicionar verificação de assinatura HMAC (segurança média)
- [ ] `src/lib/tuning/feedback-service.ts`: implementar persistência real de reviews (TODO conhecido)

---

## Sessão 2026-05-07 (continuação) — Bug Hunt Sprint #2

### Commits desta sessão
- `29eb6fd` — fix: role case mismatch em resolveNotificationUserId (IN_APP → SENT)
- `24519b4` — i18n: 79 arquivos, strings inglesas → PT-BR/ES (bulk)
- `72c7bad` — fix: monitoring routes + feedback-service DB persistence
- `0f0f7ab` — fix: idempotência webhook em BD (WebhookEvent, sobrevive PM2 restart)

### Infraestrutura
- ✅ Nginx: redirect apex→www agora 308 (preserva POST body)
- ✅ PM2 uptime OK após 7 restarts

### Bugs corrigidos (Gaps #14–#17)
- ✅ IN_APP notifications: role lowercase fix → todas as notificações agora SENT
- ✅ 79 arquivos: 'Unknown error', 'Unauthorized', 'Forbidden', etc. → PT-BR
- ✅ Monitoring routes: workspace hardcoded removido → isolamento multi-tenant real
- ✅ feedback-service: implementação real via ActivityLog (type=QA_REVIEW)
- ✅ Webhook idempotência: in-memory → Prisma WebhookEvent (persistente)
- ✅ Nginx 301 → 308 para apex: POSTs não perdem body no redirect

### Pendentes (próxima sessão)
- [ ] GSC — Eduardo verificar manualmente
- [ ] BIRD_WHATSAPP_CHANNEL_ID — aguardando de Eduardo
- [ ] Webhook Bird HMAC signature verification (segurança)
- [ ] Completar fallback 'Unknown' → 'Desconhecido' nos campos de lead criados via webhook
