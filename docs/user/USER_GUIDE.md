<!--
DOCUMENT METADATA
Owner: @documentation-writer
-->

# Outreach AI Platform — User Guide

> Last updated: 2026-04-15  
> Version: 0.1.0

End-user documentation will expand as features ship (see `TODO.md`). Until the apps exist, this file is a **placeholder structure** aligned with the PRD.

---

## Getting Started

### Creating an Account

1. Open the web app URL for your environment.
2. Choose **Sign up** and complete registration.
3. Sign in and select or create a **workspace**.

Sign up fields:

- Workspace name (required)
- Full name (optional)
- Email (required)
- Password (minimum 8 characters)

### Logging In

1. Open the web app URL.
2. Enter email and password.
3. Choose **Log in**.

If credentials are invalid or the request fails, an inline error message appears in the form.

### Logging Out

1. Open the authenticated app area (`/app`).
2. Click **Log out** in the top-right header.
3. You will be redirected back to the login screen.

---

## Navigation

Current authenticated shell sections:

- Dashboard
- Leads (stub)
- Sequences (stub)
- Pipeline (stub)
- Analytics (stub)

---

## Features

### Leads

Use the **Leads** section in the app shell to create, filter, and edit workspace leads.

1. Open **Leads** from the left navigation.
2. In **Add lead**, enter name + email (required), optional company, and optional comma-separated tag IDs.
3. Use **Filters**:
   - `Search` matches name, email, and company.
   - `Company` narrows by company text.
   - `Tag IDs` filters leads by one or more tag UUIDs.
4. Use **Previous/Next** to paginate through large datasets.
5. Click **View** on a row to open lead detail editing:
   - Update name, email, company.
   - Replace lead tags via comma-separated tag IDs.
6. Use **Delete** to remove a lead from the workspace (confirmation required).

Notes:
- All lead operations are scoped to your active workspace.
- If a lead email already exists in the same workspace, the app shows a conflict error.
- Invalid tag IDs or tags outside your workspace return validation errors.

### Sequences

Use the **Sequences** section to build outbound campaigns made of ordered email steps, each with a delay and a template.

#### Creating a Sequence

1. Open **Sequences** from the left navigation.
2. In **New sequence name**, enter a name and click **Create**.
3. Select the sequence from **Your sequences** to open the builder.

#### Building Steps (Delay + Templates)

Each sequence contains one or more **steps**. Recommended minimum is **3 steps**.

1. Click **Add step** to append a new step.
2. For each step:
   - **Delay after previous step**: choose a numeric value and a unit (`minutes`, `hours`, `days`).
     - Step 1 (order 0) can be `0`.
     - Subsequent steps must have a delay of **at least 1 minute**.
   - **Subject** and **Body**: write templates using supported merge variables.
3. Click **Create step** (first save) or **Save changes** (updates).

Supported merge variables:

- `{{first_name}}`
- `{{company}}`

The builder shows a preview using example values so you can verify how templates render.

#### Enrolling Leads into a Sequence

Enrollment is triggered from the **Leads** page:

1. Open **Leads**.
2. In the leads table, tick the checkbox for one or more leads.
3. In **Enroll selected leads**, choose a sequence.
4. Click **Enroll selected**.

The app displays the enrollment result (created / skipped / invalid) after the request completes.

### Analytics

How to read opens, replies, funnel counts — [TBD].

### Pipeline

How to drag leads between **New**, **Contacted**, **Replied**, **Closed** — [TBD].

---

## Troubleshooting

| Message | Meaning | What to Do |
| ------- | ------- | ---------- |
| [TBD]   |         |            |

---

## FAQ

**Q: Where is my data stored?**  
A: In your team’s workspace in the cloud database configured for your deployment — [TBD link to security page].
