# Newsletter Subscriber Portal — Project Description

## Overview

The Newsletter Subscriber Portal is an AI-powered administration platform for managing internal email newsletter distribution lists. It provides curators and administrators with a centralized environment to maintain subscriber audiences, import contacts in bulk, edit individual subscriptions, track all changes through a tamper-evident audit trail, and monitor audience health metrics — all through a modern, glassmorphism-styled web dashboard.

The system is built as a decoupled frontend/backend application. The **Next.js** frontend communicates with a **FastAPI** REST backend over HTTP, authenticated via JWT tokens. Data is persisted in a relational database (SQLite locally, with a documented migration path to Azure SQL Database for production).

---

## Features

### 1. Authentication & Session Management

The portal is a protected application. All administrative actions require authentication.

- **Login page** — A split-panel interface: the left panel describes the portal's purpose; the right panel presents a sign-in form.
- **JWT-based authentication** — On successful login, the backend issues a signed JWT access token. The frontend stores this token in `localStorage` and attaches it as a `Bearer` token on all subsequent API requests.
- **Seeded admin account** — The backend automatically creates a default admin user on first startup:
  - Email: `curator@company.com`
  - Password: `securepassword123`
- **User roles** — Two roles exist: **Admin** (full write access, list creation, manual overrides) and **Curator** (view metadata, manage memberships, run imports, download reports).
- **Sign-out** — Available under the **Settings** tab. Clears the JWT from local storage and returns the user to the login screen.
- **Microsoft Entra ID SSO** — A disabled button is present on the login screen as a placeholder for future Azure AD integration.

---

### 2. Admin Dashboard

The dashboard is the landing page after sign-in. It provides an at-a-glance summary of the subscriber database.

**What you see:**

- **Metric cards** — Four summary cards displaying:
  - Total distribution lists
  - Total subscribers (across all lists)
  - Active subscribers
  - Bounced / unsubscribed subscribers
- **Database last-updated timestamp** — Shows the most recent modification date with a manual refresh button.
- **Recent Subscriber Changes** — A preview table showing the latest audit log entries (timestamp, action, list, subscriber email, operator). Includes a "View Full Audit Trail" button to jump to the complete audit log.

**How to use it:**

1. Sign in with your credentials.
2. The dashboard loads automatically.
3. Click the refresh icon (↻) next to the timestamp to reload live metrics from the backend.
4. Click "View Full Audit Trail" to navigate to the full audit log page.

---

### 3. Distribution Lists

Distribution lists are the core organizational unit. Each list represents a newsletter audience channel (e.g., *Weekly CI Newsletter*, *HAE Alerts*, *CMD Alerts*, *NS Alerts*).

**List Overview Page:**

- Displays all lists as **cards** in a responsive grid layout.
- Each card shows:
  - List name and description
  - Category tag (e.g., `Newsletter`, `Alert`)
  - Owner name
  - Subscriber breakdown: total, active, unsubscribed, bounced
  - Last-updated date
  - "Manage List" button to open the detail view

**How to use it:**

1. Navigate to **Distribution Lists** in the sidebar.
2. Review the card grid to see all available lists and their health metrics.
3. Click **Manage List** on any card to drill into that list's subscriber roster.

---

### 4. List Detail View (Subscriber Management)

The detail view for a distribution list provides full CRUD control over its subscriber roster.

**Capabilities:**

- **Subscriber table** — Displays all subscribers in the list with columns: Name, Email, Status, Source, Date Added, Last Updated, Notes, and Actions (Edit / Delete).
- **Search** — Real-time search by name or email address.
- **Status filter** — Dropdown to filter subscribers by status: All, Active, Paused, Unsubscribed, or Bounced.
- **Add Subscriber** — Opens a modal form to manually add a subscriber with fields: Email (required), Full Name, Status, Source, Department, Role Title, and Internal Notes.
- **Edit Subscriber** — Opens the same modal pre-populated with existing data. Edit any field and save changes.
- **Remove Subscriber** — Deletes the subscription from the list with a confirmation prompt.
- **Export CSV** — Generates a CSV file of all current subscribers in the list (Name, Email, Status, Source, Date Added, Last Updated, Notes, Department, Role Title) and triggers a browser download.
- **Back navigation** — Arrow button returns to the Distribution Lists overview.

**How to use it:**

1. From the Distribution Lists page, click **Manage List** on a list card.
2. Use the search bar and status dropdown to filter the roster.
3. Click **Add Subscriber** to add a new contact manually.
4. Click the pencil icon (✏) on any row to edit that subscriber's details.
5. Click the trash icon (🗑) on any row to remove them from the list.
6. Click **Export CSV** to download the current list as a spreadsheet.

---

### 5. Master Subscribers Directory

A global, cross-list view of every unique subscriber in the system.

**What you see:**

- A searchable table with columns: Name, Email, Department & Role, List Subscriptions & Statuses, and Last Modified.
- Each subscriber's row shows **all lists they belong to** as inline chips with color-coded status indicators:
  - 🟢 Green = Active
  - 🟡 Yellow = Paused
  - 🔴 Red = Bounced
  - ⚫ Gray = Unsubscribed
- **Search** — Filter the directory by name, email, department, or role title.

**How to use it:**

1. Navigate to **Master Subscribers** in the sidebar.
2. Use the search bar to locate any subscriber across all lists.
3. Review their subscription statuses at a glance — no need to open each list individually.

---

### 6. CSV Bulk Import

Import subscribers into a distribution list from a CSV file with a two-step preview-then-commit workflow.

**Step 1 — Upload & Preview:**

- Select a **target distribution list** from a dropdown.
- Upload a `.csv` file via drag-and-drop or file picker.
- Click **Parse & Preview CSV** to send the file to the backend for validation.
- The backend parses the CSV and returns a preview with row-level validation:
  - **Valid (Ready)** — Clean row, will be imported.
  - **Duplicate (File)** — Email appears more than once in the uploaded file.
  - **Duplicate (List)** — Email already exists in the target list.
  - **Invalid** — Malformed email or missing required data.
- Summary metric cards show: Total Rows Detected, Valid & Ready, Duplicates Detected, Invalid Rows.

**Step 2 — Commit:**

- Review the preview table.
- Click **Commit Import** to insert only the valid rows into the database.
- Duplicates and invalid rows are automatically skipped.
- A success message confirms the number of imported subscribers.

**Supported CSV formats:**

| Format | Example |
|--------|---------|
| Unified column | `John Doe <john@company.com>` — name and email are auto-split |
| Separate columns | Headers `email` and `name` — values are auto-mapped |
| Email only | `john@company.com` — imported without a name |

**How to use it:**

1. Navigate to **Import CSV** in the sidebar.
2. Select the target list from the dropdown.
3. Upload your CSV file.
4. Click **Parse & Preview CSV** and review the validation results.
5. If satisfied, click **Commit Import** to finalize.

---

### 7. Audit Log Trail

A complete, searchable log of every modification made to subscriber data.

**What you see:**

- A full-width table with columns: Timestamp, Action, Target Subscriber, List Name, Operator, and Details.
- **Actions tracked** include: Subscriber added, Subscriber removed, List imported, Subscription updated, and more.
- Color-coded action labels:
  - 🟢 Green = Subscriber added
  - 🔴 Red = Subscriber removed
  - 🟢 Teal = List imported
- **Search** — Filter by action type, email, list name, operator, or details text.
- **Refresh** — Manual reload button to fetch the latest entries.

**How to use it:**

1. Navigate to **Audit Logs** in the sidebar (or click "View Full Audit Trail" from the dashboard).
2. Use the search bar to filter for specific events.
3. Review timestamps and operators for compliance or troubleshooting.

---

### 8. Settings

The Settings page shows system configuration and access control information.

**What you see:**

- **Administrator Access Control** — Describes the two roles (Admin and Curator) and their permissions.
- **Centralized Database Configurations** — Shows the current database engine (SQLite 3), the target cloud database (Azure SQL Database with ODBC Driver 17), and the number of configured channels.
- **Sign Out** button — Ends the session and returns to the login screen.

**How to use it:**

1. Click the **Settings** icon in the sidebar or the gear icon in the top navbar.
2. Review role definitions and database status.
3. Click **Sign Out** to log out.

---

### 9. Self-Service Unsubscribe Page

A public-facing page that allows email recipients to manage their subscription preferences directly — no login required.

**What you see:**

- A clean, standalone card UI (no admin chrome).
- Email input field (auto-populated if `?email=` query parameter is provided in the URL).
- Checkboxes for each newsletter category (e.g., Engineering Updates, HR Announcements, Marketing & Events).
- A "Save Preferences" button.
- A success confirmation screen after saving.

**How to use it:**

- Subscribers access this page via a link embedded in their newsletter email footers.
- Direct URL: `http://localhost:3000/unsubscribe?email=user@company.com`
- Deselect any categories they no longer wish to receive, then click **Save Preferences**.

---

### 10. AI-Powered Draft Generation (Scaffolded)

The system includes scaffolded integration with Google's Gemini LLM for generating newsletter content drafts.

- **Frontend component** — `AIDraftWizard.tsx` provides a UI for inputting topics, article links, and preferred tone.
- **Backend endpoint** — `POST /api/v1/ai/generate` routes to `ai_service.py`.
- **Configuration** — Requires a `GEMINI_API_KEY` in the backend `.env` file.

> **Status:** The AI service is scaffolded but not fully wired for production use.

---

### 11. Email Dispatch (Scaffolded)

SMTP email sending is scaffolded for newsletter delivery.

- **Backend service** — `email_service.py` contains the SMTP integration logic.
- **Configuration** — Requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` in the backend `.env` file.
- **Backend endpoint** — `POST /api/v1/email/send` triggers email dispatch.

> **Status:** The email service is scaffolded and may require production SMTP credentials to function.

---

### 12. Newsletter History & Analytics (Scaffolded)

- **Frontend component** — `NewsletterHistory.tsx` provides a UI for viewing past newsletters with delivery metrics (sent, opened, bounced).
- **Backend routers** — `newsletters.py` handles newsletter CRUD, and `statistics.py` provides aggregate dashboard metrics.
- **Data model** — The `CampaignHistory` table tracks per-subscriber delivery status for each newsletter.

> **Status:** The newsletter editor and history components exist in the frontend but are not exposed in the current sidebar navigation.

---

## Database Schema

The relational schema (managed via SQLAlchemy ORM) consists of the following core entities:

```
User                 Subscriber              DistributionList
├── id (PK)          ├── id (PK)             ├── id (PK)
├── email (UK)       ├── email (UK)          ├── name
├── hashed_password  ├── name                ├── description
├── full_name        ├── department          ├── owner
├── role             ├── role_title          ├── category
└── is_active        └── updated_at          ├── created_at
                                             └── updated_at

Subscription                    AuditLog
├── id (PK)                     ├── id (PK)
├── subscriber_id (FK)          ├── actor
├── list_id (FK)                ├── action
├── status                      ├── list_id (FK)
├── source                      ├── list_name
├── opt_in_date                 ├── subscriber_id (FK)
├── unsubscribed_at             ├── subscriber_email
├── notes                       ├── timestamp
├── created_at                  └── details
└── updated_at
```

See [docs/database-schema.md](docs/database-schema.md) for the full ER diagram with relationships.

---

## API Endpoints

All endpoints are prefixed with `/api/v1`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint                            | Description                              |
|--------|-------------------------------------|------------------------------------------|
| POST   | `/auth/login`                       | Authenticate and receive a JWT token     |
| GET    | `/lists/`                           | List all distribution lists with stats   |
| GET    | `/lists/{id}`                       | Get details for a specific list          |
| POST   | `/lists/`                           | Create a new distribution list           |
| GET    | `/lists/{id}/subscribers`           | Get subscribers in a list (search/filter)|
| POST   | `/lists/{id}/subscribers`           | Add a subscriber to a list               |
| PUT    | `/subscriptions/{id}`               | Update a subscription record             |
| DELETE | `/subscriptions/{id}`               | Remove a subscription                    |
| POST   | `/imports/preview`                  | Upload CSV and get validation preview    |
| POST   | `/imports/commit`                   | Commit validated rows to the database    |
| GET    | `/subscribers/`                     | List all subscribers (master directory)  |
| GET    | `/audit-logs/`                      | Retrieve the full audit trail            |
| GET    | `/dashboard/stats`                  | Get aggregate dashboard metrics          |
| POST   | `/ai/generate`                      | Generate newsletter draft via AI         |
| POST   | `/email/send`                       | Dispatch a newsletter via email          |
| GET    | `/newsletters/`                     | List all newsletters                     |
| GET    | `/categories/`                      | List all categories                      |

---

## Known Limitations & Future Work

| Area | Current State | Planned |
|------|---------------|---------|
| Authentication | Mock JWT login with seeded credentials | Microsoft Entra ID (Azure AD) SSO |
| Database | Local SQLite file | Azure SQL Database (ODBC Driver 17) |
| Email delivery | SMTP service scaffolded, not production-configured | Full SMTP or SendGrid integration |
| AI drafts | Gemini integration scaffolded | End-to-end AI draft workflow |
| Test suite | No automated tests | Unit + integration test coverage |
| Hosting | Local development only | Azure App Service deployment |
| Newsletter editor | Component exists but not in sidebar nav | Full rich-text editor integration |
