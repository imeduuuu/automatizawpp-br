# findings.md — Pesquisas e Descobertas
> Registrar: restrições de API, comportamentos inesperados, decisões arquiteturais, aprendizados.

---

## [2026-05-01] Auditoria inicial vs ESTRUCTURA-MAESTRA

### Estado real do projeto (verificado)
- Build: ✅ verde após fix TypeScript (`specialistResult: AgentExecutionResult`)
- scheduler.ts + runner.ts: ✅ já implementados (surpresa positiva)
- `prisma/migrations/`: ❌ ausente — bloqueio para deploy em novo ambiente
- `vercel.json` cron: ⚠️ array vazio — sentinel não dispara automaticamente

### Mismatch de API encontrado
- Dashboard chamava `/api/metrics` esperando `{metrics: {conversations, messages, agentRuns}}`
- API real retorna `{funnel, conversionRates, mrr, recentActivity}`
- **Fix:** dashboard atualizado para usar shape real + segunda call `/api/ops/efficiency`

### Provider de IA
- Maestra documenta OpenAI como provider principal
- Projeto real usa **Anthropic Claude** (migrado em sessão anterior)
- `src/lib/ai/anthropic-client.ts` existe e funciona
- `src/lib/ai/client.ts` é wrapper Anthropic (não OpenAI)
- **Regra gemini.md:** AI_PROVIDER = anthropic, modelo = claude-sonnet-4-6

### Calls: dois modelos no schema
- `CallAttempt`: modelo simples (result, duration, notes) — usado pela API `/api/calls`
- `CallRecord`: modelo rico (durationSec, summary, nextAction, objectionsDetected) — mais relevante
- `/api/calls/route.ts` já mapeia `duration → durationSec` corretamente
- **Oportunidade:** migrar API para usar CallRecord quando houver dados reais

### Channels: estrutura monolítica vs subdirs
- Maestra define: `channels/email/brevo.ts`, `channels/email/bird.ts`, `channels/whatsapp/bird-wa.ts`, `channels/sms/twilio-sms.ts`
- Projeto atual: tudo em `router.ts` (monolítico mas funcional)
- **Decisão:** refatorar para subdirs na Fase 3 — não é bloqueador de produção

### n8n Workflows
- 3 de 3 workflows presentes: bird-email, inbound-bridge, followups-cron ✅
- Pendente: importar + activar no servidor n8n
- Pendente: configurar webhook Bird → n8n

---

## [2026-05-01] Correções de UI aplicadas

### Conversations page
- Endpoint `/api/conversations/[id]` ordenava messages DESC → corrigido para ASC
- Campo de resposta adicionado (POST /api/events/inbound com branch manual)
- Bolhas de chat: INBOUND esquerda, OUTBOUND direita com auto-scroll

### useApi hook
- Retorna apenas `{ data, loading, error, setData }` — sem `reload` ou `refetch`
- Para recarregar: usar `window.location.reload()` ou chave de estado (`detailKey`)
- **Restrição registrada:** não adicionar `reload` ao useApi sem testar impacto

### FollowUpStatus enum (schema confirmado)
- Valores: QUEUED, SENT, COMPLETED, CANCELLED, SKIPPED
- `SENT` estava missing no mapeamento anterior → corrigido com `FollowUpStatusPill` direto

---

## [2026-05-01] Fase 2 — L — Link: Resultados dos testes de conexão

### Resumo executivo
- **3 conexões OK**, **4 com bloqueio** (2 críticos, 2 configuração)
- Loop E2E testado: payload chega, normaliza, mas falha no DB (credenciais erradas)

### Resultados detalhados

| Serviço | Endpoint testado | Resultado | Tipo de bloqueio |
|---|---|---|---|
| Anthropic API | POST /v1/messages | ✅ 200 | — |
| n8n server | 165.227.175.193:5678 | ✅ 200 (server ativo) | — |
| PostgreSQL porta | 143.198.46.37:5432 | ✅ Porta aberta | — |
| PostgreSQL auth | `prisma migrate status` | ❌ P1000 auth failed | Credenciais erradas no .env |
| Bird API | /workspaces | ❌ 403 Forbidden | BIRD_WORKSPACE_ID="demo_workspace" é placeholder |
| Brevo API | /v3/account | ❌ 401 Unauthorized | BREVO_API_KEY inválida ou expirada |
| n8n API | /api/v1/workflows | ❌ 401 | N8N_API_KEY ausente no .env |
| SSH Droplet | root@143.198.46.37 | ❌ Permission denied | Chave SSH local não autorizada no Droplet |
| Redis | 143.198.46.37:6379 | ⚠️ Não testável | redis-cli não instalado localmente |

### Loop E2E — diagnóstico
- Payload Bird (correto) → normalizer ✅ passa
- `prisma.lead.findFirst()` → ❌ P1000: credenciais DB inválidas
- **Conclusão:** o código está correto, o bloqueio é infraestrutura

### Ações necessárias (por prioridade)
1. **[CRÍTICO] PostgreSQL:** Corrigir `DATABASE_URL` no .env com password correto do Droplet
2. **[CRÍTICO] Bird:** Substituir `BIRD_WORKSPACE_ID="demo_workspace"` pelo ID real do painel Bird
3. **[CONFIG] Brevo:** Regenerar API key em app.brevo.com → API Keys
4. **[CONFIG] n8n:** Adicionar `N8N_API_KEY` no .env (Settings → API Keys no painel n8n)
5. **[INFRA] SSH:** Adicionar chave pública local às authorized_keys do Droplet via painel DO

---

## [2026-04-29] Bird Email Integration (sessão anterior)

### Loop fechado
- Problema: sistema recebia emails Bird, processava com IA, mas nunca despachava resposta
- Fix: `routeMessage()` chamado em `/api/events/inbound` após gerar agentResponse
- `sendBirdEmail()` implementado em router.ts

### Variáveis Bird necessárias (não commitadas)
```
BIRD_EMAIL_CHANNEL_ID=""
BIRD_EMAIL_FROM="hola@automatizawpp.com"
EMAIL_PROVIDER="brevo"  # mudar para "bird" em produção
```

---

## Restrições de ambiente

| Restrição | Detalhes |
|---|---|
| SMTP bloqueado em DigitalOcean | Usar Brevo/Resend para email outbound |
| Chamadas de teste | Apenas +34680365779 |
| API Anthropic | Nunca chamar do browser — sempre via /api/* |
| Migrations | Prisma migrate dev --name init antes do primeiro deploy |

---

*Última atualização: 2026-05-01*
