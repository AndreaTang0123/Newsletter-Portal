# Newsletter Subscriber Portal

A full-stack web application for managing internal newsletter distribution lists. Built for content curators and administrators who need to maintain subscriber audiences, bulk-import contacts, track changes through audit logs, and manage subscription preferences — all from a single, centralized admin dashboard.

## Tech Stack

| Layer          | Technology                                                    |
|----------------|---------------------------------------------------------------|
| Frontend       | Next.js 14 · React 18 · TypeScript · Lucide Icons · Axios    |
| Backend        | FastAPI · Python 3.10+ · SQLAlchemy ORM · Pydantic v2        |
| Authentication | JWT (HS256) via `python-jose` · Mock login with seeded admin  |
| Database       | SQLite (default) · Azure SQL Database–ready via `DATABASE_URL`|
| Email (stub)   | SMTP integration scaffolded (`email_service.py`)              |
| AI (stub)      | Gemini LLM integration scaffolded (`ai_service.py`)           |

## Architecture

```
┌────────────────────────────┐        ┌──────────────────────────────────┐
│       Next.js Frontend     │  HTTP  │        FastAPI Backend           │
│  (React SPA + Pages)       │◄──────►│  REST API  (/api/v1/...)        │
│                            │  JWT   │                                  │
│  • Admin Dashboard         │        │  Routers:                        │
│  • Distribution Lists      │        │    /auth      /lists             │
│  • Master Subscribers      │        │    /subscribers  /subscriptions  │
│  • CSV Import              │        │    /imports   /audit-logs        │
│  • Audit Logs              │        │    /dashboard /ai  /email        │
│  • Unsubscribe Page        │        │                                  │
└────────────────────────────┘        │  Services:                       │
                                      │    ai_service · email_service    │
                                      └──────────┬───────────────────────┘
                                                 │
                                      ┌──────────▼───────────────────────┐
                                      │  SQLite / Azure SQL Database     │
                                      │  (SQLAlchemy ORM)                │
                                      │                                  │
                                      │  Tables: User · Subscriber       │
                                      │  DistributionList · Subscription │
                                      │  AuditLog                        │
                                      └──────────────────────────────────┘
```

## Directory Structure

```
Newsletter-Portal/
├── frontend/                    # Next.js administration UI
│   ├── app/
│   │   ├── page.tsx             # Main dashboard + login page
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles & design tokens
│   ├── components/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── Navbar.tsx           # Top navigation bar
│   │   ├── ListsView.tsx        # Distribution list overview cards
│   │   ├── ListDetailView.tsx   # Per-list subscriber management
│   │   ├── MasterSubscribersView.tsx  # Cross-list subscriber directory
│   │   ├── ImportView.tsx       # CSV bulk import workflow
│   │   ├── AuditLogsView.tsx    # Full audit trail table
│   │   ├── AIDraftWizard.tsx    # AI newsletter draft generation
│   │   ├── NewsletterEditor.tsx # Newsletter rich text editor
│   │   └── NewsletterHistory.tsx# Sent newsletter history & analytics
│   ├── lib/
│   │   └── api.ts               # Axios API client with JWT interceptor
│   └── pages/
│       └── unsubscribe.tsx      # Public self-service preference page
│
├── backend/                     # FastAPI REST service
│   └── app/
│       ├── main.py              # Application entry point & CORS setup
│       ├── database.py          # SQLAlchemy engine & session config
│       ├── models.py            # ORM models (User, Subscriber, etc.)
│       ├── schemas.py           # Pydantic request/response schemas
│       ├── crud.py              # Database CRUD operations
│       ├── auth.py              # JWT utilities & token validation
│       ├── init_db.py           # DB seeding (default admin + lists)
│       ├── routers/             # API route modules
│       │   ├── auth.py          # POST /api/v1/auth/login
│       │   ├── lists.py         # Distribution list CRUD + subscribers
│       │   ├── subscribers.py   # Master subscriber directory
│       │   ├── subscriptions.py # Individual subscription management
│       │   ├── imports.py       # CSV preview & commit endpoints
│       │   ├── audit_logs.py    # Audit trail retrieval
│       │   ├── statistics.py    # Dashboard aggregate metrics
│       │   ├── newsletters.py   # Newsletter CRUD & scheduling
│       │   ├── categories.py    # Category management
│       │   ├── ai.py            # AI draft generation endpoint
│       │   └── email.py         # Email dispatch endpoint
│       └── services/
│           ├── ai_service.py    # Gemini LLM integration
│           └── email_service.py # SMTP email sender
│
├── docs/                        # Design documentation
│   ├── project-overview.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-documentation.md
│   ├── deployment-plan.md
│   ├── current-implementation-status.md
│   ├── azure-migration-checklist.md
│   └── test-plan.md
│
└── PROJECT_DESCRIPTION.md       # Detailed feature guide & usage instructions
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- Git (to clone the repository)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Newsletter-Portal
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
# macOS / Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your SECRET_KEY, SMTP, and AI settings as needed

# Start the API server
python -m uvicorn app.main:app --reload
```

The backend runs at **http://localhost:8000** by default. On first startup, it automatically seeds the database with a default admin user and four distribution lists.

### 3. Frontend Setup

```bash
cd frontend

# Install Node.js dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local

# Start the development server
npm run dev
```

The frontend runs at **http://localhost:3000** by default.

### 4. Sign In

Use the seeded admin credentials to log in:

| Field    | Value                  |
|----------|------------------------|
| Email    | `curator@company.com`  |
| Password | `securepassword123`    |

> **Note:** Authentication currently uses a mock JWT login flow. Microsoft Entra ID (Azure AD) SSO is planned for a future release.

## Environment Variables

### Backend (`backend/.env`)

| Variable                      | Description                              | Default                           |
|-------------------------------|------------------------------------------|-----------------------------------|
| `DATABASE_URL`                | Database connection string               | `sqlite:///./newsletter.db`       |
| `SECRET_KEY`                  | JWT signing key                          | `yoursecretkeyhere`               |
| `ALGORITHM`                   | JWT algorithm                            | `HS256`                           |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry in minutes                  | `30`                              |
| `FRONTEND_BASE_URL`           | Frontend origin for CORS                 | `http://localhost:5173`           |
| `SMTP_HOST` / `SMTP_PORT`    | SMTP server settings                     | `smtp.gmail.com` / `587`         |
| `SMTP_USER` / `SMTP_PASSWORD`| SMTP authentication credentials          | —                                 |
| `GEMINI_API_KEY`              | Google Gemini API key for AI features    | —                                 |

### Frontend (`frontend/.env.local`)

| Variable               | Description                  | Default                           |
|------------------------|------------------------------|-----------------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL         | `http://localhost:8000/api/v1`    |

## Documentation

Detailed design documentation is available in the [`docs/`](docs/) directory:

- [Project Overview](docs/project-overview.md) — Goals, target users, and core feature summary
- [Architecture](docs/architecture.md) — System layers, data flow, and deployment model
- [Database Schema](docs/database-schema.md) — ER diagram and entity descriptions
- [API Documentation](docs/api-documentation.md) — REST endpoint reference
- [Deployment Plan](docs/deployment-plan.md) — Production hosting strategy
- [Azure Migration Checklist](docs/azure-migration-checklist.md) — Steps for Azure SQL migration
- [Implementation Status](docs/current-implementation-status.md) — What's built vs. planned
- [Test Plan](docs/test-plan.md) — Testing strategy and coverage goals

For a comprehensive feature walkthrough and usage guide, see **[PROJECT_DESCRIPTION.md](PROJECT_DESCRIPTION.md)**.

## License

This project is proprietary and intended for internal use.