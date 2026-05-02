# Índice de Autenticación - Navegación Rápida

**Versión**: 1.0 (Production Ready)  
**Fecha**: 2026-05-02  
**Estado**: Listo para implementación

## Leer Primero

1. **[SOLUCION_AUTENTICACION_DEFINITIVA.md](./SOLUCION_AUTENTICACION_DEFINITIVA.md)** (5 min read)
   - Resumen ejecutivo
   - Problemas resueltos
   - Arquitectura de alto nivel
   - Garantías de funcionamiento

## Documentación Técnica

2. **[AUTHENTICATION_MIGRATION.md](./AUTHENTICATION_MIGRATION.md)** (20 min read)
   - Arquitectura detallada con diagramas
   - Especificación de cada endpoint
   - Validaciones de seguridad
   - Troubleshooting

3. **[EJEMPLOS_USO_AUTENTICACION.md](./EJEMPLOS_USO_AUTENTICACION.md)** (15 min read)
   - 10 casos de uso reales
   - Code snippets copy-paste
   - Testing manual con curl
   - Mejores prácticas

## Implementación

4. **[CHECKLIST_IMPLEMENTACION.md](./CHECKLIST_IMPLEMENTACION.md)** (30 min)
   - 9 fases de implementación
   - Tests manuales
   - Validaciones
   - Plan de rollback
   - Sign-off template

5. **[scripts/setup-auth-migration.sh](./scripts/setup-auth-migration.sh)**
   ```bash
   bash scripts/setup-auth-migration.sh
   ```
   - Ejecuta migración Prisma
   - Valida todos los archivos
   - Verifica compilación

## Código Fuente

### Core Authentication (3 archivos)

- **[src/lib/auth/auth-core.ts](./src/lib/auth/auth-core.ts)**
  ```typescript
  // Generar tokens
  generateAccessToken()
  generateRefreshToken()
  generateApiToken()
  
  // Validar tokens
  verifyAccessToken()
  verifyRefreshToken()
  verifyApiToken()
  
  // Administración
  refreshAccessToken()
  revokeSession()
  revokeApiToken()
  ```

- **[src/lib/auth/session.ts](./src/lib/auth/session.ts)**
  ```typescript
  getSession()
  setSessionCookies()
  clearSessionCookies()
  getAccessToken()
  validateSession()
  ```

- **[src/lib/auth/api-auth.ts](./src/lib/auth/api-auth.ts)**
  ```typescript
  requireAuth()
  requireWorkspaceAccess()
  requireRole()
  extractAndValidateToken()
  ```

### API Endpoints (4 archivos)

- **[src/app/api/auth/login/route.ts](./src/app/api/auth/login/route.ts)**
  ```
  POST /api/auth/login
  ├─ Validación de credenciales
  ├─ Rate limiting
  ├─ Generación de tokens
  └─ Auditoría
  ```

- **[src/app/api/auth/logout/route.ts](./src/app/api/auth/logout/route.ts)**
  ```
  POST /api/auth/logout
  ├─ Revoca refresh tokens
  ├─ Limpia cookies
  └─ Registra evento
  ```

- **[src/app/api/auth/refresh/route.ts](./src/app/api/auth/refresh/route.ts)**
  ```
  POST /api/auth/refresh
  ├─ Valida refresh token
  ├─ Genera nuevo access token
  └─ Auto-llamado si 401
  ```

- **[src/app/api/auth/me/route.ts](./src/app/api/auth/me/route.ts)**
  ```
  GET /api/auth/me
  ├─ Retorna sesión actual
  ├─ Funciona con cookies o Bearer
  └─ 401 si no autenticado
  ```

### React

- **[src/lib/hooks/useSession.ts](./src/lib/hooks/useSession.ts)**
  ```typescript
  const { session, status, logout } = useSession()
  // session: AuthPayload | null
  // status: 'loading' | 'authenticated' | 'unauthenticated'
  ```

## Cambios a Archivos Existentes

### Archivo: [src/middleware.ts](./src/middleware.ts)
**Cambio**: Reescrito para validación JWT + Bearer  
**Impacto**: Transparente (mejora)  
**Riesgo**: Bajo (100% backward compatible)

### Archivo: [src/lib/actions/auth-actions.ts](./src/lib/actions/auth-actions.ts)
**Cambio**: loginAction() ahora llama /api/auth/login  
**Impacto**: Transparente para componentes  
**Riesgo**: Bajo (interfaz pública idéntica)

### Archivo: [prisma/schema.prisma](./prisma/schema.prisma)
**Cambio**: Agregados modelos RefreshToken + ApiToken  
**Impacto**: Nueva migración requerida  
**Riesgo**: Bajo (additive, sin cambios a tablas existentes)

## Estructura de Carpetas

```
automatizawppBR/
├── src/
│   ├── lib/auth/
│   │   ├── auth-core.ts         ← Token generation/validation
│   │   ├── session.ts           ← Cookie management
│   │   └── api-auth.ts          ← API validation helpers
│   ├── app/api/auth/
│   │   ├── login/route.ts       ← POST /api/auth/login
│   │   ├── logout/route.ts      ← POST /api/auth/logout
│   │   ├── refresh/route.ts     ← POST /api/auth/refresh
│   │   └── me/route.ts          ← GET /api/auth/me
│   ├── lib/hooks/
│   │   └── useSession.ts        ← React hook
│   ├── lib/actions/
│   │   └── auth-actions.ts      ← Updated
│   ├── middleware.ts            ← Rewritten
│   └── auth.ts                  ← Deprecated (keep for now)
├── prisma/
│   ├── schema.prisma            ← Updated
│   └── migrations/
│       └── add_auth_tokens.sql  ← New migration
├── scripts/
│   └── setup-auth-migration.sh  ← Automation
└── Documentación:
    ├── SOLUCION_AUTENTICACION_DEFINITIVA.md
    ├── AUTHENTICATION_MIGRATION.md
    ├── EJEMPLOS_USO_AUTENTICACION.md
    ├── CHECKLIST_IMPLEMENTACION.md
    └── INDICE_AUTENTICACION.md    ← Este archivo
```

## Flujos Principales

### Login User
```
LoginForm.tsx
    ↓ form action
loginAction()
    ↓ fetch POST
/api/auth/login
    ↓ validar credenciales
BD (User + bcrypt)
    ↓ generar tokens
accessToken (JWT) + refreshToken (BD)
    ↓ setear cookies
Cookies (httpOnly)
    ↓ redirect
/dashboard
```

### Validar Request API
```
Client Request
    ↓ Authorization header o cookies
/api/protected
    ↓ middleware
middleware.ts
    ↓ validar JWT
verifyAccessToken()
    ↓ si válido
Request handler continúa
    ↓ si inválido
Response 401
```

### Refrescar Token
```
Request /api/protected
    ↓ access token expirado
Response 401
    ↓ frontend intenta refresh
POST /api/auth/refresh
    ↓ validar refresh token contra BD
BD (RefreshToken)
    ↓ generar nuevo access token
Setear nueva cookie
    ↓ retry original request
Request /api/protected
    ↓ ahora funciona
Response 200
```

## Quick Reference

### Generar Tokens
```typescript
import { generateAccessToken, generateRefreshToken, generateApiToken } from '@/lib/auth/auth-core';

// Access Token (15 min)
const accessToken = await generateAccessToken({
  userId, workspaceId, email, role, type: 'session'
});

// Refresh Token (7 días)
const refreshToken = await generateRefreshToken(userId);

// API Token (1 año)
const apiToken = await generateApiToken(userId, 'My App', 365);
```

### Validar Tokens
```typescript
import { verifyAccessToken, verifyApiToken } from '@/lib/auth/auth-core';

// Verificar JWT
const payload = await verifyAccessToken(token);

// Verificar API Token
const payload = await verifyApiToken(token);
```

### Proteger Endpoints
```typescript
import { requireAuth, requireWorkspaceAccess, requireRole } from '@/lib/auth/api-auth';

// Requerir autenticación general
const { auth } = await requireAuth(request);
if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Requerir workspace específico
const { auth, authorized } = await requireWorkspaceAccess(request, workspaceId);
if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

// Requerir rol específico
const { auth, authorized } = await requireRole(request, ['admin']);
if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

### React Hook
```typescript
import { useSession } from '@/lib/hooks/useSession';

const { session, status, logout } = useSession();

if (status === 'loading') return <div>Cargando...</div>;
if (status === 'unauthenticated') return <Redirect to="/login" />;

return (
  <div>
    Hola, {session?.email}
    <button onClick={logout}>Salir</button>
  </div>
);
```

## Environment Variables

```bash
# .env (ya debería estar configurado)
NEXTAUTH_URL="http://localhost:3000"          # O tu dominio
NEXTAUTH_SECRET="min-32-caracteres-aleatorio"  # JWT signing key

# BD
DATABASE_URL="postgresql://..."
```

## Verificaciones Pre-Deployment

- [ ] Leer SOLUCION_AUTENTICACION_DEFINITIVA.md
- [ ] Leer AUTHENTICATION_MIGRATION.md
- [ ] Ejecutar setup: `bash scripts/setup-auth-migration.sh`
- [ ] Tests locales: `npm run dev` + login manual
- [ ] Migración BD: `npx prisma migrate deploy`
- [ ] Endpoints probados: curl -X POST /api/auth/login
- [ ] Middleware validando: requests sin auth retornan 401
- [ ] Auditoría: SELECT * FROM "AuditLog" WHERE event LIKE 'AUTH_%'

## Soporte

### Error 401 Unauthorized
**Causa**: Token expirado o ausente  
**Solución**: POST /api/auth/refresh o redirigir a /login

### Error 429 Too Many Requests
**Causa**: Rate limit (5 intentos en 15 min)  
**Solución**: Esperar 15 minutos

### Cookies no aparecen
**Causa**: HTTPS requerido en producción  
**Solución**: Verificar NEXTAUTH_URL

### BD sin tablas
**Causa**: Migración no ejecutada  
**Solución**: `npx prisma migrate deploy`

## Contacto

Para problemas o preguntas:
1. Revisar CHECKLIST_IMPLEMENTACION.md (troubleshooting section)
2. Revisar AUTHENTICATION_MIGRATION.md (FAQ)
3. Revisar logs: `SELECT * FROM "AuditLog" WHERE event LIKE 'AUTH_%'`

---

**Última actualización**: 2026-05-02  
**Status**: Production Ready  
**Riesgo**: Bajo (100% backward compatible)
