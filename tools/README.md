# tools/ — Capa 3 A.N.T.

Scripts atómicos y deterministas según Protocolo V.L.A.E.G.

## Reglas
- Una tool = una responsabilidad.
- Variables de entorno y tokens en `.env` (nunca hardcodeadas).
- Archivos intermedios usan `.tmp/`.
- Cada tool debe poder ejecutarse sola para testing.

## Pendientes (Fase 2 — Link)
- [ ] `_check_bird.py` — verificar API Bird (voice + WhatsApp + email channels)
- [ ] `_check_brevo.py` — verificar API Brevo email transaccional
- [ ] `_check_resend.py` — verificar API Resend (fallback email)
- [ ] `_check_openai.py` — verificar API OpenAI (gpt-4.1)
- [ ] `_check_postgres.py` — verificar conexión DB sales_os
- [ ] `_check_redis.py` — verificar conexión Redis
- [ ] `_check_smtp.py` — verificar SMTP Zoho
- [ ] `_check_imap.py` — verificar IMAP Zoho
