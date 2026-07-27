# Architecture Overview

## System diagram

```
┌──────────────────────┐          ┌───────────────────────────┐
│   Browser (SPA)       │          │  Microsoft Entra ID        │
│   Next.js, statically  │◄────────►│  (login.microsoftonline.com)│
│   exported             │  OAuth2/  │  Tenant: biocryst.com      │
│   Azure Static Web App │  OIDC     └───────────────────────────┘
└──────────┬────────────┘
           │ HTTPS + CORS
           │ Authorization: Bearer <Entra access token>
           ▼
┌───────────────────────────┐
│   FastAPI Backend           │
│   Azure App Service (Linux) │
│   /api/v1/...                │
│                              │
│   Mounted routers:           │
│     /auth (me only)          │
│     /lists   /subscriptions  │
│     /imports /subscribers    │
│     /audit-logs /dashboard   │
│     /self-service (public)   │
└──────────┬───────────────────┘
           │ VNet-private connection
           ▼
┌───────────────────────────┐
│  Azure Database for          │
│  PostgreSQL Flexible Server  │
│  (no public endpoint)        │
│                               │
│  Tables: users · lists ·      │
│  subscribers · subscriptions ·│
│  audit_logs                   │
└───────────────────────────┘
```

## Frontend

- **Framework:** Next.js 14 (App Router), React 18, TypeScript, compiled with `output: 'export'` — the whole app ships as static HTML/JS/CSS, there is no Node server in production.
- **Styling:** hand-written CSS with custom properties for theming (glassmorphism look), no CSS framework.
- **Icons:** Lucide React.
- **HTTP client:** Axios (`lib/api.ts`), with a request interceptor that attaches a live Entra ID access token to every call, and a response interceptor that signs the user out on any `401`.
- **Auth:** `@azure/msal-browser` + `@azure/msal-react`. `components/MsalProviderWrapper.tsx` initializes a `PublicClientApplication` singleton (`lib/msalInstance.ts`) client-side and wraps the app in `MsalProvider`; `app/page.tsx` uses the `useMsal()` / `useIsAuthenticated()` hooks instead of any local session state.

| Piece | File | Purpose |
|---|---|---|
| Root layout | `app/layout.tsx` | HTML shell, wraps everything in `MsalProviderWrapper` |
| Main page | `app/page.tsx` | Sign-in screen (unauthenticated) or Dashboard/Lists/Settings tab router (authenticated) |
| Sidebar | `components/Sidebar.tsx` | Navigation + signed-in user's name/role |
| Navbar | `components/Navbar.tsx` | Page title + settings shortcut |
| ListsView | `components/ListsView.tsx` | Distribution list card grid |
| ListDetailView | `components/ListDetailView.tsx` | Per-list subscriber table, search/filter, add/edit/delete, CSV export |
| MasterSubscribersView | `components/MasterSubscribersView.tsx` | Cross-list subscriber directory |
| ImportView | `components/ImportView.tsx` | CSV upload → preview → commit |
| AuditLogsView | `components/AuditLogsView.tsx` | Full audit trail table |
| MsalProviderWrapper | `components/MsalProviderWrapper.tsx` | Client-side MSAL bootstrap |
| Unsubscribe page | `app/unsubscribe/page.tsx` | Public self-service (no auth) |
| Manage Preferences page | `app/manage-preferences/page.tsx` | Public self-service (no auth) |

## Backend

- **Framework:** FastAPI, Python 3.14.
- **ORM:** SQLAlchemy 2.x with Pydantic v2 schemas.
- **Entry point:** `backend/app/main.py` — creates the app, configures CORS from the `CORS_ORIGINS` env var, and mounts every router below under `/api/v1`.

| Router | Prefix | Auth | Purpose |
|---|---|---|---|
| `auth.py` | `/auth` | any signed-in user | `GET /me` — return the caller's identity |
| `lists.py` | `/lists` | signed-in user; create/delete need Admin | Distribution list CRUD + per-list subscriber management |
| `subscriptions.py` | `/subscriptions` | signed-in user | Update/delete a single subscription |
| `imports.py` | `/imports` | signed-in user | CSV preview + commit |
| `subscribers.py` | `/subscribers` | signed-in user | Master subscriber directory |
| `audit_logs.py` | `/audit-logs` | signed-in user | Read the audit trail |
| `statistics.py` | `/dashboard` | signed-in user | Aggregate dashboard metrics |
| `self_service.py` | `/self-service` | **none — public** | Subscriber self-lookup, preferences, unsubscribe |

There is no `newsletters`, `ai`, `email`, or `categories` router — those don't exist in this codebase, despite being described in some early planning documents.

### Authentication flow

1. The frontend calls `instance.loginRedirect()`, which sends the browser to Microsoft's login page.
2. On return, MSAL stores an ID token and an access token (scoped to this app's own API, `api://<client-id>/user_impersonation`) in `sessionStorage`.
3. Every API call attaches that access token as `Authorization: Bearer <token>` (refreshed silently by MSAL as needed).
4. The backend (`app/entra_auth.py`) validates the token itself: fetches and caches Microsoft's JWKS, verifies the RS256 signature and issuer, manually checks the `aud` claim against the app's client ID (python-jose's built-in `audience` check only supports a single expected value, so this app validates it by hand), and rejects any account whose email doesn't end in `@biocryst.com`.
5. On first valid token from a given email, the backend auto-creates a local `User` row (`role="curator"`) — see `entra_auth.get_or_create_sso_user`.
6. `app/auth.py`'s `get_current_active_user` / `require_admin` FastAPI dependencies are unchanged from before SSO — only what feeds them changed.

There is deliberately **no** App Service "Easy Auth" in front of the backend. It was briefly auto-enabled when the Entra ID App Registration was created through the Portal, but its redirect-based, same-origin login flow doesn't work for a decoupled SPA (different origin) calling a JSON API over CORS — it was disabled, and all token validation happens in application code instead. See [Deployment Guide](deployment-guide.md) and [Troubleshooting](troubleshooting.md).

## Data model

| Entity | Notes |
|---|---|
| **User** | `role` is `admin` or `curator`. SSO-provisioned users get an unusable random placeholder in `hashed_password` — it's a legacy column from before Entra ID SSO and is never used to authenticate anymore. |
| **Subscriber** | Unique by email. Has a `subscription_token` (UUID) used for personal self-service links. One-to-many with `Subscription`. |
| **List** | A distribution channel. One-to-many with `Subscription`. |
| **Subscription** | Join entity between `Subscriber` and `List`; carries `status`, `source`, `notes`, timestamps. Unique on `(list_id, subscriber_id)`. |
| **AuditLog** | Append-only record of every subscriber-data change; references `list_id`/`subscriber_id` with `ON DELETE SET NULL`. |

Full column-level detail: [Database Schema](database-schema.md).
