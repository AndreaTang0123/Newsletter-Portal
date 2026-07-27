# API Reference

Base URL: `https://biocryst-newsletter-aadserh2c0dqbhen.eastus2-01.azurewebsites.net/api/v1` (local dev: `http://localhost:8000/api/v1`). Interactive Swagger UI is always available at `/docs` on the backend host.

**Authentication:** every endpoint below except the `self-service/*` group requires `Authorization: Bearer <token>`, where `<token>` is a Microsoft Entra ID access token issued to this app's own API scope (`api://e3063381-c4be-496e-8776-889b922b2092/user_impersonation`), acquired by the frontend via MSAL. Endpoints marked **Admin** additionally require the caller's `role` to be `admin`. There is no API key or basic-auth option — see [Architecture Overview](architecture-overview.md#authentication-flow).

## Auth

### `GET /auth/me`
Returns the signed-in user's own record.
```json
{ "email": "curator@biocryst.com", "full_name": "Jane Doe", "role": "curator", "id": 3, "is_active": true, "created_at": "...", "updated_at": "..." }
```

## Distribution Lists

### `GET /lists/`
All lists with subscriber-count stats. Returns `ListWithStats[]` (adds `subscriber_count`, `active_count`, `unsubscribed_count`, `bounced_count` to the base list fields).

### `POST /lists/` — **Admin**
Body: `{ "name": string, "description"?: string, "owner"?: string }`. `409`/`400` if the name already exists. Returns `201` + the created list.

### `GET /lists/{list_id}`
Single list with the same stats shape as the list endpoint. `404` if not found.

### `PUT /lists/{list_id}`
Body: `{ "name"?, "description"?, "owner"? }` (all optional — only provided fields change).

### `DELETE /lists/{list_id}` — **Admin**
`204` on success. Cascades — deletes all `Subscription` rows for this list.

### `GET /lists/{list_id}/subscribers`
Query params: `search?` (matches name/email), `status?` (`Active`/`Paused`/`Unsubscribed`/`Bounced`). Returns `SubscriberWithSubscription[]` — each row combines subscriber fields with that specific subscription's `status`, `source`, `notes`, `subscription_id`, etc.

### `POST /lists/{list_id}/subscribers`
Body (`SubscriptionCreate`):
```json
{ "email": "person@biocryst.com", "name"?: string, "status"?: "Active", "source"?: "Curator Added", "notes"?: string, "department"?: string, "role_title"?: string }
```
Creates the `Subscriber` row if it doesn't exist yet (matched by email), then subscribes them to this list. `201` + the created `Subscription`.

## Subscriptions

### `PUT /subscriptions/{subscription_id}`
Body (`SubscriptionUpdate`, all optional): `status`, `source`, `notes`, `opt_in_date`, `unsubscribed_at`, and — for editing-in-place from the UI — the underlying subscriber's `name`, `email`, `department`, `role_title` too. `404` if not found.

### `DELETE /subscriptions/{subscription_id}`
Removes this one list membership (not the subscriber record itself). `200` with `{ "detail": "Subscriber removed from list successfully" }`, `404` if not found.

## CSV Import

### `POST /imports/preview`
`multipart/form-data`: `list_id` (form field) + `file` (the CSV). Auto-detects a header row and an email column (looks for header names containing "email"/"mail"/"addr"/"contact"), or falls back to scanning each cell for an `@`. Accepts `Name <email@domain>`, separate name/email columns, or bare emails. Returns:
```json
{
  "rows": [{ "name": "...", "email": "...", "status": "valid|invalid|duplicate_file|duplicate_db", "details": "..." }],
  "total_rows": 12, "valid_count": 9, "duplicate_count": 2, "invalid_count": 1
}
```
This endpoint only parses and validates — it does **not** write anything to the database.

### `POST /imports/commit`
Body: `{ "list_id": int, "entries": [{ "email": string, "name"?: string }] }` — send only the rows you actually want imported (typically the ones the preview marked `valid`). Each entry is inserted with `status: "Active"`, `source: "Bulk Import"`. Rows that fail individually are silently skipped so the rest of the batch still commits. Writes one `AuditLog` entry summarizing the import. Returns `{ "detail": "Successfully imported N subscribers." }`.

## Master Subscriber Directory

### `GET /subscribers/`
Every unique subscriber across all lists, each with a `subscriptions: [{ list_id, list_name, status }]` array. Read-only — there's no create/update/delete on this endpoint; edit subscriptions through the list-scoped endpoints above.

## Audit Log

### `GET /audit-logs/`
The full trail, newest activity included, each entry shaped as:
```json
{ "id": 1, "actor": "curator@biocryst.com", "action": "Subscriber added", "list_id": 2, "list_name": "HAE", "subscriber_id": 5, "subscriber_email": "...", "timestamp": "...", "details": "..." }
```
No server-side filtering — pass query params client-side or filter in the UI.

## Dashboard

### `GET /dashboard/stats`
```json
{ "total_lists": 4, "total_subscribers": 812, "active_subscribers": 790, "unsubscribed_subscribers": 15, "bounced_subscribers": 7, "last_updated": "...", "recent_changes": [ /* AuditLogResponse[] */ ] }
```

## Self-Service (public, no auth)

These four endpoints are deliberately excluded from the Entra ID requirement — they're what the public "Manage Preferences" / "Unsubscribe" pages call, identified by the recipient's own `subscription_token` (a UUID) rather than a login.

### `POST /self-service/lookup`
Body: `{ "email": string }`. Looks the subscriber up by email and returns their token + current preferences (same shape as below). `404` if the email isn't found or has no token.

### `GET /self-service/subscriber?token=<uuid>`
Returns:
```json
{ "subscriber_id": 5, "email": "person@biocryst.com", "name": "...", "lists": [{ "list_id": 1, "list_name": "Weekly Newsletter", "is_subscribed": true }, ...] }
```

### `POST /self-service/unsubscribe?token=<uuid>`
Sets every one of the subscriber's subscriptions to `Unsubscribed`. Returns `{ "message": "Successfully unsubscribed from all lists." }`.

### `PUT /self-service/preferences?token=<uuid>`
Body: `{ "subscriptions": [{ "list_id": int, "subscribed": bool }, ...] }` — toggles each listed list on/off for this subscriber. Returns `{ "message": "Preferences updated successfully." }`.

All four return `404` with `{ "detail": "Invalid or expired subscription token." }` for an unrecognized token.
