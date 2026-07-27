# Troubleshooting

Real issues encountered while building and operating this system, with root cause and fix. Start here before re-diagnosing from scratch.

## Sign-in / frontend

### The app is a blank white screen — nothing renders at all
**Cause:** `MsalProviderWrapper` initializes MSAL in a `useEffect` and returns `null` until that finishes. If `PublicClientApplication.initialize()` or `handleRedirectPromise()` throws for any reason, the promise chain rejects and the component gets stuck returning `null` forever.
**Fix already in place:** the wrapper now has a `.catch()` that surfaces the error on-screen and logs it via `console.error`. **If you still see a blank screen**, the fix itself may be missing from the deployed build (check the browser console first — an error there means the catch fired and something else is wrong; a *silent* blank screen with nothing in the console means an even older build is live). Verify the live SWA build actually includes `components/MsalProviderWrapper.tsx`'s error handling, and check the console for the actual message.

### Signed in successfully, but immediately land back on the sign-in / sign-out screen
**Cause:** the first API call after login (`GET /auth/me` or `/dashboard/stats`) returned `401`, which the axios response interceptor in `lib/api.ts` treats as "token rejected" and reacts by calling `logoutRedirect()`.
**How to confirm:** check the backend's request logs (see [Deployment Guide](deployment-guide.md) for how to pull App Service logs) for `401` responses on `/api/v1/auth/me` right after the sign-in timestamp.
**Known past cause (fixed):** `entra_auth.py` passed a Python **list** as the `audience` argument to `python-jose`'s `jwt.decode()`. `python-jose` only supports a single string there — internally it checks `if audience not in claims["aud"]`, and a list can never be a member of another list, so *every* token failed validation regardless of whether it was actually valid. Fixed by disabling the library's built-in audience check (`options={"verify_aud": False}`) and validating `claims["aud"]` against the acceptable values manually.
**Other things to check if this recurs:** confirm `AZURE_AD_CLIENT_ID`/`AZURE_AD_TENANT_ID` App Service settings match the App Registration exactly, and that the signed-in account's email actually ends in `@biocryst.com` (a `403`, not `401`, means the token was valid but the domain check failed).

### Login redirects to Microsoft but errors with an `AADSTS...` code
Almost always a **redirect URI mismatch**. The Entra ID App Registration's **SPA platform** redirect URIs must include the exact origin you're testing from (`https://red-tree-04ffd2c0f.7.azurestaticapps.net` for production, `http://localhost:3000` for local dev) — not the *Web* platform redirect URI (that one belongs to the now-disabled Easy Auth setup and points at the backend's `/.auth/login/aad/callback`, which is unrelated). See [Deployment Guide](deployment-guide.md#entra-id-app-registration).

### API calls fail with a CORS error in the browser console
The backend's `CORS_ORIGINS` App Service setting doesn't include the frontend's actual origin, or App Service Easy Auth has been re-enabled (see below) and is intercepting the request before FastAPI's CORS middleware ever runs.

### API calls to the backend get redirected instead of returning JSON, or every request needs a login page
Someone re-enabled **App Service Authentication ("Easy Auth")** — it auto-turns-on whenever Entra ID sign-in is configured for the App Service through the Portal's "Authentication" blade, and its redirect/cookie flow is incompatible with this app's cross-origin SPA+API setup. Disable it — see [Deployment Guide](deployment-guide.md#entra-id-app-registration) for the exact `az rest` commands (`az webapp auth update` does **not** work on this site; its auth config is on v2 and that command only supports v1).

## Backend deployment

### Container fails to start — Azure reports "did not start within expected time limit of 230s"
This message is misleading — check the actual container logs before assuming it's a slow startup. In practice this has always turned out to be the container **crashing within seconds**, not hanging:
- **Missing `email-validator` package:** any Pydantic model using `EmailStr` (several do) needs the `email-validator` package installed, but it's not a transitive dependency of `pydantic` itself. If it's missing, importing `app.schemas` raises `ImportError` at startup and the process exits immediately. Fix: confirm `email-validator` is in `backend/requirements.txt`.
- To see the *real* error instead of the misleading timeout message, enable filesystem logging and pull the container's stdout/stderr:
  ```bash
  az webapp log config --resource-group rg-newsletter --name Biocryst-Newsletter --application-logging filesystem --docker-container-logging filesystem
  ```
  then fetch `LogFiles/<date>_..._docker.log` via the Kudu VFS API (see [Deployment Guide](deployment-guide.md)) and search for `Traceback`.

### `az webapp deploy` succeeds but the app still 401s / behaves like the old code
Azure needs a moment to recycle the container after a zip deploy. Wait ~15–30 seconds and retry before assuming the deploy didn't take. If it's still wrong after that, confirm you actually zipped the *updated* files (stale `/tmp/backend-deploy.zip` from a previous run is an easy mistake).

## GitHub Actions

### Backend deploy workflow fails with "Publish profile does not contain kudu URL"
The `AZURE_WEBAPP_PUBLISH_PROFILE` GitHub secret has malformed or incomplete content — usually from copying only part of the XML, or from running `az webapp deployment list-publishing-profiles` **without** the `--xml` flag (which returns a different, incompatible format). Fix: re-fetch with `--xml` and replace the secret entirely:
```bash
az webapp deployment list-publishing-profiles --resource-group rg-newsletter --name Biocryst-Newsletter --xml | pbcopy
```
Paste the full clipboard contents into the secret (Settings → Secrets and variables → Actions → update `AZURE_WEBAPP_PUBLISH_PROFILE`), then re-run the failed workflow from the Actions tab.

### Frontend workflow doesn't pick up a new `NEXT_PUBLIC_*` value
These are baked into the static bundle at **build** time, not read at runtime. Confirm the variable is set in the workflow's `env:` block (`.github/workflows/azure-static-web-apps-red-tree-04ffd2c0f.yml`) and that a new build actually ran afterward — editing `.env.local` locally has no effect on the deployed site.

### `git push` fails locally with "Invalid username or token" or "could not read Password"
The stored macOS Keychain credential for `github.com` is stale or was never a valid Personal Access Token (a saved password no longer works — GitHub requires a PAT or SSH key). Generate a new PAT (Settings → Developer settings → Personal access tokens) and re-authenticate, or push from a machine/session that already has working credentials.

## Azure CLI / permissions

### `az ad app` write commands (updating redirect URIs, scopes, etc.) fail with `Authorization_RequestDenied`
Editing an Entra ID App Registration requires the **Application Administrator** (or higher) *directory role* — this is separate from Azure subscription-level Owner/Contributor RBAC, and having the latter doesn't grant the former. Either get that directory role assigned, or do the edit through the Portal with an account that already has it. Also check `az ad app owner list --id <app-id>` — a freshly auto-created App Registration (e.g. one created implicitly by enabling Easy Auth) may have **no owners at all**, which also blocks edits from anyone but a directory admin.

### `az webapp auth update` fails with "site is running on auth version v2"
That command only supports the legacy v1 Easy Auth config format. Use `az rest` against the `config/authsettingsV2` resource directly instead — see [Deployment Guide](deployment-guide.md#entra-id-app-registration) for the exact commands.

## Data / roles

### A brand-new user can't create or delete a list
Expected — new SSO sign-ins default to the `curator` role. See [FAQ](faq.md#i-signed-in-for-the-first-time--why-cant-i-create-a-list) and [Deployment Guide](deployment-guide.md#promoting-a-user-to-admin) for how to promote them.

### A subscriber is subscribed/unsubscribed in the app but the actual email behavior doesn't match
This app only stores subscription state — it doesn't send the newsletter itself. Confirm the *sending* system (whatever composes/mails the actual newsletter) is actually reading from this app's data (e.g. a CSV export) and that the export is current. See [Product Overview](product-overview.md#what-this-product-does-not-do).
