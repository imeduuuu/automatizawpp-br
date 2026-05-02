import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;
const BCRYPT_COMPARE_TIMEOUT_MS = 5000; // Timeout de 5s para bcrypt.compare
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/; // Validar formato $2a$10$...

/**
 * Validar que un hash sea un formato bcrypt válido
 * @param hash - Hash a validar
 * @returns true si es un hash bcrypt válido
 */
export function isValidBcryptHash(hash: string): boolean {
  if (typeof hash !== 'string' || hash.length < 60) {
    return false;
  }
  return BCRYPT_HASH_PATTERN.test(hash);
}

export async function hashPassword(password: string) {
  // Validar entrada
  if (typeof password !== 'string') {
    throw new Error('[Password] El password debe ser un string');
  }
  if (password.length < 8) {
    throw new Error('[Password] El password debe tener al menos 8 caracteres');
  }
  if (password.length > 72) {
    // bcrypt solo procesa los primeros 72 caracteres
    throw new Error('[Password] El password no puede exceder 72 caracteres');
  }

  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`[Password] Error al hashear la contraseña: ${message}`);
  }
}

/**
 * Verificar que una contraseña coincida con un hash bcrypt
 * Con timeout, validación de entrada y error handling robusto
 * @param password - Contraseña en texto plano
 * @param hash - Hash bcrypt almacenado
 * @returns true si las contraseñas coinciden, false si no o si hay error
 * @throws Error solo en caso de errores críticos (no para comparación fallida)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Validar entrada - password
  if (typeof password !== 'string') {
    console.warn('[Password.verify] Password debe ser string, recibido:', typeof password);
    return false;
  }
  if (password.length === 0) {
    console.warn('[Password.verify] Password vacío');
    return false;
  }
  if (password.length > 72) {
    // bcrypt trunca a 72 caracteres, pero prevenimos entrada sospechosa
    console.warn('[Password.verify] Password excede 72 caracteres');
    return false;
  }

  // Validar entrada - hash
  if (typeof hash !== 'string') {
    console.error('[Password.verify] Hash debe ser string, recibido:', typeof hash);
    return false;
  }
  if (!isValidBcryptHash(hash)) {
    console.error('[Password.verify] Hash no es un formato bcrypt válido. Largo:', hash.length);
    return false;
  }

  try {
    // Crear promise con timeout
    const comparePromise = bcrypt.compare(password, hash);
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout en bcrypt.compare')), BCRYPT_COMPARE_TIMEOUT_MS);
    });

    return await Promise.race([comparePromise, timeoutPromise]);
  } catch (error) {
    // Diferenciar tipos de errores
    if (error instanceof Error) {
      if (error.message.includes('Timeout')) {
        console.error('[Password.verify] Timeout: bcrypt.compare excedió', BCRYPT_COMPARE_TIMEOUT_MS, 'ms');
      } else {
        console.error('[Password.verify] Error de bcrypt:', error.message);
      }
    } else {
      console.error('[Password.verify] Error desconocido en bcrypt.compare:', error);
    }

    // No lanzar exception, devolver false (falló la verificación)
    return false;
  }
}
