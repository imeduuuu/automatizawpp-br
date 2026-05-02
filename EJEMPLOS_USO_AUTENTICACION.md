# Ejemplos de Uso - Nuevo Sistema de Autenticación

## 1. Login desde Frontend (React)

### Opción A: Usar `loginAction` (Server Action - recomendado)

```typescript
// src/app/(public)/login/page.tsx
'use client';

import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const callbackUrl = searchParams.callbackUrl || '/dashboard';

  return (
    <div>
      <h1>Entrar</h1>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
```

```typescript
// src/components/auth/login-form.tsx
'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions/auth-actions';

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(loginAction, { status: 'idle' });

  return (
    <form action={formAction}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      
      <input
        type="email"
        name="email"
        placeholder="tu@email.com"
        required
      />
      {state.fieldErrors?.email?.[0] && (
        <p className="error">{state.fieldErrors.email[0]}</p>
      )}

      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        required
      />
      {state.fieldErrors?.password?.[0] && (
        <p className="error">{state.fieldErrors.password[0]}</p>
      )}

      {state.status === 'error' && (
        <p className="error">{state.message}</p>
      )}

      <button type="submit">Entrar</button>
    </form>
  );
}
```

### Opción B: Fetch directo (para integraciones)

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ¡IMPORTANTE para enviar cookies!
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

if (response.ok) {
  const data = await response.json();
  console.log('Logged in as:', data.user.email);
  // Redirigir a dashboard
  window.location.href = '/dashboard';
} else {
  const error = await response.json();
  console.error('Login failed:', error.error);
}
```

## 2. Obtener Sesión del Usuario

### En Server Components

```typescript
// app/dashboard/page.tsx
import { verifyAccessToken } from '@/lib/auth/auth-core';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth.access-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const session = await verifyAccessToken(token);

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Bienvenido, {session.email}</h1>
      <p>Workspace: {session.workspaceId}</p>
    </div>
  );
}
```

### En React Components (useSession Hook)

```typescript
// src/components/dashboard/header.tsx
'use client';

import { useSession } from '@/lib/hooks/useSession';

export function Header() {
  const { session, status, logout } = useSession();

  if (status === 'loading') {
    return <div>Cargando...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <header>
      <span>Hola, {session?.email}</span>
      <button onClick={logout}>Salir</button>
    </header>
  );
}
```

## 3. Logout

### Desde formulario

```typescript
'use client';

export function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    window.location.href = '/login';
  }

  return <button onClick={handleLogout}>Salir</button>;
}
```

### Server Action

```typescript
'use server';

import { clearSessionCookies } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  await clearSessionCookies();
  redirect('/login');
}
```

## 4. Proteger Endpoints API

### Requerir autenticación general

```typescript
// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  const { auth } = await requireAuth(request);

  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Ahora podemos usar auth.userId, auth.workspaceId, etc
  console.log(`Request from ${auth.email} in workspace ${auth.workspaceId}`);

  return NextResponse.json({ ok: true });
}
```

### Requerir acceso a workspace específico

```typescript
// app/api/workspace/[workspaceId]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspaceAccess } from '@/lib/auth/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  const { auth, authorized } = await requireWorkspaceAccess(
    request,
    params.workspaceId
  );

  if (!authorized) {
    return NextResponse.json(
      { error: 'Forbidden - No access to this workspace' },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
```

### Requerir rol específico

```typescript
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  const { auth, authorized } = await requireRole(request, ['admin']);

  if (!authorized) {
    return NextResponse.json(
      { error: 'Forbidden - Admin only' },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
```

## 5. Usar Bearer Tokens (API Token)

### Generar API Token (en dashboard)

```typescript
// app/api/tokens/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-auth';
import { generateApiToken } from '@/lib/auth/auth-core';

export async function POST(request: NextRequest) {
  const { auth } = await requireAuth(request);

  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, expiresInDays } = await request.json();

  // Generar token
  const token = await generateApiToken(
    auth.userId,
    name,
    expiresInDays || 365
  );

  return NextResponse.json({
    ok: true,
    token, // ¡Mostrar UNA SOLA VEZ al usuario!
    message: 'Guarda este token en un lugar seguro - no podrás verlo de nuevo'
  });
}
```

### Usar Bearer Token en requests

```bash
# curl
curl -X GET https://api.example.com/api/leads \
  -H "Authorization: Bearer aut_xxxxxxxxxxxxxx"

# fetch
const response = await fetch('/api/leads', {
  headers: {
    'Authorization': 'Bearer aut_xxxxxxxxxxxxxx'
  }
});
```

### En JavaScript

```typescript
const apiToken = 'aut_xxxxxxxxxxxxxx';

const response = await fetch('/api/leads', {
  headers: {
    'Authorization': `Bearer ${apiToken}`
  }
});

const data = await response.json();
```

## 6. Refrescar Token Automáticamente

El sistema refrescará automáticamente si el access token expira y existe un refresh token válido.

Para manual refresh:

```typescript
// Opción 1: Endpoint
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'
});

if (response.ok) {
  console.log('Token refreshed');
}

// Opción 2: Server action
'use server';

import { refreshAccessToken } from '@/lib/auth/auth-core';
import { cookies } from 'next/headers';

export async function refreshSessionAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth.refresh-token')?.value;
  const userId = '...'; // obtener de sesión actual

  if (!token || !userId) {
    return { ok: false };
  }

  const result = await refreshAccessToken(userId, token);

  if (result) {
    // Setear nuevas cookies...
    return { ok: true, expiresIn: result.expiresIn };
  }

  return { ok: false };
}
```

## 7. Manejo de Errores Comunes

### Token Expirado

```typescript
async function apiCall(url: string) {
  let response = await fetch(url, {
    credentials: 'include'
  });

  // Si 401, intentar refrescar
  if (response.status === 401) {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    if (refreshResponse.ok) {
      // Reintentar original
      response = await fetch(url, {
        credentials: 'include'
      });
    } else {
      // Redirect a login
      window.location.href = '/login';
      return null;
    }
  }

  return response.json();
}
```

### Rate Limit (Demasiados intentos)

```typescript
if (response.status === 429) {
  alert('Demasiados intentos fallidos. Espera 15 minutos y vuelve a intentar.');
  // Mostrar countdown de 15 minutos
}
```

## 8. Auditoría de Eventos

Todos los eventos se registran automáticamente:

```typescript
// Ver en BD: SELECT * FROM "AuditLog" WHERE event LIKE 'AUTH_%'

// Eventos disponibles:
// - AUTH_LOGIN
// - AUTH_FAILED
// - AUTH_RATE_LIMIT_EXCEEDED
// - AUTH_LOGOUT
// - AUTH_PASSWORD_CHANGED
```

## 9. Testing

### Prueba de Login en curl

```bash
# 1. Login
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }' \
  -c cookies.txt)

echo $TOKEN_RESPONSE | jq '.user'

# 2. Obtener sesión
curl -s -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt | jq '.user'

# 3. Logout
curl -s -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt | jq '.'

# 4. Verificar que no funciona sin cookies
curl -s -X GET http://localhost:3000/api/auth/me | jq '.'
# Response: { "ok": false, "error": "Unauthorized" }
```

### Prueba de API Token

```bash
# 1. Generar token
TOKEN=$(curl -s -X POST http://localhost:3000/api/tokens/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer existing_session" \
  -d '{"name":"Test Token","expiresInDays":7}' | jq -r '.token')

echo "Token: $TOKEN"

# 2. Usar token
curl -s -X GET http://localhost:3000/api/leads \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## 10. Seguridad

### ¿Dónde se almacenan los tokens?

| Token | Almacenamiento | Duración | Riesgo |
|-------|------------------|----------|--------|
| Access Token | Cookie httpOnly | 15 min | Bajo (XSS bloqueado) |
| Refresh Token | Cookie httpOnly | 7 días | Bajo (XSS bloqueado) |
| API Token | BD (hasheado) | 1+ años | N/A |

### Nunca hagas esto:

```typescript
// ❌ MAL: Guardar en localStorage
localStorage.setItem('accessToken', token);

// ❌ MAL: Enviar en URL
fetch(`/api/leads?token=${token}`);

// ❌ MAL: En HTML
<img src={`/api/data?token=${token}`} />

// ✅ BIEN: Cookies httpOnly (automático)
// ✅ BIEN: Authorization header
fetch('/api/data', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Resumen Rápido

| Tarea | Cómo |
|-------|------|
| Login | POST /api/auth/login + FormData |
| Obtener sesión | GET /api/auth/me |
| Logout | POST /api/auth/logout |
| Proteger API | `requireAuth()` helper |
| API Token | `generateApiToken()` + Bearer |
| Refrescar | POST /api/auth/refresh |
| React Hook | `useSession()` |
| Server Component | Leer de cookies + JWT verify |

---

¡Listo para usar!
