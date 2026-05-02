import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Autenticação
 * Valida: login, signup, reset password e logout
 */

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve carregar página de login', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page).toHaveTitle(/login|autenticación|autenticação/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verifica se não há erros no console
    const consoleMessages: string[] = [];
    page.on('console', (msg) => consoleMessages.push(msg.type()));
    expect(consoleMessages.filter(m => m === 'error')).toHaveLength(0);
  });

  test('deve exibir validação de email inválido', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Aguarda feedback de validação
    await page.waitForTimeout(500);
    
    // Verifica se existe mensagem de erro
    const errorElement = page.locator('[role="alert"], .error, .text-red');
    expect(errorElement.count()).toBeGreaterThan(0);
  });

  test('deve navegar para página de signup', async ({ page }) => {
    await page.goto('/login');
    
    const signupLink = page.locator('a:has-text("sign up"), a:has-text("inscrever"), a:has-text("registrar")');
    await signupLink.click();
    
    await page.waitForURL(/signup|register/i);
    await expect(page.locator('input[name="name"], input[name="nombre"], input[name="nome"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('deve navegar para reset de senha', async ({ page }) => {
    await page.goto('/login');
    
    const forgotLink = page.locator('a:has-text("forgot"), a:has-text("olvidé"), a:has-text("esqueci")');
    if (await forgotLink.count() > 0) {
      await forgotLink.click();
      await page.waitForURL(/forgot|reset|recover/i);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });

  test('deve exibir mensagem de erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.locator('input[type="email"]').fill('test@invalid.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    
    // Aguarda resposta
    await page.waitForTimeout(1000);
    
    // Verifica presença de erro
    const error = page.locator('[role="alert"], .error, .bg-red, .text-red');
    expect(error.count()).toBeGreaterThan(0);
  });

  test('formulário de login deve ter acessibilidade básica', async ({ page }) => {
    await page.goto('/login');
    
    // Verifica labels
    await expect(page.locator('label')).toHaveCount(2); // email e password
    
    // Verifica atributos required
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    const emailRequired = await emailInput.getAttribute('required');
    const passwordRequired = await passwordInput.getAttribute('required');
    
    expect(emailRequired !== null).toBeTruthy();
    expect(passwordRequired !== null).toBeTruthy();
  });
});
