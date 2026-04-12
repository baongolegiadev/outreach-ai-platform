# Product Requirements Document

> [!WARNING]
> **HUMAN APPROVAL REQUIRED TO EDIT**
> This document is the source of truth for what we are building.
> Claude agents must READ this document to understand requirements.
> **Do not edit, rewrite, or "update to reflect current state" unless the human has explicitly instructed you to do so in the current conversation.**
> When in doubt, leave it unchanged and ask the human.

---

**Version**: 1.0  
**Status**: Draft  
**Last updated by human**: 2026-04-12  
**Product owner**: Founder (solo product owner — feature priority, scope, release timing, v1 vs v2)

---

## 1. Executive Summary

Outreach AI Platform is an **email-first outbound SaaS** for sales and growth teams. It centralizes **lead management**, **multi-step email sequences** with delays and merge fields, **queued outbound delivery** with retries and per-inbox rate limiting, **reply detection** to stop sequences and record status, **analytics**, a **lightweight Kanban pipeline** (New → Contacted → Replied → Closed), and an **activity log**—designed for **real daily usage**, not a throwaway demo.

Primary users are **SDRs, broader sales teams, founders, and growth/marketing teams** who today juggle Excel/LinkedIn exports, manual one-by-one email, and inconsistent follow-up. The intended outcome is **faster, measurable outbound** with fewer missed replies and a clear view of funnel health per workspace.

---

## 2. Problem Statement

### 2.1 Current Situation

Teams source leads from **CSV/Excel exports**, **LinkedIn**, and ad-hoc lists. Outreach is often sent **manually** from personal inboxes or basic mail-merge tools. Tracking who was contacted, who opened, who replied, and who should advance in the funnel is **spread across spreadsheets, labels, and memory**.

### 2.2 The Problem

This workflow **does not scale** beyond a handful of leads: time is lost on copy-paste and context switching, **follow-ups are missed**, there is **little standardized insight** into open/reply rates, and **ownership across the revenue funnel** is unclear. Multi-person teams lack a **shared, workspace-scoped system of record** for outbound motion.

### 2.3 Why Now

Outbound remains a primary GTM channel; teams expect **product-grade reliability** (queues, retries, rate limits) and **clear engagement signals** without committing to heavy CRM implementations. Mature building blocks (PostgreSQL, managed hosting, SMTP and Gmail APIs) make it feasible to ship a **focused v1** that solves the core loop: **import → sequence → send → detect reply → measure → move stage**.

---

## 3. Goals & Success Metrics

### 3.1 Business Goals

- Deliver a **production-usable** v1 that supports the full core loop for at least one real workspace under daily load.
- Establish **multi-tenant safety** and **auditability** as non-negotiable baselines for future scale.
- Reach a quality bar where the product is **trustworthy for real pipelines** (not demo-only UX or flaky sending).

### 3.2 Success Metrics

| Metric | Baseline | Target | How Measured |
|--------|----------|--------|----------------|
| Core loop completion | N/A | A workspace can import leads, run a 3-step sequence, record sends/opens/replies, and move leads on the Kanban without manual DB fixes | QA scenarios + dogfood |
| API latency (standard CRUD) | N/A | p95 under 300 ms under normal local/staging load | APM or server logs / load script |
| Send reliability | N/A | Automatic retries (≥3) for transient failures; failures visible in logs/UI | Queue metrics + UI surfacing |
| Scale posture | N/A | Architecture and indexing approach documented for **10k–100k leads per workspace** | Schema review + load test [TBD timing] |

---

## 4. User Personas

### Persona: Riley the SDR

- **Role**: Sales Development Representative  
- **Goals**: Work a high volume of leads with consistent follow-up; know who replied and who to call next.  
- **Pain points**: Manual tracking, missed steps, unclear handoff when someone responds.  
- **Technical level**: Moderate (SaaS-native, not an engineer).  
- **Usage frequency**: Daily.

### Persona: Morgan the Sales Lead

- **Role**: Sales manager or head of outbound  
- **Goals**: See team-level funnel health, campaign performance, and bottlenecks.  
- **Pain points**: No single dashboard for opens/replies/stages; hard to coach without data.  
- **Technical level**: Moderate.  
- **Usage frequency**: Daily to weekly.

### Persona: Casey the Founder / Growth Lead

- **Role**: Founder or growth/marketing owner (also **product owner** for this repo)  
- **Goals**: Ship and iterate fast; keep scope disciplined; ensure the system is dependable for early customers.  
- **Pain points**: Over-scoped products, brittle email plumbing, unclear priorities.  
- **Technical level**: Moderate to high.  
- **Usage frequency**: Daily during build; ongoing for prioritization.

---

## 5. Functional Requirements

> Requirements are numbered FR-XXX for cross-referencing in tasks and tests.

### 5.1 Authentication & sessions

- **FR-001**: Users can **sign up** with email and password (or equivalent secure registration flow documented at implementation).  
- **FR-002**: Users can **log in** and receive credentials suitable for **JWT-based API authentication**.  
- **FR-003**: Users can **log out** in a way that ends the server-recognized session or invalidates refresh semantics as defined in implementation docs.  
- **FR-004**: All **non-public API routes** require a valid **JWT** (or paired access/refresh model if adopted—must be documented in `docs/technical/API.md`).

### 5.2 Workspaces & access control

- **FR-010**: The system supports **multi-tenant workspaces** (organizations). All domain data is associated with a `workspace_id` (or equivalent).  
- **FR-011**: A user can belong to **one or more workspaces** with membership records.  
- **FR-012**: Each membership has a **role** of at least **Admin** or **Member** with documented permissions (Admin: manage workspace settings and members; Member: operate leads/sequences within policy).  
- **FR-013**: **Cross-tenant data access is impossible** through normal API usage (authorization checks on every relevant query).  
- **FR-014**: Workspace **Admin** can **invite/add members** and assign roles within the rules above.

### 5.3 Lead management

- **FR-020**: Users can **create, view, edit, and delete** leads within a workspace.  
- **FR-021**: Leads support fields **name**, **email**, and **company** (extensible later without breaking v1 contracts).  
- **FR-022**: Users can **import leads from CSV** with validation; partial failures are reported clearly.  
- **FR-023**: Users can **search and filter** leads.  
- **FR-024**: Users can apply **tags** to leads and **filter by tags**.

### 5.4 Email sequences (campaigns)

- **FR-030**: Users can **create, edit, and delete** email sequences (campaigns) scoped to a workspace.  
- **FR-031**: A sequence consists of **ordered steps**, each with **email body/subject** (or template reference) and a **delay** before the next step sends.  
- **FR-032**: v1 supports at least a **3-step** sequence (step 1 → delay → step 2 → delay → step 3).  
- **FR-033**: Sequences support personalization variables **`{{first_name}}`** and **`{{company}}`** resolved at send time from lead fields.  
- **FR-034**: Users can **assign or enroll leads** into a sequence; enrollment state is visible and auditable.

### 5.5 Outbound sending

- **FR-040**: The system can send outbound mail via **SMTP** and/or **Gmail API** as configured per workspace or sending identity (exact model documented in ADR/API docs).  
- **FR-041**: Send requests are **queued and processed asynchronously**—API calls do not block on remote SMTP completion.  
- **FR-042**: Failed sends are **retried automatically** at least **three** times with a documented backoff policy.  
- **FR-043**: Sending enforces **per-inbox (or per-identity) rate limits** to protect domain reputation.

### 5.6 Reply tracking & conversation status

- **FR-050**: The system can **detect inbound replies** for leads in active sequences via an implementation approach documented in open questions (webhook, polling, or provider integration).  
- **FR-051**: When a reply is detected, **active sequence enrollment for that lead stops** automatically.  
- **FR-052**: Each lead has a **conversation/reply status** (e.g. none / replied) updated when a reply is detected.

### 5.7 Analytics

- **FR-060**: Dashboard shows **emails sent** (aggregate per workspace or filterable scope—define in task).  
- **FR-061**: Dashboard shows **open rate** (opens / sends for selected scope).  
- **FR-062**: Dashboard shows **reply rate**.  
- **FR-063**: Dashboard shows count of **active campaigns/sequences**.  
- **FR-064**: Dashboard shows **lead funnel** counts across **New → Contacted → Replied → Closed** (or mapped internal stage names).

### 5.8 Pipeline (light CRM)

- **FR-070**: Kanban board displays columns **New**, **Contacted**, **Replied**, **Closed**.  
- **FR-071**: Users can **drag and drop** leads to change stage; change is persisted and logged (see FR-080 series).  
- **FR-072**: Stage transitions respect workspace scope and permissions.

### 5.9 Activity log

- **FR-080**: The system records activities including at minimum: **email sent**, **email opened**, **reply received**, **stage change**.  
- **FR-081**: Users can view an **activity timeline** per lead and/or workspace-level feed as specified in UX tasks.

---

## 6. Non-Functional Requirements

### Performance

- Standard **CRUD API** endpoints: **p95 &lt; 300 ms** under normal operation for typical list/detail payloads.  
- Outbound send path: **non-blocking** from the caller’s perspective (queued processing).

### Scalability

- Design for **10k–100k leads per workspace** in v1 (indexing, pagination, and bulk operations considered in schema tasks).  
- Queue must tolerate **burst sending** within configured rate limits.

### Security

- **JWT authentication** for API access.  
- **Strict workspace isolation** on every mutating and sensitive read operation.  
- **Basic audit log** for security-relevant actions (member changes, sending identity changes—detail in implementation).

### Reliability

- **Email retries** (≥3) for transient failures.  
- **Failed job visibility**: dead-letter or equivalent listing/logging for operator debugging.

### Browser / platform

- Support **latest Chrome, Safari, and Firefox**.  
- **Responsive** dashboard with **desktop-first** UX.

### Accessibility

- **[TBD]** Target WCAG level for v1 (recommend AA for primary flows) — confirm with @ui-ux-designer during design tasks.

---

## 7. Out of Scope (v1.0)

- **LinkedIn automation** (connect/message bots).  
- **SMS / WhatsApp / multi-channel** outreach beyond email.  
- **Voice AI / dialer**.  
- **CRM integrations** (HubSpot, Salesforce, etc.).  
- **Native mobile apps**.  
- **AI agents auto-sending** without explicit human-approved triggers per send batch or campaign rules.  
- **Advanced AI forecasting / revenue prediction**.  
- **Chrome extension**.  
- **Real-time chat** support system.  
- **Public marketing website, SEO program, and long-form brand copy** (v1 is app-only; UI strings only).

---

## 8. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | **Inbound reply detection**: Gmail push vs IMAP polling vs third-party email API webhooks—what is the v1 implementation? | Product owner / @systems-architect | Open |
| 2 | **Queue & broker**: Confirm **Redis (e.g. BullMQ)** on Railway vs managed alternative. | Product owner / @systems-architect | Open |
| 3 | **Open tracking**: pixel-based opens vs provider events; handling privacy blockers? | Product owner / @ui-ux-designer | Open |
| 4 | **Password reset / email verification** in v1? | Product owner | Open |
| 5 | **Sending identity model**: per-user mailbox vs shared workspace mailbox—permissions and secrets storage. | Product owner / @backend-developer | Open |

---

## 9. Revision History

| Date | Author | Change Description |
|------|--------|--------------------|
| 2026-04-12 | Founder | Initial PRD from onboarding (Phases 2–4). |
