-- CreateEnum
CREATE TYPE "OutboundMessageStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "OutboundMessageProvider" AS ENUM ('SMTP', 'GMAIL_STUB');

-- CreateEnum
CREATE TYPE "OutboundMessageEventType" AS ENUM ('QUEUED', 'SENT', 'RETRY_SCHEDULED', 'DEAD_LETTER');

-- CreateTable
CREATE TABLE "OutboundMessageJob" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "sequenceId" UUID NOT NULL,
    "sequenceStepId" UUID NOT NULL,
    "sequenceEnrollmentId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "provider" "OutboundMessageProvider" NOT NULL DEFAULT 'SMTP',
    "inboxIdentity" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "status" "OutboundMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMPTZ(6),
    "deadLetteredAt" TIMESTAMPTZ(6),
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OutboundMessageJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundMessageAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "outboundMessageId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "transientError" BOOLEAN NOT NULL,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboundMessageAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundMessageEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "outboundMessageId" UUID NOT NULL,
    "type" "OutboundMessageEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboundMessageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboundMessageJob_workspaceId_status_nextAttemptAt_idx" ON "OutboundMessageJob"("workspaceId", "status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "OutboundMessageJob_inboxIdentity_status_nextAttemptAt_idx" ON "OutboundMessageJob"("inboxIdentity", "status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutboundMessageJob_sequenceEnrollmentId_sequenceStepId_key" ON "OutboundMessageJob"("sequenceEnrollmentId", "sequenceStepId");

-- CreateIndex
CREATE INDEX "OutboundMessageAttempt_outboundMessageId_createdAt_idx" ON "OutboundMessageAttempt"("outboundMessageId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboundMessageEvent_outboundMessageId_createdAt_idx" ON "OutboundMessageEvent"("outboundMessageId", "createdAt");

-- AddForeignKey
ALTER TABLE "OutboundMessageJob" ADD CONSTRAINT "OutboundMessageJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessageJob" ADD CONSTRAINT "OutboundMessageJob_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessageJob" ADD CONSTRAINT "OutboundMessageJob_sequenceStepId_fkey" FOREIGN KEY ("sequenceStepId") REFERENCES "SequenceStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessageJob" ADD CONSTRAINT "OutboundMessageJob_sequenceEnrollmentId_fkey" FOREIGN KEY ("sequenceEnrollmentId") REFERENCES "SequenceEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessageAttempt" ADD CONSTRAINT "OutboundMessageAttempt_outboundMessageId_fkey" FOREIGN KEY ("outboundMessageId") REFERENCES "OutboundMessageJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessageEvent" ADD CONSTRAINT "OutboundMessageEvent_outboundMessageId_fkey" FOREIGN KEY ("outboundMessageId") REFERENCES "OutboundMessageJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
