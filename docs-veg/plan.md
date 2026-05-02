# Plan — AutomatizaWPP

> Protocolo V.L.A.E.G. aplicado retroactivamente. Proyecto ya en producción, ahora se documenta y se gobierna.

## Estado actual (2026-05-02)

- App Next.js 15.5.15 desplegada en DigitalOcean (Droplet 568497325, IP 68.183.203.16)
- Dominio `automatizawpp.com` apuntando a DO (DNS recién migrado de Vercel)
- SSL Let's Encrypt activo (vence 2026-07-31)
- Login funcional con `admin@automatizawpp.com` / `Admin@2026!`
- Base de datos PostgreSQL en `165.227.175.193:5432/sales_os` (user `botflow`)

## Fases V.L.A.E.G. — Estado retroactivo

- [x] **Fase 0** — Estructura `docs-veg/`, `tools-veg/`, `tmp-veg/` creada (HOY)
- [ ] **Fase 1 — V** — 5 Preguntas de Descubrimiento PENDIENTES de respuesta
- [ ] **Fase 1 — V** — JSON Schemas en `constitution.md` PENDIENTES
- [ ] **Fase 2 — L** — Verificación formal de credenciales pendiente
- [ ] **Fase 3 — A** — Refactor a A.N.T. de 3 capas pendiente (deuda técnica)
- [ ] **Fase 4 — E** — Aprobación del login form pendiente del usuario
- [x] **Fase 5 — G** — Desplegado en producción (incompleto: falta plan rollback en `progress.md`)

## Próximo paso bloqueante

Responder las 5 Preguntas de Descubrimiento (ver `constitution.md` cuando estén respondidas).
