-- Create enum for sequence enrollment status.
CREATE TYPE "SequenceEnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'STOPPED');

-- Sequences (workspace-scoped campaigns)
CREATE TABLE "Sequence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

-- Ordered steps with delays and templates (workspace-scoped)
CREATE TABLE "SequenceStep" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "sequenceId" UUID NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "delayMinutes" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "SequenceStep_pkey" PRIMARY KEY ("id")
);

-- Lead enrollments into sequences (workspace-scoped; used for queue scanning)
CREATE TABLE "SequenceEnrollment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "sequenceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "status" "SequenceEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "nextSendAt" TIMESTAMPTZ(6),
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),
    "stoppedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "SequenceEnrollment_pkey" PRIMARY KEY ("id")
);

-- Uniqueness constraints.
CREATE UNIQUE INDEX "SequenceStep_sequenceId_stepOrder_key" ON "SequenceStep"("sequenceId", "stepOrder");
CREATE UNIQUE INDEX "SequenceEnrollment_sequenceId_leadId_key" ON "SequenceEnrollment"("sequenceId", "leadId");

-- Performance indexes for scanning and workspace-scoped querying.
CREATE INDEX "Sequence_workspaceId_createdAt_idx" ON "Sequence"("workspaceId", "createdAt");
CREATE INDEX "Sequence_workspaceId_name_idx" ON "Sequence"("workspaceId", "name");
CREATE INDEX "SequenceStep_workspaceId_sequenceId_idx" ON "SequenceStep"("workspaceId", "sequenceId");
CREATE INDEX "SequenceEnrollment_workspaceId_status_nextSendAt_idx" ON "SequenceEnrollment"("workspaceId", "status", "nextSendAt");
CREATE INDEX "SequenceEnrollment_workspaceId_sequenceId_status_idx" ON "SequenceEnrollment"("workspaceId", "sequenceId", "status");
CREATE INDEX "SequenceEnrollment_workspaceId_leadId_idx" ON "SequenceEnrollment"("workspaceId", "leadId");

-- Foreign key constraints with cascading rules.
ALTER TABLE "Sequence"
    ADD CONSTRAINT "Sequence_workspaceId_fkey" FOREIGN KEY ("workspaceId")
    REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SequenceStep"
    ADD CONSTRAINT "SequenceStep_workspaceId_fkey" FOREIGN KEY ("workspaceId")
    REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SequenceStep"
    ADD CONSTRAINT "SequenceStep_sequenceId_fkey" FOREIGN KEY ("sequenceId")
    REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SequenceEnrollment"
    ADD CONSTRAINT "SequenceEnrollment_workspaceId_fkey" FOREIGN KEY ("workspaceId")
    REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SequenceEnrollment"
    ADD CONSTRAINT "SequenceEnrollment_sequenceId_fkey" FOREIGN KEY ("sequenceId")
    REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SequenceEnrollment"
    ADD CONSTRAINT "SequenceEnrollment_leadId_fkey" FOREIGN KEY ("leadId")
    REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

