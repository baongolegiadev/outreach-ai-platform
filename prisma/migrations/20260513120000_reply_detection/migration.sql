-- Reply detection (task #013): lead reply state + dedupe for inbound webhooks

CREATE TYPE "LeadReplyStatus" AS ENUM ('NONE', 'REPLIED');

ALTER TABLE "Lead" ADD COLUMN "replyStatus" "LeadReplyStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Lead" ADD COLUMN "repliedAt" TIMESTAMPTZ(6);

CREATE TABLE "ProcessedInboundReply" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID NOT NULL,
    "externalMessageId" TEXT NOT NULL,
    "leadId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedInboundReply_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProcessedInboundReply_workspaceId_externalMessageId_key" UNIQUE ("workspaceId", "externalMessageId"),
    CONSTRAINT "ProcessedInboundReply_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessedInboundReply_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ProcessedInboundReply_workspaceId_leadId_idx" ON "ProcessedInboundReply"("workspaceId", "leadId");
