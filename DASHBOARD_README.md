# Dashboard de Vendas - Documentação

## Resumo

Dashboard completo para clientes finais do AutomatizaWPP. Oferece visualização de leads, métricas de vendas e timeline de conversas em tempo real com atualização automática a cada 30 segundos.

## Estrutura de Arquivos Criada

```
src/
├── app/
│   └── dashboard/
│       └── page.tsx          # Página principal (8.3 KB)
└── components/
    └── dashboard/
        ├── DashboardHeader.tsx       # Header com logo, período, logout
        ├── AnalyticsCards.tsx        # Cards KPI (4 cards)
        ├── DateRangeFilter.tsx       # Seletor de período + Export CSV
        ├── LeadsTable.tsx            # Tabela com sort, paginação
        └── ConversationsTimeline.tsx # Timeline de conversas recentes
```

## Componentes

### DashboardHeader
- Exibe título "Dashboard de Vendas"
- Período selecionado (De - até)
- Botão de logout
- Design: dark mode com accent em green

### AnalyticsCards
4 cards com métricas principais:
1. **Total de Leads** - Total de leads no período
2. **Emails Enviados** - Contagem de conversas via EMAIL
3. **Chamadas Realizadas** - Contagem de conversas via CALL
4. **Taxa de Conversão** - Percentual de leads CLOSED_WON

Cada card tem:
- Ícone representativo
- Valor em grande
- Fundo gradiente com cores específicas por métrica

### DateRangeFilter
- Botões rápidos: 7 dias, 30 dias, 90 dias
- Seletores de data (from/to)
- Botão "Exportar CSV" com download automático

### LeadsTable
- Tabela responsiva com scroll horizontal em mobile
- Colunas: Nome, Email, Telefone, Status, Última Ação, Data Criação
- Sort por clique nos headers (ascendente/descendente)
- Paginação: 10 leads por página
- Status colorido (badges)
- Hover effect nas linhas

### ConversationsTimeline
- Timeline estilo card das 20 conversas mais recentes
- Ícone de canal (Email, WhatsApp, Call, SMS)
- Informações do lead (nome, empresa, telefone)
- Última mensagem (truncada com line-clamp-2)
- Data/hora da última interação
- Indicador de conversa fechada (check icon)

## Endpoints Consumidos

### `/api/leads`
```
GET /api/leads?limit=100&status=ALL
Response: { leads: Lead[], total: number }
```

### `/api/conversations`
```
GET /api/conversations
Response: { conversations: Conversation[], total: number }
```

### `/api/ops/efficiency`
```
GET /api/ops/efficiency?days=30
Response: { responseQuality, nbaAccuracy, ... }
```

## Autenticação

### Token via URL
```
/dashboard?token=eyJhbGciOiJIUzI1NiIs...
```

O token é:
1. Extraído da URL
2. Salvo em localStorage
3. Removido da URL para segurança

Requisições usam header:
```
Authorization: Bearer <token>
```

### Token via localStorage
Se não houver token na URL, a página tenta recuperar de:
```
localStorage.getItem('dashboard_token')
```

Se não existir, redireciona para `/login`

## Funcionalidades

### Polling Automático
- Atualiza dados a cada 30 segundos
- Executa em background
- Limpo ao desmontar componente

### Filtros
- **Status**: Todos, Novo, Engajado, Qualificado, Fechado (Ganho), Fechado (Perdido)
- **Busca**: Por nome, email ou telefone (case-insensitive)
- Filtros aplicados em tempo real

### Export CSV
- Inclui todas as colunas visíveis
- Nome de arquivo: `leads_YYYY-MM-DD.csv`
- Download automático
- Trata valores vazios como "-"

### Responsividade
- Mobile: Stack vertical, inputs em coluna
- Tablet: Layout adaptado
- Desktop: Layout completo

## Design

### Paleta de Cores
```css
--bg: #060606              (fundo principal)
--surface: #0d0d0d         (surface secundária)
--text: #f0ede8            (texto principal)
--green: #25D366           (accent - AutomatizaWPP)
```

### Componentes UI
- Buttons: `px-4 py-2 bg-green-600 hover:bg-green-700`
- Inputs: `bg-gray-800 border-gray-700 focus:ring-green-500`
- Cards: `bg-gray-800/50 border-gray-700 rounded-lg`
- Badges: Status com cores específicas

### Tipografia
- Font: Manrope (já importada em globals.css)
- Sizes: 3xl (headers), lg (subtítulos), sm (labels)
- Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## Estados de Loading

### Página Inicial
Mostra "Carregando..." em gray-400 enquanto busca token

### Tabelas Vazias
- Loading: "Carregando leads..."
- Vazio: "Nenhum lead encontrado"

### Conversas
- Vazio: "Nenhuma conversa para exibir"

## Exemplo de Uso

### Acesso via Token URL
```
https://automatizawpp.com/dashboard?token=abc123...
```

### Acesso via Login
1. Usuário faz login em `/login`
2. Token salvo em localStorage
3. Redireciona para `/dashboard`

### Logout
Clica no botão "Sair" no header
- Remove token de localStorage
- Redireciona para `/login`

## Dependências

Componentes utilizam:
- `next/router` para navegação e query params
- `lucide-react` para ícones
- `react` hooks (useState, useEffect, useCallback, useRef)
- Tailwind CSS para styling

## Notas de Desenvolvimento

### Otimizações
- Memoização com `useCallback` para `fetchData`
- Cleanup de intervals no useEffect
- Validação de token antes de requisições

### Tratamento de Erros
- Try/catch em fetch
- Logs em console.error
- UI gracefully degrada

### Performance
- Paginação limita renderização (10 items)
- Slice de conversas (20 máximo)
- Filtragem em memory (< 1000 leads)

## Deploy

1. Build: `npm run build`
2. Start: `npm start`
3. Ou deploy em Vercel/DO com CI/CD

Arquivo está pronto para produção.

## TODO Futuro

- [ ] Filtro por score de lead
- [ ] Gráficos de KPI (chart.js)
- [ ] Detalhes de lead (modal)
- [ ] Ações rápidas (SMS, call, email)
- [ ] Relatórios em PDF
- [ ] Dark/Light mode toggle
- [ ] Multi-idioma (i18n)
