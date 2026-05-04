# 0_init — baseline vazio (intencional)

> Este `migration.sql` está vazio de propósito. Não é bug. Não preencher.

## Por quê

A BD de produção `sales_os` em `165.227.175.193:5432` foi inicializada **antes**
de termos Prisma Migrate ativo no projeto (workflow legacy: `prisma db push`).
Quando adotamos `prisma migrate deploy` (V.L.A.E.G. Sprint 1), as 46 tabelas já
existiam em prod. Para fazer Prisma reconhecer o estado atual sem reaplicar
DDL, seguimos o pattern oficial de **baselining**:

1. Criar pasta `prisma/migrations/0_init/` com `migration.sql` vazio.
2. Marcar como aplicado em prod: `prisma migrate resolve --applied 0_init`.
3. Deltas posteriores (`20260503125259_add_lead_escalation`, etc.) ficam em
   migrations próprias e seguem o fluxo normal `prisma migrate deploy`.

Referência Prisma:
https://www.prisma.io/docs/orm/prisma-migrate/getting-started#baselining-a-database

## O que NÃO fazer

- ❌ Preencher este `migration.sql` com `CREATE TABLE`s — vai conflitar com as
  migrations posteriores que já adicionaram colunas/índices ao schema.
- ❌ Rodar `prisma migrate dev --create-only` para regenerar — quebra o
  baseline e faz drift contra prod.
- ❌ Deletar a pasta `0_init/` — quebra a cadeia de migrations registrada em
  `_prisma_migrations` em prod.

## O que fazer em ambiente greenfield (DB nova vazia)

```bash
# 1. Criar BD vazia
createdb sales_os_dev

# 2. Sincronizar schema do zero (não usa migrations, usa schema.prisma direto)
npx prisma db push

# 3. Marcar baseline como aplicado para que próximos `migrate deploy` funcionem
npx prisma migrate resolve --applied 0_init
npx prisma migrate resolve --applied 20260503125259_add_lead_escalation
npx prisma migrate resolve --applied 20260503153654_lead_lang_optional_and_notifications_sync

# 4. A partir daqui, deltas novos via `migrate dev` → `migrate deploy`
```

## Validação rápida

```bash
# Em prod, confirmar que o tracking está OK:
ssh -i ~/.ssh/id_ed25519 root@68.183.203.16
PGPASSWORD='BotFlowDB2026!' psql -h 165.227.175.193 -U botflow -d sales_os \
  -c 'SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at;'
```

Resultado esperado: `0_init` + 2 migrations posteriores, todas com `finished_at`
preenchido.

---

**Atualizado:** 2026-05-04
**Origem:** Sessão V.L.A.E.G. — fecha deuda #1 (baseline Prisma)
