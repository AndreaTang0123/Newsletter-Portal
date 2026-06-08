# Architecture

## System Layers

### Frontend
- Built with **Next.js** and React
- Uses client-side state for navigation and auth state
- Components:
  - `Sidebar` / `Navbar`
  - `SubscribersList`
  - `NewsletterHistory`
  - `AIDraftWizard`
  - `NewsletterEditor`
- Auth state is stored in `localStorage` under `token`

### Backend
- Built with **FastAPI**
- API structure is organized into router modules:
  - `backend/app/routers/newsletters.py`
  - `backend/app/routers/subscribers.py`
  - `backend/app/routers/categories.py`
  - `backend/app/routers/ai.py`
  - `backend/app/routers/email.py`
  - `backend/app/routers/auth.py`
- Core services use SQLAlchemy ORM for persistence
- Database connection and schema initialization are in `backend/app/database.py`

### Authentication
- JWT-based auth in `backend/app/auth.py`
- OAuth2PasswordBearer configured to `/api/v1/auth/login`
- Login endpoint validates email/password against seeded user data

### Data Model
- `User` with roles `admin` / `curator`
- `Subscriber` with many-to-many relationship to `Category`
- `Newsletter` with many-to-many `Category` targeting
- `CampaignHistory` logging newsletter deliveries per subscriber

## Data Flow
1. User logs in via frontend login card
2. Frontend sends credentials to `POST /api/v1/auth/login`
3. Backend verifies credentials and responds with JWT
4. Frontend stores token and sends it on subsequent requests
5. Admin accesses subscribers, newsletters, send history, and settings through protected routes

## Current Deployment Model
- Local development deploys frontend with `npm run dev`
- Backend runs in a Python virtual environment under `backend/.venv`
- Backend is launched with `python -m uvicorn backend.app.main:app --reload`
- Default database is `sqlite:///./newsletter.db` unless `DATABASE_URL` is overridden
