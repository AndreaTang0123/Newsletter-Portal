# Release Notes

## 2026-07-26 — 2026-07-27: Microsoft Entra ID single sign-on

- Replaced the mock email/password login (`POST /auth/login`, seeded `curator@company.com` account) entirely with Microsoft Entra ID SSO, restricted to `@biocryst.com` accounts. See [Architecture Overview](architecture-overview.md#authentication-flow).
- New user accounts are auto-provisioned on first sign-in (`curator` role by default; promoting to `admin` is a manual step — see [Deployment Guide](deployment-guide.md#promoting-a-user-to-admin)).
- Added `GET /auth/me` so the frontend can display the real signed-in user instead of a placeholder name.
- Frontend adopted `@azure/msal-browser` + `@azure/msal-react` for a redirect-based sign-in flow.
- Disabled App Service "Easy Auth," which had auto-enabled itself against the same Entra ID App Registration and was incompatible with the app's cross-origin SPA + API architecture.
- Fixed two bugs found while rolling this out (both documented in [Troubleshooting](troubleshooting.md)):
  - `python-jose`'s token audience check silently rejected every token because it was passed a list instead of a single string.
  - The frontend's MSAL initialization had no error handling, so any init failure produced a permanent blank screen instead of a visible error.

## 2026-07-20: Session length & backend CI/CD

- Fixed a bug where `ACCESS_TOKEN_EXPIRE_MINUTES` was read from configuration but never actually applied — tokens always expired after a hardcoded 15 minutes regardless of the setting.
- Added an automatic sign-out on any `401` response instead of leaving the UI stuck in a broken, seemingly-disconnected state.
- Added a GitHub Actions workflow (`deploy-backend.yml`) to auto-deploy the backend to Azure App Service on every push to `main` that touches `backend/**`.

## 2026-07-17 — 2026-07-18: Move to Azure

- Migrated the database from local SQLite to Azure Database for PostgreSQL Flexible Server (private VNet access).
- Migrated the frontend from a Node-hosted Next.js app to a static export (`output: 'export'`), deployed to Azure Static Web Apps with an auto-generated GitHub Actions workflow.
- Deployed the backend to Azure App Service.
- Along the way, fixed two pre-existing bugs that blocked a production build: a missing `metadata.description` reference in `app/layout.tsx`, and an invalid `ignoreDeprecations` value in `tsconfig.json`.

## 2026-07-01 — 2026-07-02: List management fixes

- Fixed list creation and deletion; removed the unused "category" concept from list creation.

## 2026-06-19 — 2026-06-23: Public self-service subscription management

- Added the public, no-login "Manage Preferences" and "Unsubscribe" pages, backed by a per-subscriber token.
- Added `email-footer.html` — the copy-paste HTML snippet for newsletter footers linking to those pages.

## 2026-06-10 — 2026-06-16: Initial build-out

- Implemented the SQLite-backed database layer (users, lists, subscribers, subscriptions, audit logs), the FastAPI backend, and the Next.js admin UI: dashboard, distribution lists, list detail/subscriber management, master subscriber directory, CSV import, and audit log views.
