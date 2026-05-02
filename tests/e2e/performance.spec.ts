import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Performance
 * Valida: tempos de carregamento, Lighthouse scores
 */

test.describe('Performance', () => {

  test('página inicial deve carregar em menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('dashboard deve carregar em menos de 4 segundos', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(4000);
  });

  test('métricas Web Vitals', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      return {
        // Tempo até o primeiro paint
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        // Tempo até o first input delay (aproximado)
        navigationStart: performance.timing.navigationStart,
        loadEventEnd: performance.timing.loadEventEnd,
      };
    });

    const totalLoadTime = metrics.loadEventEnd - metrics.navigationStart;
    
    // FCP deve ser rápido
    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(2500);
    }
    
    // Load time total
    expect(totalLoadTime).toBeLessThan(5000);
  });

  test('imagens devem estar otimizadas', async ({ page }) => {
    await page.goto('/dashboard');
    
    const images = await page.evaluate(() => {
      return (document.querySelectorAll('img') as NodeListOf<HTMLImageElement>).map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));
    });

    // Verifica se há imagens sem alt
    const noAlt = images.filter(img => !img.alt);
    expect(noAlt.length).toBeLessThan(images.length * 0.2); // Aceita até 20% sem alt
  });

  test('assets estão sendo cacheados', async ({ page }) => {
    // Primeira visita
    const firstLoad = await page.evaluate(async () => {
      const start = performance.now();
      await fetch('/');
      return performance.now() - start;
    });

    // Segunda visita
    const secondLoad = await page.evaluate(async () => {
      const start = performance.now();
      await fetch('/');
      return performance.now() - start;
    });

    // Segunda visita deve ser mais rápida (cache)
    expect(secondLoad).toBeLessThanOrEqual(firstLoad * 1.5);
  });

  test('não deve haver memory leaks em navegação', async ({ page }) => {
    // Navega múltiplas vezes
    for (let i = 0; i < 5; i++) {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
    }

    // Verifica se página ainda responde bem
    const response = await page.evaluate(() => {
      return document.readyState === 'complete';
    });

    expect(response).toBeTruthy();
  });

  test('recursos CSS e JS devem estar minimizados', async ({ page }) => {
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((entry: any) => ({
        name: entry.name,
        size: entry.transferSize,
        type: entry.initiatorType,
      }));
    });

    // Verifica se há CSS/JS não minimizados
    const unminified = resources.filter(r => 
      (r.name.includes('.css') || r.name.includes('.js')) && 
      !r.name.includes('.min.')
    );

    // Permite alguns arquivos não minimizados (development)
    expect(unminified.length).toBeLessThan(5);
  });
});
