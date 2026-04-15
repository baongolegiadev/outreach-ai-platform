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

| Flow                    | Goal                      | Primary entry                      | Notes         |
| ----------------------- | ------------------------- | ---------------------------------- | ------------- |
| Sign up / log in        | Access a workspace        | `/login`, `/register` [routes TBD] | FR-001–FR-004 |
| Import & manage leads   | Populate pipeline inputs  | Leads section                      | FR-020–FR-024 |
| Build & launch sequence | Automate multi-step email | Sequences section                  | FR-030–FR-034 |
| Review analytics        | Understand performance    | Dashboard                          | FR-060–FR-064 |
| Move lead on Kanban     | Reflect deal state        | Pipeline board                     | FR-070–FR-072 |

---

## Color tokens

| Token               | Value | Usage                  |
| ------------------- | ----- | ---------------------- |
| `color-primary-500` | [TBD] | Primary actions, links |
| `color-primary-600` | [TBD] | Primary hover          |
| `color-neutral-100` | [TBD] | Surfaces               |
| `color-neutral-900` | [TBD] | Body text              |
| `color-error-500`   | [TBD] | Errors                 |
| `color-success-500` | [TBD] | Success                |

---

## Typography scale

| Token            | Size  | Weight | Usage            |
| ---------------- | ----- | ------ | ---------------- |
| `text-heading-1` | [TBD] | [TBD]  | Page headings    |
| `text-heading-2` | [TBD] | [TBD]  | Section headings |
| `text-body`      | [TBD] | [TBD]  | Body             |
| `text-small`     | [TBD] | [TBD]  | Labels           |

---

## Imagery sources

v1 is **app-only**; marketing imagery is **[TBD]** if future public pages ship. Follow licensed sources per template policy when applicable.

---

## Spacing system

[TBD — e.g. 4px base grid]

---

## Component inventory

| Component  | Location | Status | Notes |
| ---------- | -------- | ------ | ----- |
| Button     | `src/components/ui/button.tsx` | ✅ Implemented | shadcn/ui with variants |
| Input      | `src/components/ui/input.tsx` | ✅ Implemented | shadcn/ui form inputs |
| Label      | `src/components/ui/label.tsx` | ✅ Implemented | shadcn/ui accessible labels |
| Data table | [TBD]    | Draft  | Leads |

---

## Tech Stack

- **CSS Framework**: Tailwind CSS v4.2.2 with CSS variables for theming
- **Component Library**: shadcn/ui with Radix UI primitives
- **Styling Approach**: Utility-first with design tokens
- **Color Scheme**: CSS custom properties with light/dark mode support

## Current Implementation

### Authentication Forms
- LoginForm and RegisterForm use shadcn/ui Button, Input, and Label components
- Error states use design system colors (`text-destructive`)
- Form validation with React Hook Form + Zod

### Color System
Uses CSS custom properties defined in `globals.css`:

| Token | Light Mode HSL | Usage |
|-------|----------------|-------|
| `--primary` | 221.2 83.2% 53.3% | Primary actions, buttons |
| `--destructive` | 0 84.2% 60.2% | Errors, destructive actions |
| `--muted` | 210 40% 96% | Subtle backgrounds |
| `--background` | 0 0% 100% | Main background |
| `--foreground` | 222.2 84% 4.9% | Main text |

---

## Interaction patterns

- **Loading states**: [TBD]
- **Error states**: [TBD]
- **Empty states**: [TBD]
- **Confirmations**: [TBD] destructive actions require confirmation
