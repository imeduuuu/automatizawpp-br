# Pre-Deployment Checklist: NextAuth v5 Login

**Antes de desplegar a producción (Digital Ocean, Vercel, etc), verifica estos items.**

Fecha: 2026-05-02  
Proyecto: automatizawppBR  
Provider: NextAuth v5 + Credentials  

---

## 🔐 SEGURIDAD

- [ ] **NEXTAUTH_SECRET configurado**
  ```bash
  # Verificar que existe en .env.local y .env.production
  echo $NEXTAUTH_SECRET | wc -c  # Debe tener ≥32 caracteres
  ```

- [ ] **NEXTAUTH_URL correcto en producción**
  ```bash
  # .env.production debe tener:
  NEXTAUTH_URL=https://automatizawpp.com
  # NO http://localhost:3000
  ```

- [ ] **trustHost: true en auth.ts**
  ```typescript
  // ✅ Verificar en src/auth.ts
  export const { handlers, auth } = NextAuth({
    trustHost: true,  // ← DEBE ESTAR
    ...
  })
  ```

- [ ] **httpOnly cookies habilitadas**
  ```bash
  # NextAuth lo hace automático
  # Verificar en DevTools: Application → Cookies
  # next-auth.session-token debe tener: HttpOnly ✓
  ```

- [ ] **Bcrypt SALT_ROUNDS ≥ 10**
  ```typescript
  // src/lib/auth/password.ts
  const SALT_ROUNDS = 12;  // ✅ Correcto (12 es fuerte)
  ```

- [ ] **Rate limiting en lugar**
  ```typescript
  // src/auth.ts
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME_MS = 15 * 60 * 1000;  // 15 minutos
  
  // TODO en producción: Migrar de Map a Redis
  ```

- [ ] **Validación Zod en lugar**
  ```typescript
  const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  });
  ```

- [ ] **Error handling no revela detalles**
  ```typescript
  // ✅ Debe retornar null (genérico)
  if (!user || !user.passwordHash) {
    console.warn('[Auth] Usuario no encontrado');
    return null;  // ← No devuelve "Usuario no existe"
  }
  ```

---

## 🗄️ BASE DE DATOS

- [ ] **Tabla User existe y tiene columnas correctas**
  ```bash
  psql -U user -d automatizawpp -c "\\d \"User\""
  # Debe tener: id, email, passwordHash, workspaceId, role, name
  ```

- [ ] **Email es UNIQUE**
  ```bash
  psql -U user -d automatizawpp -c "SELECT * FROM pg_indexes WHERE tablename = 'User';"
  # Debe mostrar índice UNIQUE en email
  ```

- [ ] **passwordHash tiene suficiente longitud**
  ```bash
  # Bcrypt genera hashes de ~60 caracteres
  # VARCHAR(255) o TEXT es suficiente
  psql -U user -d automatizawpp -c "\\d+ \"User\"" | grep -A2 passwordHash
  ```

- [ ] **Admin test user existe**
  ```bash
  psql -U user -d automatizawpp -c "SELECT id, email, role FROM \"User\" WHERE email = 'admin@automatizawpp.com';"
  # Debe mostrar un row
  ```

- [ ] **passwordHash no es NULL para usuarios que deben loguearse**
  ```bash
  psql -U user -d automatizawpp -c "SELECT email, passwordHash IS NULL FROM \"User\" LIMIT 10;"
  # Todos deben tener passwordHash (no NULL)
  ```

- [ ] **AuditLog tabla existe (para logAuditEvent)**
  ```bash
  psql -U user -d automatizawpp -c "\\d \"AuditLog\""
  # Debe existir
  ```

---

## 📋 ARCHIVOS Y CONFIGURACIÓN

- [ ] **src/auth.ts existe y está bien formado**
  ```bash
  # Verificar que tiene:
  grep -q "Credentials(" src/auth.ts && echo "✓ Credentials provider"
  grep -q "strategy: 'jwt'" src/auth.ts && echo "✓ JWT strategy"
  grep -q "checkRateLimit" src/auth.ts && echo "✓ Rate limiting"
  grep -q "ExtendedUser" src/auth.ts && echo "✓ Types"
  ```

- [ ] **src/lib/auth/password.ts existe**
  ```bash
  test -f src/lib/auth/password.ts && echo "✓ Password module exists"
  grep -q "verifyPassword" src/lib/auth/password.ts && echo "✓ verifyPassword exported"
  grep -q "hashPassword" src/lib/auth/password.ts && echo "✓ hashPassword exported"
  ```

- [ ] **API endpoint en src/app/api/auth/[...nextauth]/route.ts**
  ```bash
  test -f "src/app/api/auth/[...nextauth]/route.ts" && echo "✓ NextAuth route exists"
  grep -q "handlers" "src/app/api/auth/[...nextauth]/route.ts" && echo "✓ handlers exported"
  ```

- [ ] **middleware.ts existe (para proteger rutas)**
  ```bash
  test -f middleware.ts && echo "✓ Middleware exists"
  grep -q "auth()" middleware.ts && echo "✓ Uses auth() from NextAuth"
  ```

- [ ] **Login form componente está creado**
  ```bash
  find src/components -name "*login*" -type f | grep -q "." && echo "✓ Login component found"
  ```

- [ ] **tailwind.config.ts o similar (para estilos)**
  ```bash
  test -f tailwind.config.ts || test -f tailwind.config.js && echo "✓ Tailwind config exists"
  ```

---

## 🧪 TESTING

- [ ] **Tests E2E corren sin errores**
  ```bash
  npm run test:e2e -- --reporter=list 2>&1 | tail -20
  # Debe mostrar "passed" en lugar de "failed"
  ```

- [ ] **Test de login exitoso pasa**
  ```bash
  npm run test:e2e -- --grep "exitoso"
  # Debe mostrar "1 passed"
  ```

- [ ] **Test de credenciales inválidas pasa**
  ```bash
  npm run test:e2e -- --grep "inválidas"
  # Debe mostrar "1 passed"
  ```

- [ ] **No hay errores de console en DevTools**
  ```bash
  # Abrir app → Abrir DevTools → Console
  # No debe haber errores en rojo
  ```

- [ ] **Auditoría está siendo registrada**
  ```bash
  # Hacer login exitoso, luego:
  psql -U user -d automatizawpp -c "SELECT * FROM \"AuditLog\" WHERE event = 'AUTH_LOGIN' ORDER BY createdAt DESC LIMIT 1;"
  # Debe mostrar registro reciente
  ```

---

## 🚀 DEPLOYMENT

- [ ] **Archivo .env.production está configurado**
  ```bash
  test -f .env.production && echo "✓ .env.production exists"
  grep "NEXTAUTH_SECRET" .env.production && echo "✓ NEXTAUTH_SECRET set"
  grep "NEXTAUTH_URL" .env.production && echo "✓ NEXTAUTH_URL set"
  grep "DATABASE_URL" .env.production && echo "✓ DATABASE_URL set"
  ```

- [ ] **Build local funciona sin errores**
  ```bash
  npm run build
  # Debe completar sin errores o warnings críticos
  ```

- [ ] **Next.js start funciona localmente**
  ```bash
  npm run start &
  sleep 5
  curl -s http://localhost:3000/login | grep -q "email" && echo "✓ App running"
  ```

- [ ] **Variables de entorno en servidor productivo están configuradas**
  ```bash
  # En Digital Ocean, Vercel, etc:
  # Dashboard → App → Settings → Environment Variables
  # Verificar:
  # - NEXTAUTH_SECRET ✓
  # - NEXTAUTH_URL=https://automatizawpp.com ✓
  # - DATABASE_URL ✓
  ```

- [ ] **Migrations de Prisma ejecutadas en producción**
  ```bash
  # Antes de deploy:
  npx prisma migrate deploy
  # Debe completar sin errores
  ```

- [ ] **DNS resuelve correctamente**
  ```bash
  nslookup automatizawpp.com
  # Debe devolver IP correcta
  ```

- [ ] **HTTPS funciona**
  ```bash
  curl -I https://automatizawpp.com/login
  # Debe devolver 200 (no 301 redirect infinito)
  ```

---

## ✅ TESTING EN PRODUCCIÓN

Después de deployar:

- [ ] **Página de login accesible**
  ```bash
  curl -I https://automatizawpp.com/login | grep "200"
  # Debe mostrar 200 OK
  ```

- [ ] **Login funciona end-to-end**
  ```bash
  # Abrir https://automatizawpp.com/login
  # Ingresar: admin@automatizawpp.com / Admin@2026!
  # Verificar: Redirige a /dashboard ✓
  ```

- [ ] **Credenciales inválidas rechazan**
  ```bash
  # Abrir https://automatizawpp.com/login
  # Ingresar: admin@automatizawpp.com / wrongpassword
  # Verificar: Muestra error, NO redirige ✓
  ```

- [ ] **Logout funciona**
  ```bash
  # Habiendo logueado, buscar botón logout
  # Click en logout
  # Verificar: Redirige a /login ✓
  ```

- [ ] **Rutas protegidas requieren auth**
  ```bash
  # Sin loguearse, ir a https://automatizawpp.com/dashboard
  # Verificar: Redirige a /login ✓
  ```

- [ ] **Auditoría registra logins**
  ```bash
  # Hacer login en producción
  # En BD:
  psql -U user -d automatizawpp -c "SELECT * FROM \"AuditLog\" ORDER BY createdAt DESC LIMIT 5;"
  # Debe mostrar event='AUTH_LOGIN' reciente
  ```

- [ ] **Rate limiting funciona (después de deploy)**
  ```bash
  # Hacer 6 intentos fallidos desde navegador
  # El 6to debe ser bloqueado (no enviar request)
  # O en logs: "Rate limit exceeded"
  ```

---

## 🔍 MONITOREO POST-DEPLOYMENT

- [ ] **Logs de error no muestran secrets**
  ```bash
  # En Digital Ocean, Vercel logs
  # Buscar "NEXTAUTH_SECRET", "DATABASE_URL"
  # NO deben aparecer en logs públicos
  ```

- [ ] **Error rate < 1%**
  ```bash
  # Dashboard de monitoring
  # 500 errors < 1% de total requests
  ```

- [ ] **Response time < 2s**
  ```bash
  # Para POST /api/auth/callback/credentials
  # Debe tomar 0.5-1.5s (incluye bcrypt)
  ```

- [ ] **Cookies se envían sobre HTTPS**
  ```bash
  # DevTools → Network → credenciales request
  # Response headers: Set-Cookie debe tener Secure; HttpOnly
  ```

---

## 📋 CHECKLIST FINAL

Marcar todos los items antes de considerar "listo para producción":

```
✓ Seguridad (8 items)
✓ Base de datos (6 items)
✓ Archivos y configuración (7 items)
✓ Testing (5 items)
✓ Deployment (8 items)
✓ Testing en producción (7 items)
✓ Monitoreo post-deployment (4 items)

Total: 45 items checkeados
```

---

## 🚨 PROBLEMAS COMUNES

### ❌ Error: "NEXTAUTH_SECRET no configurado"
**Solución:**
```bash
# .env.production necesita:
NEXTAUTH_SECRET=your-secret-here-min-32-chars
```

### ❌ Error: "Email o contraseña incorrectos" (siempre)
**Diagnóstico:**
```bash
# 1. Verificar usuario existe
psql -d automatizawpp -c "SELECT email FROM \"User\" WHERE email = 'admin@automatizawpp.com';"

# 2. Verificar passwordHash existe
psql -d automatizawpp -c "SELECT email, passwordHash FROM \"User\" WHERE email = 'admin@automatizawpp.com';"

# 3. Verificar formato bcrypt
# Hash debe empezar con $2a$, $2b$, o $2y$
```

### ❌ Error: "Redirect loop" en /login
**Causa:** trustHost: false o NEXTAUTH_URL incorrecto  
**Solución:**
```typescript
// src/auth.ts
export const { handlers, auth } = NextAuth({
  trustHost: true,  // ← Agregué esto
  ...
})
```

### ❌ Error: "Rate limit exceeded" (usuario bloqueado)
**Causa:** 5 intentos fallidos en 15 minutos  
**Solución:** Esperar 15 minutos O migrar a Redis para persistencia

### ❌ Error: "Database connection failed"
**Diagnóstico:**
```bash
# Verificar BD está corriendo
psql -U user -d automatizawpp -c "SELECT 1;"

# Verificar DATABASE_URL en env
echo $DATABASE_URL
```

---

## 📞 Contacto/Soporte

Si algo no está funcionando:

1. **Verificar logs:**
   ```bash
   # En desarrollo
   npm run dev  # Ver console
   
   # En producción
   # Digital Ocean: Monitoring → Logs
   # Vercel: Deployments → Function Logs
   ```

2. **Verificar BD:**
   ```bash
   psql -d automatizawpp -c "SELECT * FROM \"User\" LIMIT 1;"
   ```

3. **Test local antes de actualizar:**
   ```bash
   npm run test:e2e
   ```

---

**Generado:** 2026-05-02  
**Versión:** NextAuth v5 + Credentials  
**Estado:** LISTO ✅

Marca todos los items ✓ antes de desplegar a producción.
