# Deployment Plan

This document outlines the strategy for running the Newsletter Portal in production.

## Docker Setup

We recommend containerizing both the frontend and backend to enable multi-stage builds.

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

## Production Requirements

1. **Database:** PostgreSQL instance (managed service like AWS RDS, GCP Cloud SQL, or Supabase).
2. **Mail Service:** SES, Mailgun, or SendGrid integration credentials.
3. **Cache / Message Queue:** Redis (if Celery/task queue is utilized for async mass mail dispatch).
4. **Secrets Management:** Environment variables injected securely via deployment platforms.
5. **Local Backend Runtime:** The backend currently uses a Python virtual environment created under `.venv` and launches with `python -m uvicorn app.main:app --reload` in development.
