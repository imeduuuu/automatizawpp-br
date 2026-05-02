import { describe, it, expect } from '@jest/globals';

/**
 * Testes Unitários - Exemplo
 * Este arquivo serve como template para testes unitários
 */

describe('Exemplo de Teste Unitário', () => {
  it('deve somar dois números', () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(2, 3)).toBe(5);
  });

  it('deve validar email', () => {
    const isValidEmail = (email: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  it('deve formatar data corretamente', () => {
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const date = new Date('2024-01-15');
    expect(formatDate(date)).toMatch(/2024-01-15/);
  });
});
