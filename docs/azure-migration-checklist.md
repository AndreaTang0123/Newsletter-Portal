# Azure Migration Checklist

This checklist covers the steps required to migrate the Newsletter Subscriber Portal from local development to an Azure-hosted production environment.

## Preparation

- [ ] Verify all sensitive configuration values are externalized to environment variables (no hardcoded secrets)
- [ ] Confirm `npm run build` completes successfully for the frontend
- [ ] Confirm the backend starts cleanly with `python -m uvicorn app.main:app` (no `--reload`)
- [ ] Review and remove any console-only debug settings or hardcoded `localhost` references
- [ ] Ensure SQLAlchemy models use only standard SQL types compatible with Azure SQL (no SQLite-specific features)

## Database Migration

- [ ] Provision an **Azure SQL Database** instance
- [ ] Install ODBC Driver 17 for SQL Server on the deployment environment
- [ ] Update `DATABASE_URL` to the Azure SQL connection string:
  ```
  mssql+pyodbc://user:password@server.database.windows.net:1433/database_name?driver=ODBC+Driver+17+for+SQL+Server
  ```
- [ ] Add `pyodbc` to `requirements.txt` if not already present
- [ ] Run the backend once against Azure SQL to create tables via `Base.metadata.create_all()`
- [ ] Verify seeded data (default admin user + four distribution lists) is created correctly
- [ ] Test all CRUD operations against Azure SQL: create/read/update/delete subscriptions, imports, audit logs

## Authentication & Identity

- [ ] Register the application in **Microsoft Entra ID** (Azure AD)
- [ ] Configure redirect URIs for both local development and production frontend URLs
- [ ] Implement OIDC/OAuth2 login flow in the frontend (replace mock login form)
- [ ] Implement Entra ID token validation in the backend (replace mock JWT endpoint)
- [ ] Remove or disable the mock login route (`POST /api/v1/auth/login`)
- [ ] Update the `auth.get_current_active_user` dependency to validate Entra tokens
- [ ] Configure managed identity or service principal for backend-to-Azure-resource access if needed

## Infrastructure

- [ ] Provision **Azure App Service** or **Azure Container Apps** for frontend and backend
- [ ] Configure **Azure Key Vault** for secrets:
  - `SECRET_KEY` (JWT signing key)
  - `DATABASE_URL` (Azure SQL connection string)
  - `SMTP_USER` / `SMTP_PASSWORD`
  - `GEMINI_API_KEY`
- [ ] Enable **Application Insights** for backend monitoring, request logging, and error diagnostics
- [ ] Set up **Azure Storage** for any file upload persistence if needed (currently CSV imports are processed in-memory)

## Containerization

- [ ] Create production Dockerfiles for frontend and backend (see `deployment-plan.md`)
- [ ] Verify backend container runs correctly:
  ```
  python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```
- [ ] Verify frontend container builds and serves via `npm run start`
- [ ] Push Docker images to **Azure Container Registry** (ACR)
- [ ] Configure ACR image pull credentials in App Service / Container Apps

## Deployment

- [ ] Deploy backend first and validate API health check (`GET /` returns `200`)
- [ ] Deploy frontend and configure `NEXT_PUBLIC_API_URL` to point to the backend's production URL
- [ ] Update backend CORS configuration: replace `allow_origins=["*"]` with the production frontend domain
- [ ] Add health probes and readiness checks for both services
- [ ] Verify the `seed_database()` function runs correctly on first production startup

## Post-Deployment Validation

- [ ] Verify login flow works end-to-end (login → JWT → protected API calls)
- [ ] Test distribution list views: card grid loads, stats are correct
- [ ] Test list detail view: search, filter, add/edit/delete subscriber, CSV export
- [ ] Test master subscriber directory loads cross-list data correctly
- [ ] Test CSV import: upload → preview → commit → verify data in database
- [ ] Test audit log trail: verify all actions are logged with correct timestamps and operators
- [ ] Test dashboard metrics: verify counts match database state
- [ ] Test settings page: role display, database info, sign-out clears session
- [ ] Test public unsubscribe page (`/unsubscribe?email=...`) works without authentication
- [ ] Confirm sign-out clears `localStorage` token and redirects to login
- [ ] Enable alerting on error rates, failed HTTP requests, and database connection failures
