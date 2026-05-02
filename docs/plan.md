# Plan — AutomatizaWPP

> Protocolo V.L.A.E.G. aplicado retroactivamente. Proyecto ya en producción, ahora se documenta y se gobierna.

## Estado actual (2026-05-02)

- App Next.js 15.5.15 desplegada en DigitalOcean (Droplet 568497325, IP 68.183.203.16)
- Dominio `automatizawpp.com` apuntando a DO (DNS recién migrado de Vercel)
- SSL Let's Encrypt activo (vence 2026-07-31)
- Login funcional con `admin@automatizawpp.com` / `Admin@2026!`
- Base de datos PostgreSQL en `165.227.175.193:5432/sales_os` (user `botflow`)

## Fases V.L.A.E.G. — Estado retroactivo (actualizado con Protocolo v2)

- [x] **Fase 0** — Estructura `CLAUDE.md` (raíz) + `docs-veg/` creada
- [x] **Fase 1 — V** — 5 Preguntas respondidas retroactivamente desde el código (en `CLAUDE.md` § 1-3)
- [x] **Fase 1 — V** — JSON Schema de login en `CLAUDE.md` § 3
- [ ] **Fase 1 — V** — Schemas de payloads de integraciones (Bird, Brevo, etc.) PENDIENTES
- [ ] **Fase 2 — L** — Verificación formal de credenciales pendiente (`tools-veg/_check_<servicio>.py`)
- [ ] **Fase 3 — A** — Refactor a A.N.T. de 3 capas pendiente (deuda técnica reconocida en CLAUDE.md § 2)
- [x] **Fase 4 — E** — Login form aprobado por Eduardo (diseño verde WhatsApp confirmado en pantalla)
- [x] **Fase 5 — G** — Desplegado en producción + rollback documentado en `progress.md`

## Próximo paso bloqueante

Confirmar con Eduardo: cierre de Fase 4 (¿login funciona end-to-end en su navegador tras DNS flush?). Si sí → Fase 2 + Fase 3 son deuda no urgente.
