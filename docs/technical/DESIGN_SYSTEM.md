<!--
DOCUMENT METADATA
Owner: @ui-ux-designer
Other agents: read-only unless you are @ui-ux-designer.
-->

# Design system and UX specifications

> Last updated: 2026-04-12  
> Version: 0.1.0

Canonical design language, component inventory, interaction patterns, and summaries of major user journeys. Feature-level UI specs may also live in `.tasks/` files.

---

## Key user flows

| Flow | Goal | Primary entry | Notes |
|------|------|---------------|-------|
| Sign up / log in | Access a workspace | `/login`, `/register` [routes TBD] | FR-001–FR-004 |
| Import & manage leads | Populate pipeline inputs | Leads section | FR-020–FR-024 |
| Build & launch sequence | Automate multi-step email | Sequences section | FR-030–FR-034 |
| Review analytics | Understand performance | Dashboard | FR-060–FR-064 |
| Move lead on Kanban | Reflect deal state | Pipeline board | FR-070–FR-072 |

---

## Color tokens

| Token | Value | Usage |
|-------|-------|-------|
| `color-primary-500` | [TBD] | Primary actions, links |
| `color-primary-600` | [TBD] | Primary hover |
| `color-neutral-100` | [TBD] | Surfaces |
| `color-neutral-900` | [TBD] | Body text |
| `color-error-500` | [TBD] | Errors |
| `color-success-500` | [TBD] | Success |

---

## Typography scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-heading-1` | [TBD] | [TBD] | Page headings |
| `text-heading-2` | [TBD] | [TBD] | Section headings |
| `text-body` | [TBD] | [TBD] | Body |
| `text-small` | [TBD] | [TBD] | Labels |

---

## Imagery sources

v1 is **app-only**; marketing imagery is **[TBD]** if future public pages ship. Follow licensed sources per template policy when applicable.

---

## Spacing system

[TBD — e.g. 4px base grid]

---

## Component inventory

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| Button | [TBD] | Draft | |
| Input | [TBD] | Draft | |
| Data table | [TBD] | Draft | Leads |

---

## Interaction patterns

- **Loading states**: [TBD]  
- **Error states**: [TBD]  
- **Empty states**: [TBD]  
- **Confirmations**: [TBD] destructive actions require confirmation
