-- Open tracking: unique token per outbound job, first-open timestamp, OPENED event type.

ALTER TYPE "OutboundMessageEventType" ADD VALUE 'OPENED';

ALTER TABLE "OutboundMessageJob"
ADD COLUMN "openTrackingToken" TEXT,
ADD COLUMN "openedAt" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "OutboundMessageJob_openTrackingToken_key" ON "OutboundMessageJob"("openTrackingToken");

UPDATE "OutboundMessageJob"
SET "openTrackingToken" = encode(gen_random_bytes(24), 'hex')
WHERE "openTrackingToken" IS NULL;
