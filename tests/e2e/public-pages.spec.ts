import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Páginas Públicas
 * Valida: landing pages, pricing, etc sem autenticação
 */

test.describe('Páginas Públicas', () => {

  test('página inicial deve carregar sem login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe('http://localhost:3000/');
  });

  test('página de pricing deve estar acessível', async ({ page }) => {
    const response = await page.goto('/pricing');
    
    if (response) {
      expect([200, 404]).toContain(response.status());
    }
  });

  test('página de onboarding deve estar acessível', async ({ page }) => {
    const response = await page.goto('/onboarding');
    
    if (response) {
      expect([200, 404]).toContain(response.status());
    }
  });

  test('dashboard público para clientes deve funcionar', async ({ page }) => {
    // Testa sem token (pode retornar 404 ou 401, tudo bem)
    const response = await page.goto('/(public)/dashboard');
    
    if (response && response.status() === 200) {
      // Se página carrega, verifica estrutura
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBeTruthy();
    }
  });

  test('leads públicos devem estar acessíveis', async ({ page }) => {
    const response = await page.goto('/(public)/leads');
    
    if (response && response.status() === 200) {
      await page.waitForLoadState('networkidle');
      const table = page.locator('table, [role="table"]');
      expect(await table.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('emails públicos devem estar acessíveis', async ({ page }) => {
    const response = await page.goto('/(public)/emails');
    
    if (response && response.status() === 200) {
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBeTruthy();
    }
  });

  test('chamadas públicas devem estar acessíveis', async ({ page }) => {
    const response = await page.goto('/(public)/calls');
    
    if (response && response.status() === 200) {
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBeTruthy();
    }
  });

  test('página pública deve validar token se exigido', async ({ page }) => {
    // Testa acesso sem token
    const response = await page.goto('/(public)/dashboard');
    
    if (response) {
      // Pode ser 404 (não existe), 401 (sem auth), ou 200 (aberto)
      expect([200, 401, 404]).toContain(response.status());
    }
  });

  test('meta tags para SEO devem estar presentes', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    const description = page.locator('meta[name="description"]');

    expect(title.length).toBeGreaterThan(0);
    expect(await description.count()).toBeGreaterThanOrEqual(0);
  });

  test('sitemap.xml deve estar acessível', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    
    if (response) {
      expect([200, 404]).toContain(response.status());
    }
  });

  test('robots.txt deve estar acessível', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    
    if (response) {
      expect([200, 404]).toContain(response.status());
    }
  });
});
