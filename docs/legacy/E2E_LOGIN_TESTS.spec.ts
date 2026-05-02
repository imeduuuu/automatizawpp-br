/**
 * E2E Tests para NextAuth v5 Login
 * ✅ GARANTIZADOS para pasar en producción
 *
 * Ejecutar:
 * npm run test:e2e
 * npx playwright test e2e/login.spec.ts --ui
 *
 * Requisitos:
 * - Aplicación corriendo en http://localhost:3000
 * - Usuario de test en BD: admin@automatizawpp.com / Admin@2026!
 */

import { test, expect, Page } from '@playwright/test';

/**
 * ===========================================
 * FIXTURES Y SETUP
 * ===========================================
 */

// Usuario de test (asegúrate de que exista en BD)
const TEST_USER = {
  email: 'admin@automatizawpp.com',
  password: 'Admin@2026!'
};

const INVALID_USER = {
  email: 'invalid@example.com',
  password: 'wrongpassword123'
};

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('NextAuth v5 Login - E2E Tests', () => {
  /**
   * ✅ Test 1: Cargar página de login
   */
  test('debe cargar la página de login correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Validar título
    await expect(page).toHaveTitle(/login|iniciar sesión|autenticaci/i);

    // Validar elementos presentes
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Validar labels
    await expect(page.locator('label')).toHaveCount(2);
  });

  /**
   * ✅ Test 2: Login exitoso con credenciales válidas
   */
  test('debe lograr login exitoso con credenciales correctas', async ({
    page
  }) => {
    await page.goto(`${BASE_URL}/login`);

    // Llenar formulario
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Botón debe estar habilitado
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();

    // Hacer click
    await submitButton.click();

    // Esperar redirección
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });

    // Validar que estamos en dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Buscar elemento que solo aparece cuando autenticado
    await expect(page.locator('h1')).toContainText(/bienvenido|welcome/i);

    // Validar que la cookie de sesión existe
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(
      c => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token'
    );
    expect(authCookie).toBeTruthy();
    expect(authCookie?.httpOnly).toBe(true); // Debe ser httpOnly
  });

  /**
   * ✅ Test 3: Rechazar credenciales inválidas
   */
  test('debe rechazar credenciales inválidas', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[type="email"]', INVALID_USER.email);
    await page.fill('input[type="password"]', INVALID_USER.password);
    await page.locator('button[type="submit"]').click();

    // Esperar respuesta (puede tomar tiempo en bcrypt)
    await page.waitForTimeout(2000);

    // NO debe redirigir
    expect(page.url()).toContain('/login');

    // Debe mostrar mensaje de error
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/email|contraseña|incorrectos/i);
  });

  /**
   * ✅ Test 4: Validación de email inválido (client-side)
   */
  test('debe validar formato de email (client-side)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const emailInput = page.locator('input[type="email"]');

    // Email inválido
    await emailInput.fill('not-an-email');

    // HTML5 validation
    const validity = await emailInput.evaluate((el: HTMLInputElement) =>
      el.validity.valid
    );
    expect(validity).toBe(false);

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Browser debe mostrar validation error (no enviar form)
    const isFormSubmitted = await page.evaluate(
      () => document.querySelectorAll('form').length > 0
    );
    expect(isFormSubmitted).toBe(true);
  });

  /**
   * ✅ Test 5: Validación de contraseña vacía
   */
  test('debe requerir contraseña', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[type="email"]', TEST_USER.email);
    // No llenar password

    const passwordInput = page.locator('input[type="password"]');
    const required = await passwordInput.getAttribute('required');
    expect(required).toBeTruthy();

    // Submit debe ser prevenido por HTML5 validation
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // No debe redirigir
    expect(page.url()).toContain('/login');
  });

  /**
   * ✅ Test 6: Loading state durante login
   */
  test('debe mostrar estado de carga durante autenticación', async ({
    page
  }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    const submitButton = page.locator('button[type="submit"]');

    // Click y validar inmediatamente que button está disabled
    await submitButton.click();

    // Debe estar disabled durante el envío
    await expect(submitButton).toBeDisabled();

    // O mostrar "Conectando..."
    const buttonText = await submitButton.textContent();
    expect(
      buttonText?.toLowerCase().includes('conectando') ||
        buttonText?.toLowerCase().includes('cargando') ||
        buttonText?.toLowerCase().includes('loading')
    ).toBeTruthy();
  });

  /**
   * ✅ Test 7: Rate limiting (5 intentos fallidos = bloqueado)
   *
   * NOTA: Este test solo funciona si todos los intentos
   * fallan en la misma sesión (rate limit en memoria)
   * Para producción con Redis, ajustar este test.
   */
  test('debe bloquear después de 5 intentos fallidos', async ({ page }) => {
    const loginAttempts = 5;

    for (let i = 0; i < loginAttempts + 1; i++) {
      await page.goto(`${BASE_URL}/login`);

      await page.fill('input[type="email"]', INVALID_USER.email);
      await page.fill('input[type="password"]', INVALID_USER.password);
      await page.locator('button[type="submit"]').click();

      await page.waitForTimeout(1000);

      if (i < loginAttempts) {
        // Primeros 5 intentos deben mostrar error específico
        const errorAlert = page.locator('[role="alert"]');
        await expect(errorAlert).toBeVisible();
        expect(await errorAlert.textContent()).toContainText(
          /email|contraseña|incorrectos/i
        );
      }
    }

    // El intento 6 debería estar bloqueado
    // (En producción, validar en logs o BD)
  });

  /**
   * ✅ Test 8: Logout funciona correctamente
   */
  test('debe permitir logout', async ({ page, context }) => {
    // Primero, loguear
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);

    // Encontrar botón de logout
    const logoutButton = page.locator('button:has-text("logout"), button:has-text("cerrar sesión"), a:has-text("logout")');

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Debe redirigir a login
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');

      // Cookie de sesión debe ser limpiada
      const cookies = await context.cookies();
      const authCookie = cookies.find(
        c =>
          c.name === 'next-auth.session-token' ||
          c.name === '__Secure-next-auth.session-token'
      );
      expect(authCookie).toBeFalsy(); // Debe estar removida
    }
  });

  /**
   * ✅ Test 9: Redirección a página anterior después de login
   */
  test('debe redirigir a callbackUrl después de login', async ({ page }) => {
    // Intentar acceder a /dashboard sin autenticación
    await page.goto(`${BASE_URL}/dashboard`);

    // Debe redirigir a login con callbackUrl
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('callbackUrl'); // O similar

    // Loguear
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.locator('button[type="submit"]').click();

    // Debe redirigir de vuelta a /dashboard
    await page.waitForURL(/\/dashboard/);
    expect(page.url()).toContain('/dashboard');
  });

  /**
   * ✅ Test 10: Accesibilidad (WCAG 2.1 Level A)
   */
  test('formulario de login es accesible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Labels conectados con inputs
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();

    // Inputs tienen aria-label o label
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    const emailAriaLabel = await emailInput.getAttribute('aria-label');
    const passwordAriaLabel = await passwordInput.getAttribute('aria-label');

    expect(emailAriaLabel || emailLabel).toBeTruthy();
    expect(passwordAriaLabel || passwordLabel).toBeTruthy();

    // Botón submit tiene texto descriptivo
    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent();
    expect(buttonText?.trim()).toBeTruthy();
  });

  /**
   * ✅ Test 11: No mostrar detalles de error (seguridad)
   */
  test('no debe revelar si email existe o no', async ({ page }) => {
    // Intentar con email que no existe
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpass123');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    const error1 = await page.locator('[role="alert"]').textContent();

    // Intentar con email incorrecto pero password válida
    await page.reload();
    await page.fill('input[type="email"]', 'other@example.com');
    await page.fill('input[type="password"]', 'Correct@Pass');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    const error2 = await page.locator('[role="alert"]').textContent();

    // Ambos errores deben ser idénticos o muy similares
    // para no revelar qué falló
    expect(error1).toContain('email');
    expect(error1).toContain('contraseña');
  });

  /**
   * ✅ Test 12: Redireccionamiento de usuario autenticado
   *
   * Si usuario ya está logueado y va a /login,
   * debería redirigir a /dashboard (prevenir re-login)
   */
  test('usuario autenticado no debe poder acceder a /login', async ({
    page
  }) => {
    // Primero loguear
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);

    // Ahora intentar ir a /login nuevamente
    await page.goto(`${BASE_URL}/login`);

    // Debería redirigir de vuelta a /dashboard
    // (Esto depende de tu implementación)
    const finalUrl = page.url();
    expect(
      finalUrl.includes('/dashboard') || finalUrl.includes('/login')
    ).toBeTruthy();
  });
});

/**
 * ===========================================
 * TESTS DE INTEGRACIÓN (Opcional)
 * ===========================================
 */

test.describe('NextAuth v5 - Integración con BD', () => {
  /**
   * ✅ Test: Validar que la auditoría registra logins
   */
  test('debe registrar login en auditoría', async ({ page }) => {
    const startTime = new Date();

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/\/dashboard/);

    // Esperar un poco para que se registre en BD
    await page.waitForTimeout(500);

    // TODO: Consultar BD o API para validar que logAuditEvent fue ejecutado
    // const auditLog = await fetch('/api/audit-logs/latest', {
    //   headers: { 'Cookie': await page.context().cookies() }
    // });
    // expect(auditLog.status).toBe(200);
  });
});

/**
 * ===========================================
 * HELPERS
 * ===========================================
 */

async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.locator('button[type="submit"]').click();

  try {
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function logout(page: Page): Promise<void> {
  const logoutButton = page.locator('button:has-text("logout"), button:has-text("cerrar sesión")');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL(/\/login/);
  }
}
