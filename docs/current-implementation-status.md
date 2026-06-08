# Current Implementation Status

## Overview
The current implementation of the Newsletter Portal is a split frontend/backend architecture:

- **Frontend:** Next.js application in `frontend/`
- **Backend:** FastAPI REST service in `backend/app/`
- **Database:** SQLite by default via SQLAlchemy
- **Authentication:** mock JWT login flow with seeded admin user
- **Hosting:** development-level instructions are documented, production hosting is not yet implemented

## Completed Implementation

### Frontend
- Admin dashboard built in `frontend/app/page.tsx`
- Navigation via `Sidebar` and `Navbar`
- Subscriber management interface in `frontend/components/SubscribersList.tsx`
- Newsletter history page in `frontend/components/NewsletterHistory.tsx`
- AI draft workflow present in `frontend/components/AIDraftWizard.tsx`
- Login interface with left product overview and right login card
- Logout action available under `Settings`

### Backend
- FastAPI API server in `backend/app/main.py`
- API router structure for newsletters, subscribers, categories, AI, email, and auth
- SQLAlchemy models in `backend/app/models.py`
- Mock auth implementation in `backend/app/routers/auth.py`
- JWT utilities and security in `backend/app/auth.py`
- Database seeding of default admin user on startup

### Authentication
- `POST /api/v1/auth/login` supports mock login using seeded credentials
- Default seeded admin user:
  - Email: `curator@company.com`
  - Password: `securepassword123`
- JWT access tokens are returned on successful login
- Protected endpoints require `Authorization: Bearer <token>`

## Known Gaps
- Microsoft Entra ID login is not yet implemented; current login is mock only
- No production-ready identity provider integration has been added
- No explicit test suite exists in the current repository
- Email delivery flow is stubbed and may require production service configuration
- Current docs describe local `.venv` setup and should be reviewed for full Azure deployment
