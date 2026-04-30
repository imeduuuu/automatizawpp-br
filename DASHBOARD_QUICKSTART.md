# Dashboard - Quick Start Guide

## Acesso

### 1. Via URL com Token
```
https://automatizawpp.com/dashboard?token=seu_token_aqui
```

O token será automaticamente:
- Extraído da URL
- Salvo em localStorage
- Removido da URL (para segurança)

### 2. Via Login
Se o usuário fizer login em `/login`, o token é salvo e ele acessa o dashboard direto.

## Funcionalidades

### Métricas (Cards no topo)
- **Total de Leads** - Conta todos os leads do período
- **Emails Enviados** - Conversas via EMAIL
- **Chamadas Realizadas** - Conversas via CALL
- **Taxa de Conversão** - % de leads fechados

### Período
Clique em **7 dias**, **30 dias** ou **90 dias** para atalho, ou selecione datas customizadas.

### Filtros
**Status**: Todos, Novo, Engajado, Qualificado, Fechado (Ganho), Fechado (Perdido)
**Busca**: Digite nome, email ou telefone

### Tabela de Leads
- Clique no header para **ordenar** (seta mostra direção)
- **Paginação** de 10 leads por página
- **Status colorido** para visualização rápida
- **Hover** nas linhas para destaque

### Timeline de Conversas
- 20 conversas recentes
- Ícone mostra o **canal** (email, WhatsApp, telefone, SMS)
- **Último membro** exibe quem foi o último a falar
- **Check verde** = conversa fechada

### Exportar
Clique em **"Exportar CSV"** para baixar leads filtrados em Excel.

## Dados Atualizados
Os dados são atualizados automaticamente a cada **30 segundos**. Você não precisa fazer nada - os cards, tabela e timeline se atualizam sozinhos.

## Logout
Clique no botão **"Sair"** no topo direito para limpar o token e voltar ao login.

## Mobile
Todos os elementos se adaptam para celular:
- Inputs em coluna em mobile
- Tabela com scroll horizontal
- Cards empilhados

## Suporte

Se algum dos dados não carregar:
1. Verifique o token está válido
2. Verifique a conexão de internet
3. Abra o console (F12) para ver erros
4. Refresque a página

Consulte `/DASHBOARD_README.md` para documentação técnica completa.
