# task_plan.md — Fases, Objetivos e Checklists
> Protocolo V.L.A.E.G. | AutomatizaWPP Sales OS
> Atualizar ao completar cada item.

---

## STATUS GERAL

| Fase | Nome | Status |
|---|---|---|
| 0 | Inicialização | ✅ Completa |
| 1 | V — Visão | 🔄 Em progresso (aguarda Discovery Questions) |
| 2 | L — Link | ⏳ Pendente |
| 3 | A — Arquitetura | ⏳ Pendente |
| 4 | E — Estilo | 🔄 Parcial (páginas corrigidas 2026-05-01) |
| 5 | G — Gatilho | ⏳ Pendente |

---

## FASE 0 — Inicialização ✅

- [x] Criar gemini.md (Constituição)
- [x] Criar task_plan.md
- [x] Criar findings.md
- [x] Criar progress.md
- [ ] Responder 5 Discovery Questions (aguarda Eduardo)
- [ ] Aprovar Blueprint em task_plan.md

**BLOQUEIO:** Execução de código proibida até Discovery Questions respondidas.

---

## FASE 1 — V — Visão 🔄

### Discovery Questions (OBRIGATÓRIAS — aguardando resposta)

1. **Estrela-Guia:** Qual é o resultado único desejado do Sales OS? (ex.: "Cada lead inbound responde em < 5 min e recebe follow-up automático até converter ou opt-out")
2. **Integrações:** Quais serviços externos estão ativos? Chaves configuradas? (Bird, Brevo, n8n, Anthropic, Vapi, Stripe…)
3. **Fonte da Verdade:** Os dados primários vivem no PostgreSQL local ou managed DO? Há dados reais de leads agora?
4. **Payload de Entrega:** Onde o resultado final deve chegar? (Email via Brevo, WhatsApp via Bird, dashboard, Slack…)
5. **Regras Comportamentais:** Há regras específicas do negócio que não estão documentadas? (ex.: "nunca mencionar preço na primeira mensagem", "sempre oferecer demo antes de proposta")

### Checklist Fase 1
- [ ] 5 Discovery Questions respondidas
- [ ] JSON Schema confirmado em gemini.md
- [ ] Blueprint aprovado por Eduardo

---

## FASE 2 — L — Link ⏳

### Conexões a testar
- [ ] PostgreSQL → `prisma migrate status`
- [ ] Redis → `redis-cli ping`
- [ ] Anthropic API → test call
- [ ] Bird API → test GET workspace
- [ ] Brevo API → test GET account
- [ ] n8n → test GET /api/v1/workflows
- [ ] `/api/events/inbound` → POST com payload de teste
- [ ] `/api/followups/run` → POST e verificar resultado

---

## FASE 3 — A — Arquitetura ⏳

### Itens críticos faltando (auditoria 2026-05-01)
- [ ] `prisma/migrations/` — executar `npx prisma migrate dev --name init`
- [ ] `src/lib/ai/structured.ts` — helpers Zod centralizados
- [ ] `src/lib/ai/tokens.ts` — gestão de token budget
- [ ] `src/lib/ai/agent-runner.ts` — wrapper dual-provider (Claude/OpenAI)
- [ ] `src/lib/channels/email/` — subdirs por provider
- [ ] `src/lib/channels/whatsapp/` — subdirs por provider
- [ ] `src/lib/repositories/` — repos faltantes (conversation, message, agent-run, workspace)
- [ ] `vercel.json` cron — `/api/sentinel/scan-now` cada 5 min

### Renomear para alinhar com A.N.T.
- [ ] Criar `flows/` como symlink/alias para n8n/ (ou mover workflows)
- [ ] Criar `tools/` com scripts atômicos testáveis

---

## FASE 4 — E — Estilo ✅ (parcial)

### Páginas corrigidas em 2026-05-01
- [x] Dashboard — fix mismatch /api/metrics, KPIs reais (Conversão + Eficiência IA)
- [x] Leads — modal criar contato (removido window.prompt)
- [x] Conversations — chat estilo bubble + campo de resposta + auto-scroll
- [x] Follow-ups — status pills reais, botão "Executar Agora", coluna Canal
- [x] Calls — modal criar chamada, coluna Resumo, média duração
- [x] Agents — verificado sem bugs (592 linhas, todas as APIs conectadas)

### Pendente
- [ ] Design mobile responsivo em todas as páginas
- [ ] Loading states em modais
- [ ] Páginas públicas (/automacao-whatsapp, /blog, /teste-gratis) — com WIP/placeholder

---

## FASE 5 — G — Gatilho ⏳

### Deploy checklist
- [ ] `prisma migrate deploy` no servidor
- [ ] Configurar `.env.production` completo no Droplet 143.198.46.37
- [ ] `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Verificar `/health` endpoint
- [ ] Importar 3 workflows n8n
- [ ] Ativar workflows n8n
- [ ] Apontar webhook Bird → n8n
- [ ] Testar POST /api/events/inbound E2E
- [ ] Verificar `vercel.json` cron ativo
- [ ] Confirmar logs e alertas ativos (Sentry)

---

*Última atualização: 2026-05-01*
