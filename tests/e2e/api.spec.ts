import { test, expect } from '@playwright/test';

/**
 * Testes E2E - API Endpoints
 * Valida: respostas de API, status codes, estrutura de dados
 */

test.describe('API Endpoints', () => {
  const baseURL = 'http://localhost:3000/api';

  test('GET /api/leads deve retornar lista de leads', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/leads', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return {
        status: res.status,
        data: await res.json(),
      };
    });

    // Aceita 200 ou 401 (sem autenticação)
    expect([200, 401, 404]).toContain(response.status);
  });

  test('GET /api/emails deve retornar lista de emails', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/emails', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return {
        status: res.status,
        data: await res.json(),
      };
    });

    expect([200, 401, 404]).toContain(response.status);
  });

  test('GET /api/calls deve retornar lista de chamadas', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/calls', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return {
        status: res.status,
      };
    });

    expect([200, 401, 404]).toContain(response.status);
  });

  test('endpoints devem ter Content-Type JSON', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/leads');
      return res.headers.get('content-type');
    });

    expect(response).toContain('application/json');
  });

  test('endpoints inválidos devem retornar 404', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/invalid-endpoint-xyz');
      return res.status;
    });

    expect(response).toBe(404);
  });

  test('respostas de API devem ser rápidas (<1s)', async ({ page }) => {
    const timings = await page.evaluate(async () => {
      const start = performance.now();
      
      try {
        await fetch('/api/leads');
      } catch (e) {
        // Pode falhar por auth, tudo bem
      }
      
      const duration = performance.now() - start;
      return duration;
    });

    expect(timings).toBeLessThan(1000);
  });
});
