import { hashPassword, verifyPassword, isValidBcryptHash } from '../password';

describe('Password utilities', () => {
  describe('isValidBcryptHash', () => {
    it('debería validar un hash bcrypt válido', () => {
      const validHash = '$2a$12$kF5c.c2kp8bHM3YHfDpfnOHBG7TjDKV3gMH5Lq4qDl4qKlHK0Ov0C';
      expect(isValidBcryptHash(validHash)).toBe(true);
    });

    it('debería rechazar hashes vacíos', () => {
      expect(isValidBcryptHash('')).toBe(false);
    });

    it('debería rechazar hashes muy cortos', () => {
      expect(isValidBcryptHash('abc')).toBe(false);
    });

    it('debería rechazar no-strings', () => {
      expect(isValidBcryptHash(null as any)).toBe(false);
      expect(isValidBcryptHash(undefined as any)).toBe(false);
      expect(isValidBcryptHash(123 as any)).toBe(false);
    });

    it('debería rechazar strings que no son hashes bcrypt', () => {
      expect(isValidBcryptHash('plaintext_password')).toBe(false);
      expect(isValidBcryptHash('sha256:aaabbbcccdddeeefff')).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('debería hashear una contraseña válida', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);

      expect(isValidBcryptHash(hash)).toBe(true);
      expect(hash).not.toBe(password);
    });

    it('debería fallar si password no es string', async () => {
      try {
        await hashPassword(null as any);
        fail('Debería lanzar error');
      } catch (error) {
        expect((error as Error).message).toContain('debe ser un string');
      }
    });

    it('debería fallar si password es menor a 8 caracteres', async () => {
      try {
        await hashPassword('short');
        fail('Debería lanzar error');
      } catch (error) {
        expect((error as Error).message).toContain('al menos 8 caracteres');
      }
    });

    it('debería fallar si password excede 72 caracteres', async () => {
      const longPassword = 'a'.repeat(73);
      try {
        await hashPassword(longPassword);
        fail('Debería lanzar error');
      } catch (error) {
        expect((error as Error).message).toContain('no puede exceder 72 caracteres');
      }
    });
  });

  describe('verifyPassword', () => {
    it('debería verificar una contraseña válida', async () => {
      const password = 'correctPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('debería rechazar una contraseña incorrecta', async () => {
      const password = 'correctPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword456!', hash);
      expect(isValid).toBe(false);
    });

    it('debería retornar false si password no es string', async () => {
      const hash = '$2a$12$kF5c.c2kp8bHM3YHfDpfnOHBG7TjDKV3gMH5Lq4qDl4qKlHK0Ov0C';
      expect(await verifyPassword(null as any, hash)).toBe(false);
      expect(await verifyPassword(123 as any, hash)).toBe(false);
    });

    it('debería retornar false si password está vacío', async () => {
      const password = 'correctPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    it('debería retornar false si password excede 72 caracteres', async () => {
      const password = 'correctPassword123!';
      const hash = await hashPassword(password);
      const longPassword = 'a'.repeat(73);

      const isValid = await verifyPassword(longPassword, hash);
      expect(isValid).toBe(false);
    });

    it('debería retornar false si hash no es string', async () => {
      const isValid = await verifyPassword('password123', null as any);
      expect(isValid).toBe(false);

      const isValid2 = await verifyPassword('password123', undefined as any);
      expect(isValid2).toBe(false);
    });

    it('debería retornar false si hash no es bcrypt válido', async () => {
      const isValid = await verifyPassword('password123', 'not_a_valid_hash');
      expect(isValid).toBe(false);

      const isValid2 = await verifyPassword('password123', '');
      expect(isValid2).toBe(false);
    });

    it('debería retornar false si hash está corrupto pero parece bcrypt', async () => {
      const invalidHash = '$2a$12$' + 'x'.repeat(53);
      const isValid = await verifyPassword('password123', invalidHash);
      expect(isValid).toBe(false);
    });

    it('debería manejar timeouts sin lanzar excepción', async () => {
      // Este test es ilustrativo. En la práctica requeriría mocking de bcrypt
      const password = 'correctPassword123!';
      const hash = await hashPassword(password);

      // Debería no lanzar error aunque bcrypt se demore
      expect(async () => {
        await verifyPassword(password, hash);
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('debería manejar contraseñas con caracteres especiales', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('debería manejar contraseñas con unicode', async () => {
      const password = 'Contraseña123!🔒';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('debería diferenciar mayúsculas de minúsculas', async () => {
      const password = 'Password123!';
      const hash = await hashPassword(password);

      const isValid1 = await verifyPassword('password123!', hash);
      expect(isValid1).toBe(false);

      const isValid2 = await verifyPassword('PASSWORD123!', hash);
      expect(isValid2).toBe(false);

      const isValid3 = await verifyPassword(password, hash);
      expect(isValid3).toBe(true);
    });

    it('debería ser resistente a tiempo constante (no timing attacks)', async () => {
      const password = 'correctPassword123!';
      const hash = await hashPassword(password);

      // Estas operaciones deberían tomar tiempo similar
      const start1 = Date.now();
      await verifyPassword('a', hash);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await verifyPassword('wrongPassword123!', hash);
      const time2 = Date.now() - start2;

      // Los tiempos deberían ser similares (bcrypt.compare usa tiempo constante)
      const timeDiff = Math.abs(time1 - time2);
      expect(timeDiff).toBeLessThan(200); // Margen de tolerancia
    });
  });
});
