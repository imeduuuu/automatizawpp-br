# Guia de Testes - AutomatizaWPP Sales OS

## Visão Geral

Este projeto utiliza:
- **Playwright** para testes E2E (end-to-end)
- **Jest** para testes unitários
- **TypeScript** para melhor type-safety

## Estrutura

```
tests/
├── e2e/                    # Testes end-to-end
│   ├── auth.spec.ts       # Autenticação
│   ├── dashboard.spec.ts  # Dashboard
│   ├── pages.spec.ts      # Validação de páginas
│   ├── api.spec.ts        # Endpoints de API
│   ├── performance.spec.ts # Performance
│   ├── accessibility.spec.ts # Acessibilidade
│   ├── critical-workflows.spec.ts # Fluxos críticos
│   ├── public-pages.spec.ts # Páginas públicas
│   └── utils.ts           # Utilitários compartilhados
├── unit/                  # Testes unitários
│   └── example.test.ts    # Exemplo de teste unitário
├── .gitignore
└── README.md

playwright.config.ts       # Configuração Playwright
jest.config.js            # Configuração Jest
jest.setup.js             # Setup Jest
```

## Como Executar

### Testes Unitários

```bash
# Executar todos os testes unitários
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Com cobertura
npm run test:coverage

# Arquivo específico
npm test tests/unit/example.test.ts
```

### Testes E2E

```bash
# Executar todos os testes E2E
npm run test:e2e

# Interface gráfica (mais fácil de debugar)
npm run test:e2e:ui

# Modo headed (vê o navegador rodando)
npm run test:e2e:headed

# Debugar passo a passo
npm run test:e2e:debug

# Arquivo específico
npx playwright test tests/e2e/auth.spec.ts

# Tag específica
npx playwright test --grep @auth

# Navegador específico
npx playwright test --project=firefox
```

### Execução Completa

```bash
# Tudo junto (unitário + e2e)
npm test && npm run test:e2e
```

## Suites de Teste

### 1. Autenticação (`auth.spec.ts`)
- Login com credenciais válidas/inválidas
- Registro de novo usuário
- Reset de senha
- Validação de formulários
- Logout

**Status**: ✓ Implementado
**Tempo estimado**: 2-3 minutos

### 2. Dashboard (`dashboard.spec.ts`)
- Carregamento de página
- Renderização de KPIs
- Gráficos e dados
- Tabelas interativas
- Filtros
- Sidebar navegável
- Responsividade mobile
- Performance

**Status**: ✓ Implementado
**Tempo estimado**: 3-4 minutos

### 3. Páginas do Sistema (`pages.spec.ts`)
Valida 10+ páginas:
- /leads - Gerenciamento de leads
- /emails - Email templates/histórico
- /calls - Registro de chamadas
- /contatos - Contatos
- /conversations - Conversas
- /follow-ups - Acompanhamentos
- /sequences - Sequências
- /settings - Configurações
- /account - Conta
- /crm - CRM

**Status**: ✓ Implementado
**Tempo estimado**: 4-5 minutos

### 4. API Endpoints (`api.spec.ts`)
- GET /api/leads
- GET /api/emails
- GET /api/calls
- Status codes corretos
- Content-Type JSON
- Tempo de resposta (<1s)

**Status**: ✓ Implementado
**Tempo estimado**: 1-2 minutos

### 5. Performance (`performance.spec.ts`)
- Tempo de carregamento (<3-4s)
- Web Vitals (FCP, LCP, CLS)
- Otimização de imagens
- Cache de assets
- Minimização de CSS/JS

**Status**: ✓ Implementado
**Tempo estimado**: 2-3 minutos

### 6. Acessibilidade (`accessibility.spec.ts`)
- Contraste de cores
- Labels em inputs
- Navegação por teclado
- Hierarquia de headings
- Alt text em imagens
- Links descritivos
- ARIA labels

**Status**: ✓ Implementado
**Tempo estimado**: 2-3 minutos

### 7. Fluxos Críticos (`critical-workflows.spec.ts`)
- Criação de lead (E2E)
- Envio de email (E2E)
- Logging de chamada (E2E)
- Filtro e busca
- Exportação de dados
- Responsividade mobile

**Status**: ✓ Implementado
**Tempo estimado**: 3-4 minutos

### 8. Páginas Públicas (`public-pages.spec.ts`)
- Página inicial
- Pricing
- Onboarding
- Dashboard público
- Leads/Emails/Calls públicos
- Meta tags SEO
- Sitemap e robots.txt

**Status**: ✓ Implementado
**Tempo estimado**: 2-3 minutos

## Resultados Esperados

Após executar `npm run test:e2e`:

```
✓ auth.spec.ts (6 testes)
✓ dashboard.spec.ts (9 testes)
✓ pages.spec.ts (15+ testes)
✓ api.spec.ts (6 testes)
✓ performance.spec.ts (7 testes)
✓ accessibility.spec.ts (9 testes)
✓ critical-workflows.spec.ts (7 testes)
✓ public-pages.spec.ts (10 testes)

Total: 60+ testes
Tempo total: ~25-30 minutos
Cobertura esperada: 70%+
```

## Cobertura

Para gerar relatório de cobertura:

```bash
npm run test:coverage
```

Relatório será salvo em `coverage/`

## CI/CD Integration

Para integração com GitHub Actions (exemplo):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## Debugging

### Playwright

```bash
# Com debugger integrado
npm run test:e2e:debug

# Gera trace para análise
npx playwright test --trace on

# Vê relatório HTML
npx playwright show-report
```

### Jest

```bash
# Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Verbose output
npm test -- --verbose
```

## Próximos Passos

1. **Integração com CI/CD** - Configurar GitHub Actions
2. **Visual Regression Testing** - Adicionar `@axe-core` para acessibilidade
3. **Performance Monitoring** - Integrar Lighthouse CI
4. **E-mail Testing** - Adicionar testes para fluxos de email
5. **Mobile App Testing** - Estender para app móvel
6. **Load Testing** - Adicionar k6 para testes de carga

## Troubleshooting

### Erro: "playwright browsers not installed"
```bash
npx playwright install
```

### Erro: "Port 3000 already in use"
```bash
lsof -i :3000
kill -9 <PID>
```

### Slow tests
- Aumente timeout em `playwright.config.ts`
- Use `--headed` para debugar visualmente
- Reduza `waitForTimeout` onde possível

## Recursos

- [Playwright Docs](https://playwright.dev)
- [Jest Docs](https://jestjs.io)
- [WCAG 2.1 Accessibility](https://www.w3.org/WAI/WCAG21/quickref)
- [Web Vitals](https://web.dev/vitals)

---

**Última atualização**: 2024-05-01
**Versão**: 1.0
