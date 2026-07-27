# Deployment Guide

## What's provisioned

Everything lives in resource group **`rg-newsletter`** (East US 2, subscription `BioCryst-CDW subscription`):

| Resource | Name | Purpose |
|---|---|---|
| Static Web App | `biocryst-newsletter-static` | Hosts the frontend at `https://red-tree-04ffd2c0f.7.azurestaticapps.net` |
| App Service | `Biocryst-Newsletter` | Hosts the backend at `https://biocryst-newsletter-aadserh2c0dqbhen.eastus2-01.azurewebsites.net` |
| App Service Plan | `ASP-rgnewsletter-9f30` | Premium V2 (P1v2) — always-on, no cold starts |
| PostgreSQL Flexible Server | `biocryst-newsletter-server` | Database, **private network access only** (VNet-integrated, no public endpoint) |
| Virtual Network | `Biocryst-NewsletterVnet` | Subnets: app-integration subnet (App Service), DB-delegated subnet (Postgres) |
| Entra ID App Registration | `Biocryst-Newsletter` (client ID `e3063381-c4be-496e-8776-889b922b2092`, tenant `c7fe4dda-d720-498c-8d8d-e8fe0ef3f333`) | SSO identity provider, single-tenant (`biocryst.com` only) |

## CI/CD

Both apps redeploy automatically on push to `main` via GitHub Actions, defined in `.github/workflows/`:

- **`azure-static-web-apps-red-tree-04ffd2c0f.yml`** — triggers on any push to `main` (Azure's default SWA workflow doesn't scope by path), builds `frontend/` (`next build` with `output: 'export'`, output dir `out`), and deploys via the `AZURE_STATIC_WEB_APPS_API_TOKEN_RED_TREE_04FFD2C0F` repo secret. Injects `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MSAL_CLIENT_ID`, `NEXT_PUBLIC_MSAL_TENANT_ID`, and `NEXT_PUBLIC_API_SCOPE` as build-time env vars (baked into the static bundle — see [Troubleshooting](troubleshooting.md) if these ever need to change).
- **`deploy-backend.yml`** — triggers on pushes to `main` that touch `backend/**` (or manually via the Actions tab's "Run workflow" button). Installs dependencies, zips `backend/`, and deploys to the App Service using the `AZURE_WEBAPP_PUBLISH_PROFILE` repo secret.

To rotate the backend publish profile secret:
```bash
az webapp deployment list-publishing-profiles \
  --resource-group rg-newsletter --name Biocryst-Newsletter \
  --xml | pbcopy
```
then paste into the `AZURE_WEBAPP_PUBLISH_PROFILE` GitHub repo secret (Settings → Secrets and variables → Actions).

### Manual backend deploy (bypassing CI)

```bash
cd backend
zip -r /tmp/backend-deploy.zip . -x ".venv/*" -x "__pycache__/*" -x "*/__pycache__/*" -x "*.db" -x ".env" -x ".git/*"
az webapp deploy --resource-group rg-newsletter --name Biocryst-Newsletter --src-path /tmp/backend-deploy.zip --type zip
```

## Backend configuration (App Service application settings)

| Setting | Purpose |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://<user>:<password>@biocryst-newsletter-server.postgres.database.azure.com:5432/<db>?sslmode=require` |
| `AZURE_AD_TENANT_ID` | `c7fe4dda-d720-498c-8d8d-e8fe0ef3f333` |
| `AZURE_AD_CLIENT_ID` | `e3063381-c4be-496e-8776-889b922b2092` |
| `AZURE_AD_ALLOWED_DOMAIN` | `biocryst.com` |
| `CORS_ORIGINS` | `https://red-tree-04ffd2c0f.7.azurestaticapps.net` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Reserved — no code currently sends email through these |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` — required so Oryx runs `pip install` on deploy |

Startup command: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`. Always On is enabled (Premium V2 tier, so the app doesn't idle/cold-start).

Update a setting with:
```bash
az webapp config appsettings set --resource-group rg-newsletter --name Biocryst-Newsletter --settings KEY="value"
```

## Networking

Postgres has `publicNetworkAccess: Disabled` — it's only reachable from inside `Biocryst-NewsletterVnet`. The App Service has outbound VNet integration into that same VNet's app subnet, which is why `DATABASE_URL` works from the backend but won't work from an arbitrary local machine without a VPN/bastion into the VNet.

## Entra ID App Registration

- **Redirect URIs (SPA platform):** `https://red-tree-04ffd2c0f.7.azurestaticapps.net` and `http://localhost:3000` (for local frontend dev).
- **Exposed API scope:** `api://e3063381-c4be-496e-8776-889b922b2092/user_impersonation` — the frontend requests this scope at login and on every silent token refresh.
- **App Service Authentication ("Easy Auth") is intentionally disabled.** It auto-enables itself against this same App Registration whenever someone configures Entra ID sign-in through the App Service's "Authentication" blade in the Portal — if you ever see it re-enabled, turn it back off (its redirect/cookie-based flow breaks the frontend's cross-origin JSON API calls):
  ```bash
  az rest --method GET \
    --uri "https://management.azure.com/subscriptions/<sub-id>/resourceGroups/rg-newsletter/providers/Microsoft.Web/sites/Biocryst-Newsletter/config/authsettingsV2?api-version=2022-03-01" \
    -o json > /tmp/authsettings.json
  # edit properties.platform.enabled to false, then:
  az rest --method PUT \
    --uri "https://management.azure.com/subscriptions/<sub-id>/resourceGroups/rg-newsletter/providers/Microsoft.Web/sites/Biocryst-Newsletter/config/authsettingsV2?api-version=2022-03-01" \
    --headers "Content-Type=application/json" --body @/tmp/authsettings.json
  ```
  (`az webapp auth update` does not work here — this site's auth config is on v2, which that command doesn't support; use `az rest` against `authsettingsV2` directly, as above.)
- Editing the App Registration (redirect URIs, scopes, owners) requires an Entra ID **Application Administrator** (or higher) directory role — separate from Azure subscription Owner/Contributor RBAC. If `az ad app update`/`az rest` PATCH calls fail with `Authorization_RequestDenied`, do it through the Portal (**Entra ID → App registrations → Biocryst-Newsletter**) with an account that has that role, or ask whoever does.

## Promoting a user to Admin

New SSO logins default to the `curator` role. There's no UI for this yet — connect to the database and run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'someone@biocryst.com';
```
(The user must have signed in at least once already, since their row is only created on first login.)

## Local development

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL (sqlite:///./newsletter.db works locally), AZURE_AD_*, etc.
python -m uvicorn app.main:app --reload
```
Runs at `http://localhost:8000`; interactive docs at `/docs`. On first run it seeds the database with four distribution lists (no default user is seeded anymore — sign in via SSO to create your own account).

Note: signing in locally against Entra ID still requires the App Registration's SPA redirect URI to include `http://localhost:3000`, and the token audience must resolve correctly — local testing exercises the exact same `entra_auth.py` validation path as production.

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 and the NEXT_PUBLIC_MSAL_* values
npm run dev
```
Runs at `http://localhost:3000`.

## Environment variables reference

**Backend (`backend/.env`):**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy connection string (SQLite locally, Postgres in prod) |
| `AZURE_AD_TENANT_ID` / `AZURE_AD_CLIENT_ID` / `AZURE_AD_ALLOWED_DOMAIN` | Entra ID token validation |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `SMTP_*`, `GEMINI_API_KEY` | Reserved, not currently used by any code path |

**Frontend (`frontend/.env.local`):**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_MSAL_CLIENT_ID` / `NEXT_PUBLIC_MSAL_TENANT_ID` | Entra ID App Registration identifiers |
| `NEXT_PUBLIC_API_SCOPE` | `api://e3063381-c4be-496e-8776-889b922b2092/user_impersonation` |

All `NEXT_PUBLIC_*` values are baked into the static bundle at build time — changing them requires a rebuild/redeploy, not just an environment change (there's no server to read them at runtime).
