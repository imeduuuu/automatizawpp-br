# core/ — Capa 2 A.N.T. (Núcleo de negocio)

> Reglas de negocio puras. Funciones deterministas, testeables, **sin I/O**.

## Estado actual

⚠️ **DEUDA TÉCNICA RECONOCIDA.** Esta carpeta está vacía porque AutomatizaWPP es un proyecto Next.js monolítico que NO sigue la arquitectura A.N.T. de 3 capas. La lógica de negocio vive actualmente mezclada con I/O en:

- `src/lib/auth/` — password hashing, sessions, password reset (mezcla con BD)
- `src/lib/services/` — catálogo, asignación servicios (mezcla con Prisma)
- `src/lib/audit.ts` — logging (mezcla con BD)
- Validadores Zod en `src/lib/actions/auth-actions.ts`

## Plan de migración (no urgente)

Cuando se decida refactorizar a A.N.T. de 3 capas:
1. Extraer funciones puras (sin `prisma.`, sin `fetch()`, sin `cookies()`) a `core/`
2. Las funciones I/O quedan en `tools/` (Capa 3)
3. Los endpoints/actions/workflows en `architecture/` (Capa 1) orquestan core+tools

## Reglas para core/ (cuando se migre)

- ✅ Validadores Zod
- ✅ Calculadoras (precios, fechas, formato)
- ✅ Transformadores de datos (JSON → DTO)
- ✅ Reglas de negocio puras (¿este lead puede recibir email? ¿este servicio aplica?)
- ❌ NO `prisma.*` (eso va a tools/)
- ❌ NO `fetch()` ni HTTP calls
- ❌ NO `cookies()`, `headers()`, ni nada de Next.js runtime
- ❌ NO acceso al sistema de archivos
