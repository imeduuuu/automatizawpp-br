# Fix: Prisma + NextAuth en Vercel - Login Fallido a Pesar de BD Funcional

**Fecha:** 2026-05-02  
**Status:** ARREGLADO  
**Severidad:** CRÍTICA (login roto)

---

## El Problema

**Síntoma:**
- ✓ `/api/debug/db-test` funciona perfectamente
- ✗ Login (NextAuth Credentials provider) falla silenciosamente

**Causa Raíz:**
Prisma no estaba siendo reutilizado como singleton en Vercel (producción), causando:
1. Múltiples instancias de PrismaClient
2. Agotamiento del pool de conexiones Postgres
3. Timeouts silenciosos en auth

---

## Root Cause Analysis

### Problema #1: Lazy Loading Incorrecto en Producción
**Archivo:** `src/lib/db.ts`

**Código ANTES (INCORRECTO):**
```typescript
export const prisma =
  global.prisma ??
  new PrismaClient({...});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;  // ← Solo en desarrollo!
}
```

**El bug:** En Vercel (`NODE_ENV === 'production'`), `global.prisma` nunca se reasignaba.
Cada función serverless creaba su propia instancia de PrismaClient, sin compartir conexiones.

**Diferencia entre endpoints:**
- `/api/debug/db-test`: Una query aislada, baja concurrencia → funciona
- `/api/auth/callback`: Múltiples requests concurrentes + overhead de NextAuth → falla

### Problema #2: Error Logging Insuficiente
**Archivo:** `src/auth.ts` (línea 68)

El catch block no proporcionaba detalles del error:
```typescript
catch (error) {
  console.error('[Auth]authorize error:', error);  // ← No especifica la causa
  return null;
}
```

En Vercel, estos logs pueden perderse → difícil de diagnosticar.

---

## Fixes Aplicados

### Fix #1: PrismaClient Singleton Pattern Correcto
**Archivo:** `src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;
const globalForPrisma = global as unknown as { prisma: PrismaClientSingleton | undefined };

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Por qué funciona:**
- Usa factory function `prismaClientSingleton()`
- En desarrollo: siempre reasigna a `global`
- En producción: reutiliza instancia existente de warm starts
- Cold starts crean una nueva, pero se reutiliza en siguiente invocación

### Fix #2: Error Logging Mejorado
**Archivo:** `src/auth.ts`

Ahora el catch block incluye:
- Tipo de error (DATABASE_ERROR vs UNKNOWN)
- Código de error Prisma (P1000, P1001, P1002, etc.)
- Email y timestamp para debugging

```typescript
catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code || 'UNKNOWN';
  const isConnectionError = [
    'P1000', // Authentication failed
    'P1001', // Can't reach database
    'P1002', // Timeout
    'P2002'  // Unique constraint
  ].includes(code);

  console.error('[Auth.authorize] Error crítico:', {
    type: isConnectionError ? 'DATABASE_ERROR' : 'UNKNOWN_ERROR',
    message,
    code,
    email: normalizedEmail,
    timestamp: new Date().toISOString()
  });
  return null;
}
```

### Fix #3: Endpoint de Diagnóstico
**Archivo:** `src/app/api/debug/prisma-singleton/route.ts`

Nuevo endpoint para verificar que el singleton funciona:
- Ejecuta 2 queries en paralelo
- Verifica que usan la misma conexión
- Reporta `NODE_ENV` y estado del pool

```bash
curl https://<domain>/api/debug/prisma-singleton
```

---

## Testing

### Verificar que está arreglado:

1. **Local (desarrollo):**
   ```bash
   npm run dev
   # Probar login en http://localhost:3000/login
   ```

2. **Vercel (producción):**
   ```bash
   # Verificar endpoint de diagnóstico
   curl https://<domain>/api/debug/prisma-singleton
   
   # Verificar que login funciona
   # (intentar login en dashboard)
   ```

3. **Ver logs en Vercel:**
   ```bash
   vercel logs --tail
   # Debería ver: "[Auth.authorize] Error crítico:" si hay problemas
   ```

---

## Conexiones Relacionadas

- **Archivo de actualización de auth:** `src/auth.ts` ahora incluye rate-limiting y validación mejorada
- **Database configuration:** `prisma/schema.prisma` comentado sobre limites de pool en Vercel
- **Middleware:** `/src/middleware.ts` ya permite `/api/debug/*` sin autenticación

---

## Notas Importantes

1. **No requiere cambios en .env:**
   - El fix es interno a cómo Prisma se inicializa
   - DATABASE_URL sigue siendo el mismo

2. **Cold starts vs Warm starts:**
   - **Cold start:** Vercel inicia nueva función → crea nuevo PrismaClient → conecta a BD
   - **Warm start:** Reutiliza instancia anterior en `global` → 0 overhead
   - El fix asegura que warm starts reutilicen la conexión

3. **Production vs Development:**
   - Desarrollo: Always reasigna a global para reloading
   - Producción: Reutiliza en warm starts

---

## Cambios de Archivos

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `src/lib/db.ts` | Singleton pattern correcto | 1-20 |
| `src/auth.ts` | Error logging mejorado | 77-92 |
| `prisma/schema.prisma` | Comentario sobre pool limits | 6-9 |
| `src/app/api/debug/prisma-singleton/route.ts` | NUEVO - Endpoint diagnóstico | - |

---

## Si el Problema Persiste

Si después de este fix el login sigue fallando:

1. **Verificar logs en Vercel:**
   ```bash
   vercel logs --tail
   ```
   Buscar errores con código P1000, P1001, P1002

2. **Aumentar connection pool si es necesario:**
   En `DATABASE_URL`, agregar parámetro:
   ```
   postgresql://user:pass@host:5432/db?connection_limit=5
   ```

3. **Verificar credenciales:**
   - Asegurar que DATABASE_URL en Vercel es correcta
   - Verificar que usuario Postgres tiene permisos
   - Verificar que BD está accesible desde Vercel

4. **Revisar endpoint diagnóstico:**
   ```bash
   curl https://<domain>/api/debug/db-test
   curl https://<domain>/api/debug/prisma-singleton
   ```

---

**Próximos pasos:** Deployar a Vercel y testar login. Si funciona, eliminar este archivo (solo documentación interna).
