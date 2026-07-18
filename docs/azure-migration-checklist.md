# Azure Migration Checklist

This checklist covers the steps required to migrate the Newsletter Subscriber Portal from local development to an Azure-hosted production environment.

**Target environment** (resource group `rg-newsletter`, East US 2, subscription `BioCryst-CDW subscription`):
- `Biocryst-Newsletter` — App Service (backend, FastAPI)
- `biocryst-newsletter-server` — Azure Database for PostgreSQL Flexible Server
- `biocryst-newsletter-static` — Static Web App (frontend, Next.js static export)
- `Biocryst-NewsletterVnet` — Virtual network (Postgres uses private access via `privatelink.postgres.database.azure.com`)
- `ASP-rgnewsletter-9f30` — App Service plan

## Preparation

- [ ] Verify all sensitive configuration values are externalized to environment variables (no hardcoded secrets)
- [ ] Confirm `npm run build` completes successfully for the frontend (with `output: 'export'` in `next.config.js` for static hosting on the Static Web App)
- [ ] Confirm the backend starts cleanly with `python -m uvicorn app.main:app` (no `--reload`)
- [ ] Review and remove any console-only debug settings or hardcoded `localhost` references
- [ ] Confirm SQLAlchemy models use only standard SQL types compatible with PostgreSQL (already verified — no SQLite-specific features in `app/models.py`)

## Database Migration

- [x] Provision an **Azure Database for PostgreSQL Flexible Server** (`biocryst-newsletter-server` — already created)
- [ ] Add `psycopg2-binary` to `requirements.txt`
- [ ] Update `DATABASE_URL` to the Azure PostgreSQL connection string:
  ```
  postgresql+psycopg2://user:password@biocryst-newsletter-server.postgres.database.azure.com:5432/newsletter_portal?sslmode=require
  ```
- [ ] Confirm the server's networking mode (private access via VNet, per the `privatelink.postgres.database.azure.com` DNS zone already in the resource group)
- [ ] Run the backend once against Azure PostgreSQL to create tables via `Base.metadata.create_all()`
- [ ] Verify seeded data (default admin user + four distribution lists) is created correctly
- [ ] Test all CRUD operations against Azure PostgreSQL: create/read/update/delete subscriptions, imports, audit logs

See [backend/AZURE_SQL_MIGRATION.md](../backend/AZURE_SQL_MIGRATION.md) for full step-by-step PostgreSQL migration instructions.

## Authentication & Identity

- [ ] Register the application in **Microsoft Entra ID** (Azure AD)
- [ ] Configure redirect URIs for both local development and production frontend URLs (the Static Web App's `*.azurestaticapps.net` domain)
- [ ] Implement OIDC/OAuth2 login flow in the frontend (replace mock login form)
- [ ] Implement Entra ID token validation in the backend (replace mock JWT endpoint)
- [ ] Remove or disable the mock login route (`POST /api/v1/auth/login`)
- [ ] Update the `auth.get_current_active_user` dependency to validate Entra tokens
- [ ] Configure managed identity or service principal for backend-to-Azure-resource access if needed

## Infrastructure

- [x] Provision **Azure App Service** for the backend (`Biocryst-Newsletter` — already created)
- [x] Provision **Azure Static Web App** for the frontend (`biocryst-newsletter-static` — already created)
- [ ] Enable **outbound VNet integration** on `Biocryst-Newsletter` App Service, attached to `Biocryst-NewsletterVnet`, so it can reach the private Postgres endpoint
- [ ] Configure **Azure Key Vault** for secrets:
  - `SECRET_KEY` (JWT signing key)
  - `DATABASE_URL` (Azure PostgreSQL connection string)
  - `SMTP_USER` / `SMTP_PASSWORD`
  - `GEMINI_API_KEY`
- [ ] Enable **Application Insights** for backend monitoring, request logging, and error diagnostics
- [ ] Set up **Azure Storage** for any file upload persistence if needed (currently CSV imports are processed in-memory)

## Deployment

- [ ] Deploy backend to `Biocryst-Newsletter` App Service (Python 3.11 runtime, startup command `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`) and validate API health check (`GET /` returns `200`)
- [ ] Deploy frontend to `biocryst-newsletter-static` Static Web App (build preset: Custom, app location `frontend`, output location `out`) and configure `NEXT_PUBLIC_API_URL` as a build-time env var pointing to the backend's production URL
- [ ] Update backend CORS configuration: replace `allow_origins=["*"]` with the Static Web App's production domain, read from an env var
- [ ] Add health probes and readiness checks for the backend App Service
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
