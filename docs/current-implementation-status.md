# Current Implementation Status

## Overview

The Newsletter Subscriber Portal is a split frontend/backend application focused on centralized distribution list and subscriber management.

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 14 / React 18 / TypeScript | ✅ Implemented |
| Backend | FastAPI / Python 3.10+ / SQLAlchemy | ✅ Implemented |
| Database | SQLite (local) / Azure SQL (planned) | ✅ Local, 🔲 Azure |
| Authentication | JWT mock login | ✅ Implemented |
| Entra ID SSO | Microsoft Entra ID | 🔲 Planned |
| Email dispatch | SMTP service | 🔲 Scaffolded |
| AI draft generation | Gemini LLM | 🔲 Scaffolded |

## Completed Implementation

### Frontend Pages & Components

| Feature | Component | Status |
|---------|-----------|--------|
| Login screen | `app/page.tsx` (unauthenticated state) | ✅ |
| Admin dashboard with metrics | `app/page.tsx` (dashboard tab) | ✅ |
| Navigation sidebar | `components/Sidebar.tsx` | ✅ |
| Top navbar | `components/Navbar.tsx` | ✅ |
| Distribution list card grid | `components/ListsView.tsx` | ✅ |
| Per-list subscriber management | `components/ListDetailView.tsx` | ✅ |
| Master subscriber directory | `components/MasterSubscribersView.tsx` | ✅ |
| CSV bulk import workflow | `components/ImportView.tsx` | ✅ |
| Audit log trail | `components/AuditLogsView.tsx` | ✅ |
| Settings page (roles, DB info, sign-out) | `app/page.tsx` (settings tab) | ✅ |
| Public unsubscribe page | `pages/unsubscribe.tsx` | ✅ |

### Backend API Routers (Mounted)

| Router | Prefix | Endpoints | Status |
|--------|--------|-----------|--------|
| Auth | `/api/v1/auth` | `POST /login` | ✅ |
| Lists | `/api/v1/lists` | CRUD + subscriber management | ✅ |
| Subscriptions | `/api/v1/subscriptions` | `PUT /{id}`, `DELETE /{id}` | ✅ |
| Imports | `/api/v1/imports` | `POST /preview`, `POST /commit` | ✅ |
| Subscribers | `/api/v1/subscribers` | `GET /` (master directory) | ✅ |
| Audit Logs | `/api/v1/audit-logs` | `GET /` | ✅ |
| Dashboard Stats | `/api/v1/dashboard` | `GET /stats` | ✅ |

### Authentication

- `POST /api/v1/auth/login` validates credentials against the `users` table
- Default seeded admin user:
  - Email: `curator@company.com`
  - Password: `securepassword123`
  - Role: `admin`
  - Full Name: Andrea Tang
- JWT access tokens (HS256) are returned on successful login
- Protected endpoints require `Authorization: Bearer <token>`
- Admin-only endpoints (e.g., list creation) use `Depends(auth.require_admin)`

### Database

- SQLAlchemy ORM with 5 tables: `users`, `lists`, `subscribers`, `subscriptions`, `audit_logs`
- Database seeding on startup: 1 admin user + 4 distribution lists
- Unique constraint on `(list_id, subscriber_id)` prevents duplicate subscriptions
- Audit logs use `SET NULL` foreign keys to preserve history when records are deleted

### Key Workflows

- **Add subscriber** → creates `Subscriber` if not exists → creates `Subscription` → writes `AuditLog`
- **CSV import** → upload & parse → preview with validation → commit valid rows → writes `AuditLog`
- **Edit subscriber** → updates `Subscription` and `Subscriber` fields → writes `AuditLog`
- **Remove subscriber** → deletes `Subscription` → writes `AuditLog`
- **CSV export** → generates CSV client-side from current subscriber list and triggers browser download

## Scaffolded (Not Yet Active)

### Frontend Components (not in sidebar navigation)

| Component | File | Purpose |
|-----------|------|---------|
| AIDraftWizard | `components/AIDraftWizard.tsx` | AI-powered newsletter draft generation UI |
| NewsletterEditor | `components/NewsletterEditor.tsx` | Rich text newsletter content editor |
| NewsletterHistory | `components/NewsletterHistory.tsx` | Sent newsletter history with delivery analytics |

### Backend Routers (not mounted in `main.py`)

| Router | File | Purpose |
|--------|------|---------|
| Newsletters | `routers/newsletters.py` | Newsletter CRUD + send dispatch |
| Categories | `routers/categories.py` | Category CRUD |
| AI | `routers/ai.py` | Gemini LLM draft generation |
| Email | `routers/email.py` | Campaign sending history |

### Backend Services

| Service | File | Purpose |
|---------|------|---------|
| AI Service | `services/ai_service.py` | Google Gemini API integration |
| Email Service | `services/email_service.py` | SMTP send + tracking pixel injection |

## Known Gaps

| Area | Gap | Priority |
|------|-----|----------|
| Authentication | Microsoft Entra ID SSO is not implemented; login is mock-only | High |
| Email delivery | SMTP service is scaffolded but not production-configured | Medium |
| AI drafts | Gemini integration scaffolded but router not mounted | Medium |
| Newsletter editor | Components exist but not accessible from sidebar | Medium |
| Test suite | No automated unit or integration tests | Medium |
| CORS | Backend allows all origins (`*`) — must be restricted for production | High |
| Hosting | Only local development instructions exist; no CI/CD pipeline | Medium |
| Database | Local SQLite only; Azure SQL migration not yet executed | High |
