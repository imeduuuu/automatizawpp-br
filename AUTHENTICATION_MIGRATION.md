# Autenticación Definitiva - Guía de Migración

## Resumen

Se ha implementado un **nuevo sistema de autenticación robusto y definitivo** que reemplaza los problemas anteriores:

### Problemas Resueltos
- ✅ Separación clara entre cookies de sesión y JWT
- ✅ Refresh tokens automáticos (sin expiración inesperada)
- ✅ API tokens para acceso programático duradero
- ✅ Rate limiting en login (fuerza bruta)
- ✅ Auditoría completa de eventos de autenticación
- ✅ Manejo seguro de contraseñas (bcrypt validado)
- ✅ Cookies httpOnly (previene XSS)

## Arquitectura Nueva

```
┌─────────────────────────────────────────────────────┐
│                 CLIENTE (Browser)                     │
├─────────────────────────────────────────────────────┤
│ localStorage:      (NO SE USA - XSS risk)            │
│ cookies httpOnly:  auth.access-token                 │
│                   auth.refresh-token                 │
└────────────┬──────────────────────────────────────┘
             │
             ├─────→ POST /api/auth/login
             │        ↓
             │       Valida credenciales → Genera tokens → Setea cookies
             │
             ├─────→ GET /api/auth/me
             │        ↓
             │       Valida token en cookie → Retorna sesión
             │
             ├─────→ POST /api/auth/logout
             │        ↓
             │       Revoca refresh token → Limpia cookies
             │
             └─────→ POST /api/auth/refresh
                      ↓
                      Valida refresh token → Genera nuevo access token

┌──────────────────────────────────────────────────────┐
│                  BASE DE DATOS                        │
├──────────────────────────────────────────────────────┤
│ User                                                  │
│ ├─ id, email, passwordHash                           │
│ └─ refreshTokens: RefreshToken[]                     │
│    └─ apiTokens: ApiToken[]                          │
│                                                      │
│ RefreshToken (sesiones de usuario)                  │
│ ├─ userId, hashedToken, expiresAt                   │
│ └─ isRevoked                                        │
│                                                      │
│ ApiToken (acceso programático)                      │
│ ├─ userId, hashedToken, name, expiresAt             │
│ ├─ lastUsedAt                                       │
│ └─ isRevoked                                        │
└──────────────────────────────────────────────────────┘
```

## Archivos Nuevos

### 1. **src/lib/auth/auth-core.ts** (Core - Generación y validación de tokens)

Funciones principales:
- `generateAccessToken()` - Crea JWT de 15 min
- `generateRefreshToken()` - Crea token de 7 días (almacenado en BD)
- `generateApiToken()` - Crea token API de larga duración
- `verifyAccessToken()` - Valida JWT
- `verifyRefreshToken()` - Valida contra BD
- `verifyApiToken()` - Valida token API contra BD
- `refreshAccessToken()` - Renueva access token
- `revokeSession()` - Revoca refresh tokens (logout)

### 2. **src/lib/auth/session.ts** (Cookies httpOnly)

Gestiona cookies seguras:
- `getSession()` - Obtiene payload del token actual
- `setSessionCookies()` - Setea cookies después de login
- `clearSessionCookies()` - Limpia cookies en logout
- `getAccessToken()` - Lee token de cookies

### 3. **src/lib/auth/api-auth.ts** (Validación en API)

Helpers para endpoints:
- `extractAndValidateToken()` - Extrae Bearer token
- `requireAuth()` - Middleware que requiere auth
- `requireWorkspaceAccess()` - Valida acceso a workspace
- `requireRole()` - Valida rol específico

### 4. **src/app/api/auth/login/route.ts** (Nuevo endpoint)

```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

// Response 200
{
  "ok": true,
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "workspaceId": "...",
    "role": "client"
  }
}
// Sets cookies:
// - auth.access-token (JWT, 15 min, httpOnly)
// - auth.refresh-token (Token, 7 días, httpOnly)
```

### 5. **src/app/api/auth/logout/route.ts**

```typescript
POST /api/auth/logout

// Response 200
{ "ok": true }
// Limpia cookies + revoca todos los refresh tokens
```

### 6. **src/app/api/auth/refresh/route.ts**

```typescript
POST /api/auth/refresh

// Response 200
{ "ok": true, "expiresIn": 900 }
// Genera nuevo access token usando refresh token
```

### 7. **src/app/api/auth/me/route.ts**

```typescript
GET /api/auth/me
Authorization: Bearer TOKEN (opcional - lee cookies si no)

// Response 200
{
  "ok": true,
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "workspaceId": "...",
    "role": "client"
  }
}

// Response 401 si no autenticado
{ "ok": false, "error": "Unauthorized" }
```

### 8. **src/lib/hooks/useSession.ts** (React Hook)

```typescript
const { session, status, isLoading, error, logout } = useSession();

// session: { userId, workspaceId, email, role, type }
// status: 'loading' | 'authenticated' | 'unauthenticated'
// logout(): Promise<void>
```

## Cambios en Archivos Existentes

### src/middleware.ts (REESCRITO)
- Valida JWT de cookies o Authorization header
- Manejo separado para API vs páginas
- Redirige unauthenticated a /login
- Redirige authenticated en /login a /dashboard

### src/lib/actions/auth-actions.ts (ACTUALIZADO)
- `loginAction()` - Llama a `/api/auth/login`
- `signupAction()` - Crea usuario + auto-login
- No cambia interfaz pública

### prisma/schema.prisma (EXTENDIDO)
- Nuevo modelo `RefreshToken`
- Nuevo modelo `ApiToken`
- Relaciones en `User`

## Migración de BD

```bash
# 1. Crear migration
npx prisma migrate dev --name add_auth_tokens

# 2. Esto crea:
# - tabla refresh_tokens
# - tabla api_tokens
# - indices para búsquedas rápidas
```

## Testing Manual

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v  # Ver cookies
```

### Obtener sesión
```bash
curl -X GET http://localhost:3000/api/auth/me \
  --cookie "auth.access-token=<TOKEN>" \
  -v
```

### Refrescar token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  --cookie "auth.access-token=<OLD>; auth.refresh-token=<REFRESH>" \
  -v
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  --cookie "auth.access-token=<TOKEN>" \
  -v
```

## API Token (Programmatic Access)

### Generar token (dashboard de usuario)
```typescript
// En un endpoint protegido (ej: /api/tokens/create)
const { session } = await requireAuth(request);
const token = await generateApiToken(session.userId, 'My App Token', 365);
// Retorna: 'aut_xxxxxxxxxxxx' (nunca almacenado como texto)
```

### Usar token en requests
```bash
curl -X GET https://api.example.com/api/leads \
  -H "Authorization: Bearer aut_xxxxxxxxxxxx"
```

## Cambios en Componentes (Login/Signup)

### Antes
```typescript
const [state, formAction] = useActionState(loginAction, initialActionState);
// FormAction era manejada por NextAuth
```

### Ahora
```typescript
// El formAction sigue igual - pero internamente:
// loginAction → fetch /api/auth/login → redirect
// ¡La interfaz pública NO CAMBIÓ!
```

## Configuración de Entorno

```bash
# .env (ya debería estar)
NEXTAUTH_URL="http://localhost:3000"        # O tu dominio
NEXTAUTH_SECRET="tu-secret-de-32-chars-min"

# Nueva BD requiere migración
DATABASE_URL="postgresql://..."
```

## Rate Limiting

```
- 5 intentos fallidos por email → bloqueado 15 min
- Automático en /api/auth/login
- Audita intentos fallidos
```

## Auditoría

Eventos registrados automáticamente:
- `AUTH_LOGIN` - Login exitoso
- `AUTH_FAILED` - Password incorrecta
- `AUTH_RATE_LIMIT_EXCEEDED` - Demasiados intentos
- `AUTH_LOGOUT` - Logout del usuario
- `AUTH_PASSWORD_CHANGED` - Reset de contraseña

## Validación de API en Endpoints

### Requerir autenticación
```typescript
import { requireAuth } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  const { auth } = await requireAuth(request);
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // auth.userId, auth.workspaceId, auth.role
}
```

### Requerir workspace específico
```typescript
const { auth, authorized } = await requireWorkspaceAccess(request, workspaceId);

if (!authorized) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Requerir rol específico
```typescript
const { auth, authorized } = await requireRole(request, ['admin']);

if (!authorized) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Eliminación de NextAuth (Futuro)

Actualmente, NextAuth se mantiene por compatibilidad transitoria:
- `src/auth.ts` está marcado como DEPRECATED
- `src/app/api/auth/[...nextauth]/route.ts` puede eliminarse
- Los formularios ahora llaman al nuevo `/api/auth/login`

**Próxima versión:**
- Eliminar `/src/auth.ts` completamente
- Eliminar `/src/app/api/auth/[...nextauth]/route.ts`
- Actualizar cualquier import pendiente

## Solución de Problemas

### "Token inválido o expirado"
→ Refrescar: POST /api/auth/refresh

### "Unauthorized" en API
→ Verificar: Authorization header o cookies
→ Debug: GET /api/auth/me debería retornar sesión

### "Rate limited"
→ Esperar 15 minutos o intentar desde otro email

### Cookies no aparecen
→ Verificar: `secure: process.env.NODE_ENV === 'production'`
→ En dev local, cookies httpOnly aún funcionan sin HTTPS

---

## Resumen de Cambios

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Tokens** | JWT únicamente (sin refresh) | Access + Refresh tokens |
| **Durabilidad** | 7 días sin refresh | 15 min access, 7 días refresh |
| **Almacenamiento** | Cookies (no validadas) | Cookies httpOnly + BD |
| **API tokens** | No soportado | `ApiToken` modelo + endpoints |
| **Rate limiting** | Básico | Robusto con auditoría |
| **Validación** | Cookie existence only | Token JWT verified |
| **Logout** | Solo limpia cookies | Limpia + revoca en BD |
| **Refresh manual** | No necesario | Automático si 401 |

---

## ¡LISTO PARA PRODUCCIÓN!

Este sistema:
- ✅ **Seguro**: Passwords hasheados (bcrypt), tokens seguros (HMAC-SHA256), cookies httpOnly
- ✅ **Robusto**: Refresh automático, rate limiting, auditoría
- ✅ **Escalable**: API tokens para terceros, múltiples sesiones
- ✅ **Mantenible**: Código limpio, bien documentado, separación de responsabilidades
- ✅ **Compatible**: Mantiene interfaz pública igual, transición sin cambios en componentes
