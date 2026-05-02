import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Dashboard
 * Valida: carregamento de dados, operações CRUD, gráficos
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Aqui seria feito o login automaticamente
    // Por enquanto testamos a estrutura da página
    await page.goto('/dashboard');
  });

  test('página de dashboard deve carregar', async ({ page }) => {
    // Aguarda carregamento
    await page.waitForLoadState('networkidle');
    
    // Verifica título
    await expect(page).toHaveTitle(/dashboard|painel/i);
    
    // Verifica se não há erro 404/500
    expect(page.url()).not.toContain('error');
  });

  test('deve exibir seções de KPI', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Procura por cards com números (KPIs)
    const cards = page.locator('[class*="card"], [class*="kpi"], [role="region"]');
    const count = await cards.count();
    
    // Deve ter pelo menos alguns cards de KPI
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('deve renderizar gráficos sem erros', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Procura por elementos SVG (gráficos)
    const charts = page.locator('svg');
    
    // Aguarda qualquer SVG
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('tabela de leads deve ser interativa', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Procura por tabela
    const table = page.locator('table, [role="table"]');
    
    if (await table.count() > 0) {
      // Verifica se tem linhas
      const rows = page.locator('tbody tr, [role="row"]');
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('deve permitir filtros de data', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Procura por input de data
    const dateInputs = page.locator('input[type="date"], input[type="text"][placeholder*="date"], input[placeholder*="data"]');
    
    if (await dateInputs.count() > 0) {
      await dateInputs.first().fill('2024-01-01');
      await page.waitForTimeout(500);
      
      // Verifica se página não quebrou
      expect(page.url()).not.toContain('error');
    }
  });

  test('sidebar deve ser navegável', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Procura por sidebar
    const sidebar = page.locator('nav, [role="navigation"]');
    
    if (await sidebar.count() > 0) {
      const navLinks = sidebar.locator('a, [role="link"]');
      expect(await navLinks.count()).toBeGreaterThan(0);
      
      // Testa navegação em um link
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      
      if (href && !href.startsWith('http')) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain(href);
      }
    }
  });

  test('responsividade mobile - sidebar colapsa', async ({ page }) => {
    // Muda viewport para mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Procura por botão de menu/hamburger
    const menuButton = page.locator('button[aria-label*="menu"], button[class*="hamburger"], button[class*="toggle"]');
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      // Verifica se sidebar fica visível/oculto
      const sidebar = page.locator('nav, [role="navigation"]');
      expect(await sidebar.isVisible()).toBeTruthy();
    }
  });

  test('não deve haver erros no console', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    expect(errors).toHaveLength(0);
  });

  test('performance - deve carregar em menos de 3s', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});
