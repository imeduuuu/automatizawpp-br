-- Sprint 2.4-A V.L.A.E.G. — fecha deuda #4
-- Adiciona campos dedicados de escalonamento humano ao modelo Lead.
-- Substitui o workaround `nextAction='ESCALATED'` por flags reais consultáveis por índice.

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "escalated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "escalatedAt" TIMESTAMP(3);
