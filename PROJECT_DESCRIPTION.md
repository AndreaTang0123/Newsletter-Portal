# Newsletter Subscriber Portal — Project Description

## Overview

The Newsletter Subscriber Portal is BioCryst's internal administration platform for managing employee newsletter distribution lists. It gives curators and administrators a single, centralized place to maintain subscriber audiences, bulk-import contacts from CSV, edit individual subscriptions, track every change through a tamper-evident audit trail, and monitor audience health metrics — all through a modern, glassmorphism-styled web dashboard. A companion public self-service flow lets any recipient manage or cancel their own newsletter subscriptions without needing an account.

The system is a decoupled frontend/backend application hosted entirely on Azure:

- **Frontend** — Next.js, statically exported and served from **Azure Static Web Apps**.
- **Backend** — FastAPI REST API running on **Azure App Service** (Linux, Python).
- **Database** — **Azure Database for PostgreSQL Flexible Server**, reachable only over a private VNet.
- **Authentication** — **Microsoft Entra ID single sign-on**, restricted to `@biocryst.com` accounts. There is no local username/password login.

Both frontend and backend redeploy automatically via GitHub Actions on every push to `main`.

---

## Features

### 1. Sign-In (Microsoft Entra ID SSO)

- The landing screen is a single **"Sign in with Microsoft"** button — no separate password to remember.
- Clicking it redirects to your organization's Microsoft login. Access is restricted to `@biocryst.com` accounts; anyone outside the tenant/domain is rejected by the backend even if they somehow obtain a token.
- On first successful sign-in, the portal automatically creates your user record with the **Curator** role. An existing administrator must promote an account to **Admin** (in the database) if it needs to create or delete distribution lists.
- **Roles:**
  - **Curator** (default) — full access to view lists, manage subscriber rosters, run CSV imports, and read the audit log.
  - **Admin** — everything a Curator can do, plus creating and deleting distribution lists.
- **Sign out** is available under the **Settings** tab and ends your Microsoft session as well as the local app session.

---

### 2. Admin Dashboard

The landing page after sign-in, giving an at-a-glance summary of the subscriber database.

**What you see:**
- Four metric cards: Total distribution lists, Total subscribers, Active subscribers, and Bounced/Unsubscribed subscribers.
- A "Database last updated" timestamp with a manual refresh button.
- A **Recent Subscriber Changes** preview (latest audit log entries) with a "View Full Audit Trail" shortcut.

**How to use it:** Sign in — the dashboard loads automatically. Click the refresh icon to pull the latest metrics, or "View Full Audit Trail" to jump to the complete log.

---

### 3. Distribution Lists

Distribution lists are the core organizational unit — each one is a newsletter audience channel (e.g. *Weekly Newsletter*, *HAE*, *CMD*, *NS*).

**What you see:** All lists as cards in a responsive grid. Each card shows the owner, name, description, and a 2×2 breakdown of subscriber counts (Total / Active / Unsubscribed / Bounced), plus a last-updated date, a **Manage List** button, and (for Admins) a delete icon.

**How to use it:**
1. Go to **Distribution Lists** in the sidebar.
2. Click **Add New List** (Admin only) to create one — Name is required; Description and Owner are optional.
3. Click **Manage List** on any card to open its subscriber roster.
4. Deleting a list (Admin only) requires confirmation and permanently removes all of its subscriber associations.

---

### 4. List Detail View (Subscriber Management)

Full control over a single list's subscriber roster.

**What you can do:**
- Edit the list's **Owner** inline (pencil icon) and view its description.
- **Search** subscribers by name or email, and **filter by status** (All / Active / Paused / Unsubscribed / Bounced).
- **Add Subscriber** — a modal with Email (required), Full Name, Status, Source, Department, Role Title, and Internal Notes.
- **Edit** any subscriber via the same modal, pre-filled.
- **Remove** a subscriber from the list (with a confirmation prompt).
- **Export CSV** — downloads the current roster, including each subscriber's personal Unsubscribe and Manage Preferences links.
- Copy a subscriber's personal footer links (unsubscribe + manage-preferences URLs) straight to your clipboard from the row actions.

**How to use it:** From Distribution Lists, click **Manage List**, then use the search/filter bar, **Add Subscriber**, or the per-row edit/delete/copy-link icons as needed.

---

### 5. Master Subscribers Directory

A single, cross-list, read-only view of every unique subscriber in the system.

**What you see:** A searchable table (search matches name, email, department, or role) showing each subscriber's contact info and a chip per list they belong to, color-coded by status (green = Active, yellow = Paused, red = Bounced, gray = Unsubscribed).

**How to use it:** Go to **Master Subscribers**, and use the search bar to find anyone across all lists without opening each list individually.

---

### 6. CSV Bulk Import

A two-step preview-then-commit workflow for importing subscribers into a list from a CSV file.

**Step 1 — Upload & Preview:** Pick a target distribution list, upload a `.csv` file (drag-and-drop or file picker), and click **Parse & Preview CSV**. The backend validates every row and reports:
- **Valid (Ready)** — will be imported.
- **Duplicate (File)** — the email appears more than once in the uploaded file.
- **Duplicate (List)** — the email is already subscribed to this list.
- **Invalid** — malformed email or missing required data.

Summary tiles show Total Rows Detected, Valid & Ready, Duplicates Detected, and Invalid Rows.

**Step 2 — Commit:** Review the row-by-row table, then click **Commit Import** — only rows marked *Ready* are inserted; duplicates and invalid rows are skipped automatically.

**Supported CSV formats:**

| Format | Example |
|---|---|
| Combined name+email | `John Doe <john@company.com>` |
| Separate columns | Headers `name` and `email`, auto-mapped |
| Email only | `john@company.com` |

---

### 7. Audit Log Trail

A complete, searchable record of every subscriber-data change made through the portal.

**What you see:** Timestamp, Action (color-coded — e.g. green for additions, red for removals), Target Subscriber, List Name, Operator (or "System"), and Details, in one table with free-text search across all columns.

**How to use it:** Go to **Audit Logs** (or click "View Full Audit Trail" from the dashboard) and search for a specific subscriber, list, action, or operator.

---

### 8. Settings

- **Administrator Access Control** — explains the Curator vs. Admin roles and what each can do.
- **Sign out** button — ends both the app session and the underlying Microsoft session.

---

### 9. Public Self-Service Pages (no login required)

Two standalone pages, linked from every newsletter's email footer, that let any recipient manage their own subscriptions without an admin account:

- **Manage Preferences** (`/manage-preferences`) — look yourself up by email (or arrive via a personal link with a token pre-filled), then toggle each newsletter you're subscribed to on or off individually and save.
- **Unsubscribe** (`/unsubscribe`) — the same lookup, with a single "Unsubscribe from all" action for anyone who wants out of every list at once. Offers a link back to Manage Preferences to resubscribe.

`email-footer.html` at the repo root contains the ready-to-paste HTML snippet for these two links — copy it into whatever tool is used to compose and send the actual newsletter email.

---

## Database Schema

Managed via SQLAlchemy ORM against PostgreSQL:

```
User                 Subscriber              List
├── id (PK)          ├── id (PK)             ├── id (PK)
├── email (UK)       ├── name                ├── name (UK)
├── hashed_password  ├── email (UK)          ├── description
├── full_name        ├── department          ├── owner
├── role             ├── role_title          ├── category
├── is_active        ├── subscription_token  ├── created_at
├── created_at       ├── created_at          └── updated_at
└── updated_at       └── updated_at

Subscription                          AuditLog
├── id (PK)                           ├── id (PK)
├── list_id (FK → List)               ├── actor (email, nullable)
├── subscriber_id (FK → Subscriber)   ├── action
├── status                            ├── list_id (FK, nullable)
├── source                            ├── subscriber_id (FK, nullable)
├── opt_in_date                       ├── timestamp
├── unsubscribed_at                   └── details
├── notes
├── created_at
└── updated_at
```

`hashed_password` on `User` is a leftover from before Entra ID SSO — SSO-provisioned accounts get an unusable random placeholder value there rather than a real password, since sign-in no longer goes through it.

See [docs/database-schema.md](docs/database-schema.md) for the full ER diagram.

---

## API Endpoints

All endpoints are prefixed with `/api/v1`. Every endpoint except `self-service/*` requires `Authorization: Bearer <Entra ID access token>`; list creation and deletion additionally require the Admin role.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/me` | Return the signed-in user's identity (email, name, role) |
| GET | `/lists/` | List all distribution lists with stats |
| POST | `/lists/` | Create a new list *(Admin)* |
| GET | `/lists/{id}` | Get details for a specific list |
| PUT | `/lists/{id}` | Update a list |
| DELETE | `/lists/{id}` | Delete a list *(Admin)* |
| GET | `/lists/{id}/subscribers` | Get subscribers in a list (search/filter) |
| POST | `/lists/{id}/subscribers` | Add a subscriber to a list |
| PUT | `/subscriptions/{id}` | Update a subscription record |
| DELETE | `/subscriptions/{id}` | Remove a subscription |
| POST | `/imports/preview` | Upload CSV and get a validation preview |
| POST | `/imports/commit` | Commit validated rows to the database |
| GET | `/subscribers/` | Master subscriber directory across all lists |
| GET | `/audit-logs/` | Retrieve the full audit trail |
| GET | `/dashboard/stats` | Aggregate dashboard metrics |
| POST | `/self-service/lookup` | Public: look up a subscriber by email |
| GET | `/self-service/subscriber` | Public: fetch a subscriber's subscriptions by token |
| POST | `/self-service/unsubscribe` | Public: unsubscribe from every list |
| PUT | `/self-service/preferences` | Public: update individual list subscriptions |

---

## Deployment

| Component | Azure resource | Notes |
|---|---|---|
| Frontend | Static Web App (`biocryst-newsletter-static`) | Deploys automatically on push to `main` via GitHub Actions |
| Backend | App Service (`Biocryst-Newsletter`) | Python/FastAPI, deploys automatically on push to `main` via GitHub Actions |
| Database | PostgreSQL Flexible Server (`biocryst-newsletter-server`) | Private VNet access only, no public endpoint |
| Identity | Entra ID App Registration (`Biocryst-Newsletter`) | Single-tenant, restricted to `biocryst.com` |

---

## Known Limitations & Possible Future Work

| Area | Current State |
|---|---|
| Role assignment | New SSO users default to Curator; promoting to Admin is a manual database update |
| Automated newsletter sending | Not part of this app — newsletters are composed and sent externally, using `email-footer.html` for the self-service links |
| Test suite | No automated tests |
| Audit log filtering | Free-text search only, no date-range or action-type filter |
