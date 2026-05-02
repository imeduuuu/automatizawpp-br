import { Page, expect } from '@playwright/test';

/**
 * Utilitários para testes E2E
 */

/**
 * Faz login no sistema
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
}

/**
 * Faz logout do sistema
 */
export async function logout(page: Page) {
  // Procura por botão de logout
  const logoutButton = page.locator('button:has-text("logout"), button:has-text("sair"), [aria-label*="logout"]');
  
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Aguarda e verifica Lighthouse scores
 */
export async function checkLighthouseScores(page: Page, minScore = 50) {
  // Nota: Lighthouse requer um servidor rodando
  // Este é um placeholder para integração futura
  
  const metrics = await page.evaluate(() => {
    return {
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      lcp: 0, // LCP é mais complexo de medir
      cls: 0, // CLS requer observação contínua
    };
  });

  return metrics;
}

/**
 * Verifica acessibilidade com axe
 */
export async function checkAccessibility(page: Page) {
  // Aqui seria integrada a lib axe-core
  // Por enquanto apenas verificações básicas
  
  const issues = {
    missingAlt: 0,
    missingLabels: 0,
    contrastIssues: 0,
  };

  const images = await page.locator('img:not([alt])').count();
  issues.missingAlt = images;

  return issues;
}

/**
 * Navega e aguarda carregamento completo
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Verifica se há erros no console
 */
export async function checkConsoleErrors(page: Page) {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.waitForTimeout(500);
  
  return errors;
}

/**
 * Tira screenshot para comparação visual
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png` });
}

/**
 * Valida estrutura de tabela
 */
export async function validateTable(page: Page) {
  const table = page.locator('table, [role="table"]');
  
  if (await table.count() === 0) {
    return { valid: false, message: 'Nenhuma tabela encontrada' };
  }

  const rows = page.locator('tbody tr, [role="row"]');
  const rowCount = await rows.count();

  return {
    valid: rowCount > 0,
    message: `Tabela tem ${rowCount} linhas`,
    rowCount,
  };
}

/**
 * Testa formulário completo
 */
export async function testForm(
  page: Page,
  inputs: { selector: string; value: string }[],
  submitSelector = 'button[type="submit"]'
) {
  for (const { selector, value } of inputs) {
    await page.locator(selector).fill(value);
  }

  await page.locator(submitSelector).click();
  await page.waitForLoadState('networkidle');

  const errors = await checkConsoleErrors(page);
  
  return {
    success: errors.length === 0,
    errors,
  };
}
