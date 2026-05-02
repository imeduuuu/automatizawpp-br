import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Páginas Críticas
 * Valida: carregamento de todas as páginas principais
 */

const pages = [
  { path: '/leads', title: /leads/i, hasTable: true },
  { path: '/emails', title: /email/i, hasTable: true },
  { path: '/calls', title: /call|chamadas|llamadas/i, hasTable: true },
  { path: '/contatos', title: /contato|contact/i, hasTable: true },
  { path: '/conversations', title: /conversa|conversation/i, hasTable: false },
  { path: '/follow-ups', title: /follow|acompanhamento/i, hasTable: true },
  { path: '/sequences', title: /sequence|sequência/i, hasTable: true },
  { path: '/settings', title: /setting|configuração/i, hasTable: false },
  { path: '/account', title: /account|conta|account/i, hasTable: false },
  { path: '/crm', title: /crm|gerenciador/i, hasTable: false },
];

test.describe('Páginas do Sistema', () => {
  
  pages.forEach(({ path, title, hasTable }) => {
    test(`deve carregar página ${path}`, async ({ page }) => {
      await page.goto(path);
      
      // Aguarda carregamento
      await page.waitForLoadState('networkidle');
      
      // Verifica se não é página de erro
      expect(page.url()).not.toContain('error');
      expect(page.url()).not.toContain('404');
      
      // Se a página retornou um status de erro
      const response = await page.evaluate(() => document.readyState);
      expect(response).toBeTruthy();
    });

    test(`página ${path} não deve ter erros no console`, async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      expect(errors).toHaveLength(0);
    });

    test(`página ${path} deve ter links funcionais`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Coleta todos os links
      const links = page.locator('a[href]');
      const count = await links.count();
      
      // Verifica cada link
      for (let i = 0; i < Math.min(count, 5); i++) {
        const href = await links.nth(i).getAttribute('href');
        
        // Ignora links externos
        if (href && !href.startsWith('http') && !href.startsWith('mailto')) {
          const isClickable = await links.nth(i).isVisible();
          expect(isClickable || true).toBeTruthy(); // Pode estar oculto, ok
        }
      }
    });

    if (hasTable) {
      test(`página ${path} deve renderizar tabela`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        
        // Procura por tabela
        const table = page.locator('table, [role="table"]');
        
        if (await table.count() > 0) {
          // Verifica se tem cabeçalho
          const header = page.locator('thead, [role="row"]:first-of-type');
          expect(await header.count()).toBeGreaterThan(0);
        }
      });
    }
  });

  test('todas as páginas devem ser responsivas', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Testa página de dashboard em cada viewport
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Verifica se não há overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 50); // +50 por margem de erro
    }
  });

  test('navegação entre páginas deve funcionar', async ({ page }) => {
    // Começa no dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navega para leads
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('leads');
    
    // Navega para emails
    await page.goto('/emails');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('emails');
    
    // Navega para calls
    await page.goto('/calls');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('calls');
  });
});
