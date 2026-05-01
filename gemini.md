# gemini.md — Constituição do Projeto
> Sales OS / AutomatizaWPP — Protocolo V.L.A.E.G.
> Este arquivo é a lei. Alterar somente quando: schema mudar, regra for adicionada ou arquitetura for modificada.

---

## 1. Identidade do Sistema

**Nome:** AutomatizaWPP — Sales OS  
**Missão:** Sistema operativo de vendas multi-agente para empresas B2B.  
**Stack:** Next.js 15 · TypeScript · PostgreSQL · Prisma · n8n · Anthropic Claude · Bird · Brevo  
**Domínio produção:** automatizawpp.com | Droplet: 143.198.46.37  

---

## 2. Schemas de Dados (fonte da verdade)

### 2.1 Payload Inbound (entrada no sistema)
```json
{
  "workspaceId": "string",
  "leadId": "string | undefined",
  "channel": "EMAIL | WHATSAPP | SMS | VOICE | WEB",
  "message": "string",
  "subject": "string | undefined",
  "threadRef": "string | undefined",
  "messageId": "string | undefined",
  "lead": {
    "email": "string | undefined",
    "phone": "string | undefined",
    "fullName": "string | undefined",
    "source": "string | undefined"
  },
  "metadata": {
    "birdConversationId": "string | undefined",
    "inReplyTo": "string | undefined"
  }
}
```

### 2.2 Payload de Decisão do Orchestrator (saída Camada 1)
```json
{
  "action": "RESPOND | QUALIFY | HANDLE_OBJECTION | CLOSE | FOLLOW_UP | ESCALATE | HOLD",
  "reasoning": "string",
  "targetAgent": "string",
  "confidence": "number (0-1)"
}
```

### 2.3 Resultado de Agente Especialista (saída Camada 2)
```json
{
  "agent": "AgentName",
  "summary": "string",
  "payload": {
    "draftMessage": "string",
    "channelVariants": {
      "EMAIL": "string",
      "WHATSAPP": "string",
      "SMS": "string"
    }
  }
}
```

### 2.4 Payload de Entrega (saída Camada 3 — router)
```json
{
  "sent": "boolean",
  "messageId": "string | undefined",
  "error": "string | undefined"
}
```

### 2.5 FollowUpTask
```json
{
  "leadId": "string",
  "channel": "ChannelType",
  "status": "QUEUED | SENT | COMPLETED | CANCELLED | SKIPPED",
  "reason": "string",
  "scheduledFor": "ISO8601",
  "attempt": "number"
}
```

---

## 3. Regras Comportamentais (invariantes)

### 3.1 Compliance (hard stops — nunca violar)
- `optedOut = true` → bloqueia qualquer outbound, sem exceção
- `dailyTouches >= MAX_TOUCHES_PER_DAY` → adia para amanhã, não cancela
- `quietHours (21:00–09:00 BRT)` → agenda para próximo horário permitido
- Máximo 3 tentativas por FollowUpTask antes de CANCELLED

### 3.2 Resposta
- Primeiro contato: responder em < 5 minutos
- Tom: natural, premium, B2B — não revelar IA a menos que perguntado diretamente
- Idioma: detectar automaticamente; default PT-BR

### 3.3 IA (provider)
- Provider atual: **Anthropic Claude** (substituiu OpenAI)
- Modelo produção: `claude-sonnet-4-6` (Sonnet 4.6)
- Modelo custo-otimizado: `claude-haiku-4-5-20251001`
- Nunca chamar API Anthropic do frontend — sempre via `/api/*`

### 3.4 O que NÃO fazer
- Nunca spam: máximo 3 follow-ups por sequência por lead
- Nunca mudar tom/estilo de mensagem sem aprovação QA Agent
- Nunca commitar `.env` ou chaves
- Nunca chamar leads reais em testes — usar +34680365779
- Nunca mudar design visual sem autorização explícita

---

## 4. Princípios Operacionais (lei — nunca ignorar)

### 4.1 Regra dos Dados Primeiro
A codificação **só começa** após a confirmação do formato do Payload.
Antes de construir qualquer ferramenta, o schema de entrada e saída deve estar definido neste arquivo (Seção 2).

### 4.2 Atualização de Memória (após qualquer tarefa significativa)
| O que aconteceu | Onde registrar |
|---|---|
| Execução, erros, resultados de testes | `progress.md` |
| Descobertas, restrições de API, comportamentos inesperados | `findings.md` |
| Schema mudou, regra adicionada, arquitetura modificada | `gemini.md` (este arquivo) |

**gemini.md é a lei. Os arquivos de planejamento são a memória.**

### 4.3 Loop de Reparo (quando uma ferramenta falha)
1. **Analisar** — ler o stack trace completo. Nunca adivinhar.
2. **Corrigir** — ajustar o script em `tools/` (ou o código relevante).
3. **Testar** — verificar se a correção funciona antes de prosseguir.
4. **Atualizar Arquitetura** — registrar o aprendizado em `findings.md` ou `gemini.md`:
   - ex: *"A API Bird requer header `Authorization: AccessKey` não Bearer"*
   - ex: *"Prisma P1000: credenciais do Droplet são diferentes do .env.example"*
   - Para que o erro **nunca se repita**.

### 4.4 Entregáveis vs. Intermediários
| Tipo | Local | Regra |
|---|---|---|
| **Intermediários** | `/tmp/` | Efêmeros — dados coletados, logs, arquivos temporários. Podem ser deletados. |
| **Entregáveis** | Nuvem | O Payload final — DB PostgreSQL, dashboard UI, email enviado, WhatsApp entregue. |

**Um projeto só está "Concluído" quando o payload está em seu destino final na nuvem.**

---

## 5. Arquitetura A.N.T. (3 Camadas)

```
Camada 1 — agents/           → Orquestração: decide quando e como
Camada 2 — flows/ (n8n + lib)→ Lógica de negócio sequencial
Camada 3 — tools/            → Scripts atômicos, determinísticos, testáveis
```

### Mapeamento no projeto atual
| A.N.T. | Localização atual |
|---|---|
| agents/ | src/lib/agents/ |
| flows/ | n8n/ + src/lib/orchestration/ |
| tools/ | src/lib/channels/ + src/lib/compliance/ + src/lib/followup/ |

---

## 6. Invariantes Arquiteturais

1. Todo input externo passa por `POST /api/events/inbound` — entry point único
2. Orchestrator lê memória ANTES de decidir ação
3. Sales QA Agent valida mensagem ANTES de enviar
4. Memory Agent atualiza LeadMemory DEPOIS de cada interação
5. Follow-up scheduler usa temperatura do lead (HOT/WARM/COLD) para determinar timing
6. `prisma/migrations/` deve estar presente antes de qualquer deploy
7. Redis é obrigatório para queue de follow-ups em produção

---

## 7. KPIs e Targets

| Métrica | Baseline | Target |
|---|---|---|
| Response Quality | 70.0% | ≥ 90% |
| NBA Accuracy | 65.75% | ≥ 85% |
| Compliance Score | 100% | 100% |
| Stage Progression | 25.0% | ≥ 60% |
| Follow-Up Effectiveness | 65.0% | ≥ 80% |
| **Weighted Efficiency** | **67.65%** | **≥ 85%** |

---

*Última atualização: 2026-05-01 | Versão: 1.1 — Princípios Operacionais adicionados*
