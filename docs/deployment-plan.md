# Deployment Plan

This document outlines the strategy for running the Newsletter Subscriber Portal in both development and production environments.

## Local Development

### Backend

```bash
cd backend
python -m venv .venv

# macOS / Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload
```

Runs at `http://localhost:8000`. The `--reload` flag enables hot-reloading for development.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Runs at `http://localhost:3000`.

### Default Credentials

| Field | Value |
|-------|-------|
| Email | `curator@company.com` |
| Password | `securepassword123` |

---

## Docker Setup

Containerization is recommended for staging and production deployments.

### Backend Dockerfile (Example)

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile (Example)

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
CMD ["npm", "run", "start"]
```

---

## Production Requirements

### Database

- **Local:** SQLite file (`newsletter.db`) — suitable for development and single-user testing only.
- **Production:** Azure SQL Database with ODBC Driver 17. Configure via the `DATABASE_URL` environment variable:
  ```
  DATABASE_URL=mssql+pyodbc://user:password@server.database.windows.net:1433/database_name?driver=ODBC+Driver+17+for+SQL+Server
  ```

### Authentication

- **Current:** Mock JWT login with a seeded admin user. Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 30 minutes).
- **Planned:** Microsoft Entra ID (Azure AD) SSO integration. The login UI already includes a disabled placeholder button for this.

### Email Service

- SMTP integration is scaffolded in `backend/app/services/email_service.py`.
- Requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` environment variables.
- For production, consider using a managed service (SendGrid, Azure Communication Services, or AWS SES).

### AI Service

- Gemini LLM integration is scaffolded in `backend/app/services/ai_service.py`.
- Requires `GEMINI_API_KEY` environment variable.

### Secrets Management

All sensitive configuration should be injected via environment variables. For Azure deployments, use **Azure Key Vault** to store:
- `SECRET_KEY` (JWT signing key)
- `DATABASE_URL`
- SMTP credentials
- `GEMINI_API_KEY`

### CORS Configuration

The backend currently allows all origins (`allow_origins=["*"]`). For production, restrict this to the frontend's production domain only in `backend/app/main.py`.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./newsletter.db` |
| `SECRET_KEY` | JWT signing key | `yoursecretkeyhere` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry in minutes | `30` |
| `FRONTEND_BASE_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP authentication user | — |
| `SMTP_PASSWORD` | SMTP authentication password | — |
| `GEMINI_API_KEY` | Google Gemini API key | — |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
