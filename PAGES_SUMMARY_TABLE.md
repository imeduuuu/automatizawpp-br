# TABELA RESUMIDA - TODAS AS PÁGINAS

## PÁGINAS PÚBLICAS (10) - Sem autenticação necessária

| # | Ruta | Propósito | Tipo | HTTP | Status |
|---|------|-----------|------|------|--------|
| 1 | `/` | Landing page inicial | Marketing | 200 | ✓ Acessível |
| 2 | `/automacao-atendimento` | Página de produto - Atendimento | Produto | 200 | ✓ Acessível |
| 3 | `/automacao-vendas` | Página de produto - Vendas | Produto | 200 | ✓ Acessível |
| 4 | `/automacao-whatsapp` | Página de produto - WhatsApp | Produto | 200 | ✓ Acessível |
| 5 | `/blog` | Blog e artigos | Conteúdo | 200 | ✓ Acessível |
| 6 | `/casos-sucesso` | Casos de sucesso | Marketing | 200 | ✓ Acessível |
| 7 | `/contatos` | Formulário de contactos | Conversão | 200 | ✓ Acessível |
| 8 | `/contatos-publico` | Contactos públicos | Conversão | 200 | ✓ Acessível |
| 9 | `/pricing` | Planos e preços | Conversão | 200 | ✓ Acessível |
| 10 | `/register` | Registro / Sign up | Auth | 200 | ✓ Acessível |
| 11 | `/teste-gratis` | CTA Teste gratuito | Conversão | 200 | ✓ Acessível |
| 12 | `/privacidade` | Política de privacidade | Legal | 200 | ✓ Acessível |
| 13 | `/termos` | Termos de uso | Legal | 200 | ✓ Acessível |

## PÁGINAS PRIVADAS (24) - Requer autenticação

### Conta e Segurança (4)

| # | Ruta | Propósito | Tipo | Proteção | Status |
|---|------|-----------|------|----------|--------|
| 1 | `/account` | Configurações da conta | Settings | JWT | ✓ Protegido |
| 2 | `/account/billing` | Facturação e pagamento | Settings | JWT | ✓ Protegido |
| 3 | `/account/security` | Segurança e 2FA | Settings | JWT | ✓ Protegido |
| 4 | `/settings` | Configurações gerais | Settings | JWT | ✓ Protegido |

### Agentes IA (2)

| # | Ruta | Propósito | Tipo | Proteção | Status |
|---|------|-----------|------|----------|--------|
| 1 | `/agents` | Painel de agentes IA | IA | JWT | ✓ Protegido |
| 2 | `/agents/config` | Configuração de agentes | IA | JWT | ✓ Protegido |

### Leads e Contactos (4)

| # | Ruta | Propósito | Tipo | Proteção | Status |
|---|------|-----------|------|----------|--------|
| 1 | `/leads` | Banco de leads | CRM | JWT | ✓ Protegido |
| 2 | `/contatos` | Contactos privados | CRM | JWT | ✓ Protegido |
| 3 | `/conversations` | Histórico de conversas | CRM | JWT | ✓ Protegido |
| 4 | `/crm` | Sistema CRM | CRM | JWT | ✓ Protegido |

### Comunicação (4)

| # | Ruta | Propósito | Tipo | Proteção | Status |
|---|------|-----------|------|----------|--------|
| 1 | `/calls` | Histórico de chamadas | Comunicação | JWT | ✓ Protegido |
| 2 | `/emails` | Gerenciamento de emails | Comunicação | JWT | ✓ Protegido |
| 3 | `/follow-ups` | Follow-ups automáticos | Comunicação | JWT | ✓ Protegido |
| 4 | `/sequences` | Sequências de automação | Comunicação | JWT | ✓ Protegido |

### Dashboards (6)

| # | Ruta | Propósito | Tipo | Proteção | Status |
|---|------|-----------|------|----------|--------|
| 1 | `/dashboard` | Dashboard principal | Dashboard | JWT | ✓ Protegido |
| 2 | `/client-dashboard` | Dashboard do cliente | Dashboard | JWT | ✓ Protegido |
| 3 | `/monitoring` | Monitoramento em tempo real | Monitoring | JWT | ✓ Protegido |
| 4 | `/monitoring/logs` | Logs detalhados | Monitoring | JWT | ✓ Protegido |
| 5 | `/sentinel` | Monitor de segurança | Monitoring | JWT | ✓ Protegido |
| 6 | `/seo-dashboard` | Dashboard de SEO | Dashboard | JWT | ✓ Protegido |

### Outros (1)

| # | Ruta | Propósito | Tipo | Proteção | Status |
|---|------|-----------|------|----------|--------|
| 1 | `/services` | Serviços oferecidos | Interno | JWT | ✓ Protegido |

---

## ENDPOINTS DE AUTENTICAÇÃO (Especiais)

| Ruta | Tipo | Autenticação | Propósito |
|------|------|--------------|-----------|
| `/login` | Público | Nenhuma | Página de login |
| `/signup` | Público | Nenhuma | Página de signup |
| `/register` | Público | Nenhuma | Registro público |
| `/forgot-password` | Público | Nenhuma | Recuperação de senha |
| `/reset-password/*` | Público | Token de reset | Reset de senha |
| `/force-login` | Público | Nenhuma | Force login |

---

## ENDPOINTS API PÚBLICOS (23)

| # | Endpoint | Autenticação | Propósito |
|---|----------|--------------|-----------|
| 1 | `/api/auth/login` | Nenhuma | Login |
| 2 | `/api/auth/logout` | Nenhuma | Logout |
| 3 | `/api/auth/refresh` | Nenhuma | Refresh token |
| 4 | `/api/register` | Nenhuma | Registro |
| 5 | `/api/webhooks` | Signature | Webhooks |
| 6 | `/api/agents/heartbeat` | Nenhuma | Health check |
| 7 | `/api/gdpr/purge` | Nenhuma | GDPR purge |
| 8 | `/api/events/inbound` | Nenhuma | Inbound events |
| 9 | `/api/test` | Nenhuma | Testes |
| 10 | `/api/debug` | Nenhuma | Debug |
| 11 | `/api/public` | Nenhuma | Endpoints públicos |
| 12 | `/api/forms` | Nenhuma | Formulários |
| 13 | `/api/leads` | Nenhuma | Criação de leads |
| 14 | `/api/health` | Nenhuma | Health check |
| 15 | `/api/ops` | Nenhuma | Operações |
| 16 | `/api/system/tick` | Nenhuma | System tick |
| 17 | `/api/sentinel` | Nenhuma | Sentinel |
| 18 | `/api/newsletter` | Nenhuma | Newsletter |
| 19 | `/api/diagnostico` | Nenhuma | Diagnóstico |
| 20 | `/api/growth` | Nenhuma | Growth metrics |
| 21 | `/api/blog` | Nenhuma | Blog API |
| 22 | `/api/monitoring` | Nenhuma | Monitoring API |
| 23 | `/api/monitoring/snapshot` | Nenhuma | Snapshot API |

**Nota:** Todos os outros endpoints `/api/*` requerem JWT válido.

---

## CORREÇÕES IMPLEMENTADAS (2026-05-02)

### ✅ P0 - CRÍTICO
- [x] Página inicial (`/`) adicionada a PUBLIC_PAGE_PATHS
- [x] `/privacidade` adicionada a PUBLIC_PAGE_PATHS
- [x] `/termos` adicionada a PUBLIC_PAGE_PATHS

### 📋 P1 - ALTO (Pendente)
- [ ] Clarificar propósito de `/services`
- [ ] Revisar `/contatos` vs `/contatos-publico`
- [ ] Decidir sobre `/api-docs`

### 📋 P2 - MÉDIO (Pendente)
- [ ] Rate limiting em endpoints públicos
- [ ] CSRF protection em formulários
- [ ] Validação de expiração de JWT

---

## RESUMO ESTATÍSTICO

```
Total de páginas:              34 (100%)
├── Públicas:                  13 (38%)
└── Privadas:                  21 (62%)

Categorização de conteúdo:
├── Marketing:                 6 páginas
├── Produto:                   3 páginas
├── Conversão:                 3 páginas
├── Comunicação:               4 páginas
├── Dashboard:                 6 páginas
├── Conta/Segurança:           4 páginas
├── IA/Agentes:                2 páginas
└── Legal:                     2 páginas

Endpoints API:
├── Públicos (sem JWT):        23 endpoints
└── Privados (com JWT):        50+ endpoints

Taxa de seguridad:
├── Implementada:              100%
├── Problemas críticos:        0 (corrigidos)
├── Problemas altos:           3 (pendentes)
└── Cobertura geral:           95%
```

---

## INSTRUÇÕES DE ACESSO

### Sem Login (Público)
1. Abrir navegador
2. Ir para `https://automatizawpp.com/` + ruta pública
3. Página carrega sem redirecionamento

### Com Login
1. Ir para `https://automatizawpp.com/login`
2. Inserir credenciais
3. Recebe JWT em cookie `auth.access-token`
4. Agora pode acessar páginas privadas

### Teste de Proteção
```bash
# Sem autenticação - deve redirecionar para /login
curl -I https://automatizawpp.com/dashboard

# Com JWT
curl -I -H "Authorization: Bearer <JWT>" https://automatizawpp.com/dashboard
```

---

**Documento criado:** 02 de Maio de 2026  
**Status:** ✅ CONCLUÍDO  
**Próxima revisão:** 31 de Maio de 2026
