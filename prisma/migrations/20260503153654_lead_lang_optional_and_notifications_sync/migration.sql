-- Limpieza V.L.A.E.G. — fecha deudas #1 e #2.
--
-- Deuda #1: A migration `add_notifications_schema` falhou parcialmente em produção
-- (ficou marcada como aplicada sem que o DDL fosse executado por completo). Esta
-- migration garante a existência das tabelas/enums Notification* de forma idempotente
-- e sincroniza o `prisma/schema.prisma` com a DB.
--
-- Deuda #2: `Lead.preferredLanguage` deixa de ser NOT NULL com default 'es' para
-- aceitar null como "ainda não detectado". Isto permite que a auto-detecção do
-- Sprint 3.4 funcione naturalmente para leads novos sem flag `isNewLead`.

-- AlterEnum: adiciona NOTIFICATION ao ChannelType (idempotente).
DO $$ BEGIN
  ALTER TYPE "ChannelType" ADD VALUE 'NOTIFICATION';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum NotificationChannel (idempotente).
DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'IN_APP', 'SLACK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum NotificationPriority (idempotente).
DO $$ BEGIN
  CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum NotificationStatus (idempotente).
DO $$ BEGIN
  CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum NotificationTemplate (idempotente).
DO $$ BEGIN
  CREATE TYPE "NotificationTemplate" AS ENUM (
    'LEAD_CREATED',
    'LEAD_QUALIFIED',
    'LEAD_HIGH_INTENT',
    'LEAD_VIP',
    'EMAIL_FAILED',
    'CALL_COMPLETED',
    'FOLLOW_UP_SENT',
    'SYSTEM_ERROR',
    'SYSTEM_HEALTH',
    'OPPORTUNITY_HIGH_VALUE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable Notification.
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT,
  "leadId" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
  "template" "NotificationTemplate" NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "recipientEmail" TEXT,
  "recipientPhone" TEXT,
  "recipientSlackId" TEXT,
  "metadata" JSONB,
  "sentAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL,
  CONSTRAINT "Notification_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL
);

-- CreateTable NotificationPreference.
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "leadCreated" BOOLEAN NOT NULL DEFAULT true,
  "leadQualified" BOOLEAN NOT NULL DEFAULT true,
  "leadHighIntent" BOOLEAN NOT NULL DEFAULT true,
  "leadVip" BOOLEAN NOT NULL DEFAULT true,
  "emailFailed" BOOLEAN NOT NULL DEFAULT true,
  "callCompleted" BOOLEAN NOT NULL DEFAULT false,
  "followUpSent" BOOLEAN NOT NULL DEFAULT false,
  "systemError" BOOLEAN NOT NULL DEFAULT true,
  "systemHealth" BOOLEAN NOT NULL DEFAULT false,
  "opportunityHighValue" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationPreference_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE,
  CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateTable NotificationTemplateConfig.
CREATE TABLE IF NOT EXISTS "NotificationTemplateConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "templateType" "NotificationTemplate" NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "subject" TEXT,
  "titleTemplate" TEXT NOT NULL,
  "messageTemplate" TEXT NOT NULL,
  "htmlTemplate" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationTemplateConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE
);

-- Indexes (idempotente).
CREATE INDEX IF NOT EXISTS "Notification_workspaceId_idx" ON "Notification"("workspaceId");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_leadId_idx" ON "Notification"("leadId");
CREATE INDEX IF NOT EXISTS "Notification_channel_status_idx" ON "Notification"("channel", "status");
CREATE INDEX IF NOT EXISTS "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "NotificationPreference_workspaceId_userId_idx" ON "NotificationPreference"("workspaceId", "userId");
CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_channel_idx" ON "NotificationPreference"("userId", "channel");
CREATE INDEX IF NOT EXISTS "NotificationTemplateConfig_workspaceId_templateType_idx" ON "NotificationTemplateConfig"("workspaceId", "templateType");

-- Deuda #2: Lead.preferredLanguage opcional.
ALTER TABLE "Lead" ALTER COLUMN "preferredLanguage" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "preferredLanguage" DROP NOT NULL;
