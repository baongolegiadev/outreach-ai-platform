#!/usr/bin/env node
/**
 * Task #012 — Integration: SENT job + pixel URL twice → openedAt + OPENED (idempotent).
 *
 * Run from repo root with env loaded (Node 20+):
 *   node --env-file=.env scripts/012-open-tracking/test-open-tracking-integration.mjs
 *   # or: scripts/012-open-tracking/test-open-tracking.sh --integration
 */

import { PrismaClient, OutboundMessageEventType, OutboundMessageStatus } from '@prisma/client';

const apiPublicUrl = process.env.API_PUBLIC_URL?.replace(/\/$/, '');
if (!apiPublicUrl) {
  console.error('Missing API_PUBLIC_URL (e.g. http://localhost:3001)');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const job = await prisma.outboundMessageJob.findFirst({
    where: {
      status: OutboundMessageStatus.SENT,
      openTrackingToken: { not: null },
    },
    orderBy: { sentAt: 'desc' },
  });

  if (!job) {
    console.log(
      'No SENT job with openTrackingToken. Send at least one sequence email first (e.g. scripts/011-outbound-mailer/test-queue.sh).',
    );
    process.exit(0);
  }

  const url = `${apiPublicUrl}/track/opens/${job.openTrackingToken}`;
  console.log(`Job ${job.id} — pixel URL (truncated): ${url.slice(0, 48)}…`);

  const beforeOpened = job.openedAt;
  const beforeOpenEvents = await prisma.outboundMessageEvent.count({
    where: {
      outboundMessageId: job.id,
      type: OutboundMessageEventType.OPENED,
    },
  });

  const res1 = await fetch(url);
  const buf1 = Buffer.from(await res1.arrayBuffer());
  const res2 = await fetch(url);
  const buf2 = Buffer.from(await res2.arrayBuffer());

  if (res1.status !== 200 || res2.status !== 200) {
    console.error(`Expected 200 from pixel, got ${res1.status} / ${res2.status}`);
    process.exit(1);
  }
  const ct = res1.headers.get('content-type') ?? '';
  if (!ct.includes('image/gif')) {
    console.error(`Expected Content-Type image/gif, got: ${ct}`);
    process.exit(1);
  }
  if (buf1.length !== buf2.length || buf1.length < 40) {
    console.error(`Unexpected GIF body length: ${buf1.length}`);
    process.exit(1);
  }

  const after = await prisma.outboundMessageJob.findUniqueOrThrow({
    where: { id: job.id },
  });
  const afterOpenEvents = await prisma.outboundMessageEvent.count({
    where: {
      outboundMessageId: job.id,
      type: OutboundMessageEventType.OPENED,
    },
  });

  if (beforeOpened && beforeOpenEvents >= 1) {
    console.log('Job was already opened; second pixel hit should not add events.');
    if (afterOpenEvents !== beforeOpenEvents) {
      console.error(`OPENED event count changed unexpectedly: ${beforeOpenEvents} -> ${afterOpenEvents}`);
      process.exit(1);
    }
    console.log('OK (idempotent behavior on already-opened job).');
    process.exit(0);
  }

  if (!after.openedAt) {
    console.error('openedAt was not set after first pixel load.');
    process.exit(1);
  }
  if (afterOpenEvents !== beforeOpenEvents + 1) {
    console.error(
      `Expected exactly one new OPENED event (${beforeOpenEvents} -> ${beforeOpenEvents + 1}), got ${afterOpenEvents}`,
    );
    process.exit(1);
  }

  console.log('OK — first open recorded (openedAt + OPENED event). Second request did not duplicate.');
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
