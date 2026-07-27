# Database Schema

**Engine:** Azure Database for PostgreSQL Flexible Server in production (private network only); SQLite for local development. **ORM:** SQLAlchemy 2.x, models defined in `backend/app/models.py`. Tables are created automatically on backend startup via `Base.metadata.create_all()` — there is no separate migration tool (Alembic etc.) in use, so schema changes today mean editing `models.py` and letting the next deploy create any new tables/columns.

## Entity relationships

```
User (standalone — not FK-linked to List/Subscriber/Subscription;
      AuditLog.actor references a user by plain email string, not a FK)

List ──1───────*── Subscription ──*───────1── Subscriber
 (ON DELETE CASCADE)              (ON DELETE CASCADE)

List ──0..1─────*── AuditLog ──*─────0..1── Subscriber
 (ON DELETE SET NULL)          (ON DELETE SET NULL)
```

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | Integer, PK | |
| `email` | String(255), unique, indexed, not null | |
| `hashed_password` | String, not null | Legacy — since the move to Entra ID SSO, this holds an unusable random placeholder for every user; it is never checked to authenticate anyone anymore. |
| `full_name` | String(255), nullable | Populated from the Entra ID `name` claim on first sign-in. |
| `role` | String(50), default `curator` | `curator` or `admin`. |
| `is_active` | Boolean, default `true` | |
| `created_at` / `updated_at` | timestamptz | Server-defaulted. |

Rows are created automatically the first time someone signs in with a valid `@biocryst.com` Entra ID account (`entra_auth.get_or_create_sso_user`) — there is no signup form and no seeded default user.

### `lists`
| Column | Type | Notes |
|---|---|---|
| `id` | Integer, PK | |
| `name` | String(255), unique, indexed, not null | |
| `description` | Text, nullable | |
| `owner` | String(255), nullable | Free-text display name, not a foreign key to `users`. |
| `category` | String(50), nullable | e.g. `Weekly`, `HAE`, `CMD`, `NS`. |
| `created_at` / `updated_at` | timestamptz | |

Seeded on first backend startup with four lists: Weekly Newsletter, HAE, CMD, NS.

### `subscribers`
| Column | Type | Notes |
|---|---|---|
| `id` | Integer, PK | |
| `name` | String(255), nullable | |
| `email` | String(255), unique, indexed, not null | One row per unique email, shared across all list memberships. |
| `department` | String(255), nullable | |
| `role_title` | String(255), nullable | |
| `subscription_token` | String(36), unique, indexed, nullable | UUID, auto-generated. Powers the public self-service pages — this is the `?token=` value in personal footer links. |
| `created_at` / `updated_at` | timestamptz | |

### `subscriptions`
The join table between `subscribers` and `lists` — this is what actually gets added/edited/removed when you manage a subscriber's membership in a list.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer, PK | |
| `list_id` | FK → `lists.id`, `ON DELETE CASCADE`, not null | |
| `subscriber_id` | FK → `subscribers.id`, `ON DELETE CASCADE`, not null | |
| `status` | String(50), default `Active`, not null | `Active` / `Paused` / `Unsubscribed` / `Bounced`. |
| `source` | String(50), default `Bulk Import`, not null | `Bulk Import` / `Curator Added` / `Self-Service`. |
| `opt_in_date` | timestamptz, server-defaulted | |
| `unsubscribed_at` | timestamptz, nullable | |
| `notes` | Text, nullable | |
| `created_at` / `updated_at` | timestamptz | |

**Constraint:** `UNIQUE (list_id, subscriber_id)` — a subscriber can only have one subscription row per list.

### `audit_logs`
Append-only; nothing in the application updates or deletes these rows.

| Column | Type | Notes |
|---|---|---|
| `id` | Integer, PK | |
| `actor` | String(255), nullable | The acting user's email, or `NULL` for system-generated entries (rendered as "System" in the UI). |
| `action` | String(255), not null | Free text, e.g. `"Subscriber added"`, `"Subscriber removed"`, `"List imported"`. |
| `list_id` | FK → `lists.id`, nullable, `ON DELETE SET NULL` | |
| `subscriber_id` | FK → `subscribers.id`, nullable, `ON DELETE SET NULL` | |
| `timestamp` | timestamptz, server-defaulted, not null | |
| `details` | Text, nullable | |

## Notes for Postgres specifically

- All types used (`Integer`, `String`, `Boolean`, `DateTime(timezone=True)`, `Text`) are portable — nothing SQLite-specific leaked into `models.py`, so the same model file works unmodified against both engines.
- Connections use `sslmode=require`; the server has no public network access, only reachable from inside its VNet (see [Deployment Guide](deployment-guide.md#networking)).
- Automated backups are enabled at the Azure level by default (point-in-time restore).
