# Architecture

## System Overview

The Newsletter Subscriber Portal is a two-tier web application with a clear separation between the frontend presentation layer and the backend API layer.

```
┌────────────────────────────┐        ┌──────────────────────────────────┐
│       Next.js Frontend     │  HTTP  │        FastAPI Backend           │
│  (React SPA + Pages)       │◄──────►│  REST API  (/api/v1/...)        │
│                            │  JWT   │                                  │
│  App Router:               │        │  Mounted Routers:                │
│  • page.tsx (dashboard,    │        │    /auth         /lists          │
│    login, settings)        │        │    /subscriptions /imports       │
│                            │        │    /subscribers   /audit-logs    │
│  Components:               │        │    /dashboard                    │
│  • ListsView               │        │                                  │
│  • ListDetailView          │        │  Unmounted (scaffolded):         │
│  • MasterSubscribersView   │        │    /newsletters  /categories     │
│  • ImportView              │        │    /ai           /email          │
│  • AuditLogsView           │        │                                  │
│  • Sidebar / Navbar        │        │  Services:                       │
│                            │        │    ai_service · email_service    │
│  Pages Router:             │        │                                  │
│  • /unsubscribe            │        │  ORM: SQLAlchemy                 │
└────────────────────────────┘        └──────────┬───────────────────────┘
                                                 │
                                      ┌──────────▼───────────────────────┐
                                      │  SQLite (local dev)              │
                                      │  Azure SQL Database (production) │
                                      │                                  │
                                      │  Tables:                         │
                                      │    users · subscribers · lists   │
                                      │    subscriptions · audit_logs    │
                                      └──────────────────────────────────┘
```

## Frontend

- **Framework:** Next.js 14 with React 18 and TypeScript
- **Styling:** Vanilla CSS with CSS custom properties (design tokens) for theming — glassmorphism aesthetic
- **Icons:** Lucide React
- **HTTP Client:** Axios with a JWT interceptor that attaches `Authorization: Bearer <token>` to all requests
- **Auth state:** JWT token stored in `localStorage` under the key `token`

### Component Architecture

| Component | File | Purpose |
|-----------|------|---------|
| Root Layout | `app/layout.tsx` | HTML shell, font loading, global CSS |
| Main Page | `app/page.tsx` | Login screen (when unauthenticated), Dashboard / Settings / tab router (when authenticated) |
| Sidebar | `components/Sidebar.tsx` | Left navigation: Dashboard, Distribution Lists, Master Subscribers, Import CSV, Audit Logs, Settings |
| Navbar | `components/Navbar.tsx` | Top bar with page title and settings gear icon |
| ListsView | `components/ListsView.tsx` | Card grid of all distribution lists with stats |
| ListDetailView | `components/ListDetailView.tsx` | Per-list subscriber table with search, filter, add/edit/delete modals, CSV export |
| MasterSubscribersView | `components/MasterSubscribersView.tsx` | Cross-list subscriber directory with subscription status chips |
| ImportView | `components/ImportView.tsx` | CSV upload form, preview table, commit workflow |
| AuditLogsView | `components/AuditLogsView.tsx` | Full audit trail table with search |
| Unsubscribe Page | `pages/unsubscribe.tsx` | Public self-service subscription preference management |

### Scaffolded (not in sidebar navigation)

| Component | File | Purpose |
|-----------|------|---------|
| AIDraftWizard | `components/AIDraftWizard.tsx` | AI newsletter draft generation UI |
| NewsletterEditor | `components/NewsletterEditor.tsx` | Rich text newsletter editor |
| NewsletterHistory | `components/NewsletterHistory.tsx` | Sent newsletter history and analytics |

## Backend

- **Framework:** FastAPI with Python 3.10+
- **ORM:** SQLAlchemy 2.0+ with Pydantic v2 schemas
- **Authentication:** JWT via `python-jose` with `passlib[bcrypt]` for password hashing
- **Entry point:** `backend/app/main.py`

### Mounted API Routers (active in `main.py`)

| Router | Prefix | Tags | Endpoints |
|--------|--------|------|-----------|
| `auth.py` | `/api/v1/auth` | Auth | `POST /login` |
| `lists.py` | `/api/v1/lists` | Lists | `GET /`, `POST /`, `GET /{id}`, `GET /{id}/subscribers`, `POST /{id}/subscribers` |
| `subscriptions.py` | `/api/v1/subscriptions` | Subscriptions | `PUT /{id}`, `DELETE /{id}` |
| `imports.py` | `/api/v1/imports` | Imports | `POST /preview`, `POST /commit` |
| `subscribers.py` | `/api/v1/subscribers` | Subscribers | `GET /` |
| `audit_logs.py` | `/api/v1/audit-logs` | Audit Logs | `GET /` |
| `statistics.py` | `/api/v1/dashboard` | Dashboard Statistics | `GET /stats` |

### Unmounted Routers (scaffolded, not included in `main.py`)

| Router | Prefix | Purpose |
|--------|--------|---------|
| `newsletters.py` | `/api/v1/newsletters` | Newsletter CRUD and send |
| `categories.py` | `/api/v1/categories` | Category CRUD |
| `ai.py` | `/api/v1/ai` | AI draft generation via Gemini |
| `email.py` | `/api/v1/email` | Email sending history |

### Services

| Service | File | Purpose |
|---------|------|---------|
| `ai_service.py` | `services/ai_service.py` | Google Gemini LLM integration for draft generation |
| `email_service.py` | `services/email_service.py` | SMTP email dispatch with tracking pixel injection |

## Authentication Flow

1. User enters credentials on the frontend login screen
2. Frontend sends `POST /api/v1/auth/login` with `{ email, password }`
3. Backend validates credentials against the `users` table (bcrypt hash comparison)
4. On success, backend returns `{ access_token, token_type: "bearer" }`
5. Frontend stores the token in `localStorage`
6. All subsequent API requests include `Authorization: Bearer <token>` via the Axios interceptor
7. Protected backend endpoints use `Depends(auth.get_current_active_user)` to validate the token
8. Admin-only endpoints use `Depends(auth.require_admin)` for role enforcement

## Data Model

| Entity | Key Relationships |
|--------|-------------------|
| **User** | `admin` or `curator` role. Created via seeding or registration. |
| **Subscriber** | Unique by email. Has one-to-many `Subscription` records. Optional `department` and `role_title` fields. |
| **List** | Distribution channel (e.g., Weekly Newsletter, HAE). Has one-to-many `Subscription` records. |
| **Subscription** | Join entity between `Subscriber` and `List`. Carries `status` (Active/Paused/Unsubscribed/Bounced), `source` (Bulk Import/Curator Added/Self-Service), `notes`, and timestamps. Unique constraint on `(list_id, subscriber_id)`. |
| **AuditLog** | Immutable record of every subscriber modification. References `list_id` and `subscriber_id` with `SET NULL` on delete. |

## Current Deployment Model

- **Frontend:** `npm run dev` starts the Next.js dev server on `http://localhost:3000`
- **Backend:** `python -m uvicorn app.main:app --reload` starts FastAPI on `http://localhost:8000`
- **Database:** SQLite file at `backend/newsletter.db` (default); configurable via `DATABASE_URL` environment variable
- **CORS:** Currently allows all origins (`*`) — must be restricted for production
