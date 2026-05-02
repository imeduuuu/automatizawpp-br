# architecture/ — Capa 1 A.N.T. (POPs)

> Procedimientos Operativos Estándar (POPs). Define **cómo** se hacen las cosas en el proyecto.

## Estado actual

⚠️ **DEUDA TÉCNICA RECONOCIDA.** Esta carpeta está vacía porque AutomatizaWPP es un proyecto Next.js monolítico que NO sigue la arquitectura A.N.T. de 3 capas. La lógica de orquestación vive actualmente en:

- `src/app/api/**` — endpoints Next.js (mezcla orquestación + I/O + lógica)
- `src/lib/actions/` — server actions
- Workflows n8n externos (no commiteados al repo — deuda documental)

## Plan de migración (no urgente)

Cuando se decida refactorizar a A.N.T. de 3 capas:
1. Extraer orquestación de `src/app/api/**` a `architecture/<flujo>.md` (POP por flujo)
2. Cada POP describe: input → secuencia de tools → output
3. Documentar workflows n8n existentes como POPs aquí

## POPs pendientes de documentar

- [ ] POP de captación de lead (formulario web → DB → primer mensaje WhatsApp)
- [ ] POP de qualification (mensaje entrante → OpenAI → respuesta + tag)
- [ ] POP de email outreach (cron → segmento → Brevo → tracking)
- [ ] POP de voice call (lead caliente → Bird Voice → transcripción → tag)
- [ ] POP de password reset (form → token → email → reset)
- [ ] POP de signup → onboarding → asignación de servicios
