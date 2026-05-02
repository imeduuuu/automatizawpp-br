import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração Playwright E2E Testing para AutomatizaWPP Sales OS
 * Testes end-to-end para validação de todas as páginas e fluxos críticos
 */

export default defineConfig({
  testDir: './tests/e2e',

  /* Tempo máximo por teste (ms) */
  timeout: 30 * 1000,

  /* Tempo máximo para todos os testes (ms) */
  globalTimeout: 30 * 60 * 1000,

  /* Configurações gerais */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  /* Configurações de reporte */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ['list'],
  ],

  /* Configurações de run */
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projetos para browsers principais */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
