# Checklist de Implementación - Autenticación Definitiva

## ✅ Archivos Creados

- [x] `src/lib/auth/auth-core.ts` - Core de tokens JWT, refresh, API
- [x] `src/lib/auth/session.ts` - Gestión de cookies httpOnly
- [x] `src/lib/auth/api-auth.ts` - Validación en endpoints API
- [x] `src/app/api/auth/login/route.ts` - Endpoint de login
- [x] `src/app/api/auth/logout/route.ts` - Endpoint de logout
- [x] `src/app/api/auth/refresh/route.ts` - Endpoint de refresh
- [x] `src/app/api/auth/me/route.ts` - Endpoint de sesión actual
- [x] `src/lib/hooks/useSession.ts` - Hook React para sesión
- [x] `AUTHENTICATION_MIGRATION.md` - Documentación completa
- [x] `EJEMPLOS_USO_AUTENTICACION.md` - Ejemplos prácticos
- [x] `prisma/migrations/add_auth_tokens.sql` - Migración BD
- [x] `scripts/setup-auth-migration.sh` - Script de setup
- [x] `CHECKLIST_IMPLEMENTACION.md` - Este archivo

## ✅ Archivos Actualizados

- [x] `src/middleware.ts` - Validación JWT + Bearer tokens
- [x] `src/lib/actions/auth-actions.ts` - Llama nuevos endpoints
- [x] `prisma/schema.prisma` - Modelos RefreshToken + ApiToken

## ⏳ Pasos para Implementar

### 1. Preparación
- [ ] Leer `AUTHENTICATION_MIGRATION.md`
- [ ] Leer `EJEMPLOS_USO_AUTENTICACION.md`
- [ ] Backup de BD actual
- [ ] Crear rama de feature: `git checkout -b feat/auth-migration`

### 2. Migración de BD
```bash
# Ejecutar migración
npx prisma migrate dev --name add_auth_tokens

# O manualmente:
psql $DATABASE_URL < prisma/migrations/add_auth_tokens.sql
npx prisma generate
```
- [ ] Migración ejecutada exitosamente
- [ ] Tablas `RefreshToken` y `ApiToken` creadas
- [ ] Prisma Client regenerado

### 3. Validación de Archivos
```bash
# Ejecutar script de verificación
bash scripts/setup-auth-migration.sh
```
- [ ] Todos los archivos presentes
- [ ] TypeScript compila sin errores
- [ ] Migraciones limpias

### 4. Testing Manual

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt -v

# ✅ Debería retornar status 200 + setear cookies
```
- [ ] Login exitoso con credenciales válidas
- [ ] Response 401 con credenciales inválidas
- [ ] Cookies `auth.access-token` y `auth.refresh-token` seteadas
- [ ] Rate limiting después de 5 intentos fallidos

#### Sesión
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt

# ✅ Debería retornar datos del usuario
```
- [ ] GET /api/auth/me retorna sesión válida
- [ ] Sin cookies retorna 401
- [ ] Datos incluyen: id, email, workspaceId, role

#### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt

# ✅ Debería limpiar cookies
```
- [ ] POST /api/auth/logout limpia cookies
- [ ] Refresh tokens revocados en BD
- [ ] Siguiente request sin sesión retorna 401

#### Refresh Token
```bash
# Esperar que access token expire (15 min) o modificar fecha en BD
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt

# ✅ Debería generar nuevo access token
```
- [ ] POST /api/auth/refresh genera token nuevo
- [ ] Access token renovado
- [ ] Refresh token es válido por 7 días

### 5. Pruebas en Frontend

#### Login Form
- [ ] Formulario de login funciona
- [ ] Validación de email y contraseña
- [ ] Error message con credenciales inválidas
- [ ] Redirección a `/dashboard` después de login exitoso

#### useSession Hook
```typescript
const { session, status, logout } = useSession();
```
- [ ] Hook retorna sesión correctamente
- [ ] Status es 'authenticated' cuando hay sesión
- [ ] `logout()` funciona
- [ ] Redirige a /login después de logout

#### Componentes Protegidos
- [ ] Dashboard solo accesible si autenticado
- [ ] Redirección a login si sesión no válida
- [ ] Información del usuario muestra correctamente

### 6. Integración API

#### Endpoints Protegidos
```typescript
const { auth } = await requireAuth(request);
```
- [ ] APIs privadas requieren auth
- [ ] 401 sin credenciales
- [ ] Acceso permitido con token válido
- [ ] API tokens (Bearer) funcionan

#### Validación de Workspace
```typescript
const { auth, authorized } = await requireWorkspaceAccess(request, workspaceId);
```
- [ ] Usuarios solo acceden su workspace
- [ ] Admin puede acceder otros workspaces
- [ ] 403 si no autorizado

#### Rate Limiting
- [ ] 5 intentos fallidos → bloqueado 15 min
- [ ] IP registrada en auditoría
- [ ] Mensajes de error informativos

### 7. Auditoría
```sql
SELECT * FROM "AuditLog" WHERE event LIKE 'AUTH_%';
```
- [ ] AUTH_LOGIN registrado
- [ ] AUTH_FAILED registrado
- [ ] AUTH_RATE_LIMIT_EXCEEDED registrado
- [ ] AUTH_LOGOUT registrado

### 8. Deployment

#### Staging
```bash
# Push a rama de staging
git push origin feat/auth-migration:staging
```
- [ ] Compilación en staging exitosa
- [ ] Tests pasan
- [ ] Funcionalidad probada en staging

#### Production
```bash
# Merge a main
git checkout main
git pull origin main
git merge feat/auth-migration
git push origin main
```
- [ ] Backup de BD producción realizado
- [ ] Migración en producción completada
- [ ] Tests de humo pasan
- [ ] Monitoreo de errores activo
- [ ] Rollback plan listo

### 9. Limpieza (Post-Migración)

#### Eliminar NextAuth (cuando esté listo)
- [ ] Remover imports de `next-auth` si no se usa
- [ ] Eliminar `/src/auth.ts`
- [ ] Eliminar `/src/app/api/auth/[...nextauth]/route.ts`
- [ ] Remover `next-auth` de `package.json`

#### Actualizar Documentación
- [ ] Actualizar README con nuevo sistema
- [ ] Documentar endpoints en API docs
- [ ] Actualizar guías de contribución

## 📊 Validaciones

### BD
```bash
# Verificar tablas
\dt "RefreshToken" "ApiToken"

# Verificar relaciones
\d "User" | grep -E "refresh|api"

# Verificar índices
\di "RefreshToken_*"
```
- [ ] 2 tablas nuevas existen
- [ ] Índices creados
- [ ] Foreign keys correctas

### Node
```bash
npm run build
npm run lint
npm test
```
- [ ] Build sin errores
- [ ] Linting sin warnings críticos
- [ ] Tests pasan (si existen)

### Runtime
```bash
npm run dev
# En http://localhost:3000
```
- [ ] Aplicación inicia sin errores
- [ ] No hay console errors
- [ ] No hay console warnings

## 🔒 Seguridad

### Verificar Antes de Production
- [ ] NEXTAUTH_SECRET configurado (32+ chars)
- [ ] NEXTAUTH_URL correcto (https en prod)
- [ ] Base de datos respaldada
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad en Next.js
- [ ] Cookies secure:true en producción
- [ ] Logs de auditoría habilitados
- [ ] Monitoreo de intentos fallidos

### Pruebas de Seguridad
- [ ] XSS: localStorage no se usa
- [ ] CSRF: Cookies SameSite=Lax
- [ ] Brute Force: Rate limiting activo
- [ ] Token Expiry: Access 15min, Refresh 7d
- [ ] Password: bcrypt validado

## 📝 Documentación

- [x] `AUTHENTICATION_MIGRATION.md` - Arquitectura y guía
- [x] `EJEMPLOS_USO_AUTENTICACION.md` - Ejemplos prácticos
- [x] Code comments en archivos nuevos
- [ ] README actualizado (después de tests)
- [ ] API documentation actualizada (después de tests)
- [ ] Team training completado

## 🎯 Sign Off

- [ ] **Desarrollo**: Todos los tests pasan ___________
- [ ] **QA**: Testing completado ___________
- [ ] **Seguridad**: Revisión de seguridad aprobada ___________
- [ ] **DevOps**: Deployment plan revisado ___________
- [ ] **Product**: Funcionalidad aprobada ___________

## 🚀 Go-Live

```bash
# Fecha de implementación: ___________
# Hora de inicio: ___________
# Hora de fin: ___________
# Rollback ejecutado: Sí / No
# Status post-deployment: ✅ OK / ❌ Issues
```

## 📞 Soporte Post-Migración

En caso de problemas:

1. **401 Unauthorized**: Token expirado → POST /api/auth/refresh
2. **Rate limited**: Esperar 15 min o usar otro email
3. **Cookie issues**: Verificar que HTTPS en prod
4. **BD corruption**: Usar backup pre-migración
5. **Performance**: Verificar índices BD

---

**Completado por**: ___________
**Fecha**: ___________
**Version**: 1.0
