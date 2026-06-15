# API Documentation

The backend exposes a REST API built with FastAPI. All endpoints are prefixed with `/api/v1`. Unless otherwise noted, protected endpoints require a valid JWT bearer token in the `Authorization` header.

The API is documented automatically via FastAPI's built-in Swagger UI at `http://localhost:8000/docs` when the backend is running.

---

## Root

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Health check — returns `{"message": "Subscriber Management Portal API is running."}` |

---

## Auth (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | Authenticate with email and password, receive a JWT access token |

### `POST /auth/login`

**Request Body:**

```json
{
  "email": "curator@company.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Error (401 Unauthorized):**

```json
{
  "detail": "Incorrect email or password"
}
```

**Notes:** A default admin user is seeded on backend startup: `curator@company.com` / `securepassword123`.

---

## Distribution Lists (`/api/v1/lists`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/lists/` | Yes | Any | List all distribution lists with subscriber stats |
| POST | `/lists/` | Yes | Admin | Create a new distribution list |
| GET | `/lists/{list_id}` | Yes | Any | Get details and stats for a specific list |
| GET | `/lists/{list_id}/subscribers` | Yes | Any | Get all subscribers in a list (with optional search and status filter) |
| POST | `/lists/{list_id}/subscribers` | Yes | Any | Add a subscriber to a list |

### `GET /lists/`

Returns an array of lists, each including subscriber counts:

```json
[
  {
    "id": 1,
    "name": "Weekly Newsletter",
    "description": "Weekly CI Newsletter distribution list",
    "owner": "Alex Sherman",
    "category": "Weekly",
    "created_at": "2026-06-15T00:00:00",
    "updated_at": "2026-06-15T00:00:00",
    "subscriber_count": 42,
    "active_count": 38,
    "unsubscribed_count": 2,
    "bounced_count": 2
  }
]
```

### `GET /lists/{list_id}/subscribers`

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string (optional) | Filter by name or email substring |
| `status` | string (optional) | Filter by status: `Active`, `Paused`, `Unsubscribed`, `Bounced` |

**Response:** Array of subscriber-subscription records:

```json
[
  {
    "id": 5,
    "subscription_id": 12,
    "name": "John Doe",
    "email": "john@company.com",
    "department": "Engineering",
    "role_title": "Senior Engineer",
    "status": "Active",
    "source": "Curator Added",
    "opt_in_date": "2026-06-15T00:00:00",
    "unsubscribed_at": null,
    "notes": null,
    "created_at": "2026-06-15T00:00:00",
    "updated_at": "2026-06-15T00:00:00"
  }
]
```

### `POST /lists/{list_id}/subscribers`

**Request Body:**

```json
{
  "email": "newuser@company.com",
  "name": "Jane Smith",
  "status": "Active",
  "source": "Curator Added",
  "department": "Marketing",
  "role_title": "Manager",
  "notes": "Added for Q3 campaign"
}
```

Only `email` is required. All other fields are optional.

---

## Subscriptions (`/api/v1/subscriptions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/subscriptions/{subscription_id}` | Yes | Update a subscription record (status, source, notes, subscriber fields) |
| DELETE | `/subscriptions/{subscription_id}` | Yes | Remove a subscription from a list |

### `PUT /subscriptions/{subscription_id}`

**Request Body (all fields optional):**

```json
{
  "status": "Paused",
  "source": "Curator Added",
  "notes": "Paused per request",
  "name": "Updated Name",
  "email": "updated@company.com",
  "department": "New Department",
  "role_title": "New Title"
}
```

### `DELETE /subscriptions/{subscription_id}`

**Response (200 OK):**

```json
{
  "detail": "Subscriber removed from list successfully"
}
```

---

## CSV Imports (`/api/v1/imports`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/imports/preview` | Yes | Upload a CSV file and get a validation preview |
| POST | `/imports/commit` | Yes | Commit validated rows to the database |

### `POST /imports/preview`

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | CSV file to upload |
| `list_id` | integer | Target distribution list ID |

**Response:**

```json
{
  "rows": [
    {
      "name": "John Doe",
      "email": "john@company.com",
      "status": "valid",
      "details": "Ready to import."
    },
    {
      "name": null,
      "email": "duplicate@company.com",
      "status": "duplicate_db",
      "details": "Already subscribed to this list."
    }
  ],
  "total_rows": 10,
  "valid_count": 8,
  "duplicate_count": 1,
  "invalid_count": 1
}
```

**Row statuses:** `valid`, `invalid`, `duplicate_file`, `duplicate_db`

### `POST /imports/commit`

**Request Body:**

```json
{
  "list_id": 1,
  "entries": [
    { "name": "John Doe", "email": "john@company.com" },
    { "email": "jane@company.com" }
  ]
}
```

**Response (201 Created):**

```json
{
  "detail": "Successfully imported 2 subscribers."
}
```

---

## Master Subscribers (`/api/v1/subscribers`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/subscribers/` | Yes | List all unique subscribers with their cross-list subscription statuses |

**Response:**

```json
[
  {
    "id": 5,
    "name": "John Doe",
    "email": "john@company.com",
    "department": "Engineering",
    "role_title": "Senior Engineer",
    "updated_at": "2026-06-15T00:00:00",
    "subscriptions": [
      { "list_id": 1, "list_name": "Weekly Newsletter", "status": "Active" },
      { "list_id": 2, "list_name": "HAE", "status": "Paused" }
    ]
  }
]
```

---

## Audit Logs (`/api/v1/audit-logs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/audit-logs/` | Yes | Retrieve all audit log entries, most recent first |

**Response:**

```json
[
  {
    "id": 42,
    "actor": "curator@company.com",
    "action": "Subscriber added",
    "list_id": 1,
    "list_name": "Weekly Newsletter",
    "subscriber_id": 5,
    "subscriber_email": "john@company.com",
    "timestamp": "2026-06-15T12:00:00",
    "details": null
  }
]
```

**Tracked actions:** `Subscriber added`, `Subscriber removed`, `Subscriber updated`, `List imported`

---

## Dashboard Statistics (`/api/v1/dashboard`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/stats` | Yes | Get aggregate metrics and recent audit log entries |

**Response:**

```json
{
  "total_lists": 4,
  "total_subscribers": 120,
  "active_subscribers": 105,
  "unsubscribed_subscribers": 10,
  "bounced_subscribers": 5,
  "last_updated": "2026-06-15T12:00:00",
  "recent_changes": [ /* AuditLogResponse objects */ ]
}
```

---

## Scaffolded Endpoints (not mounted in `main.py`)

The following routers exist as source files but are **not currently registered** in the application's `main.py`. They will become active when imported and mounted.

### Newsletters (`/api/v1/newsletters`) — `routers/newsletters.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/newsletters/` | List all newsletters |
| POST | `/newsletters/` | Create a newsletter draft |
| GET | `/newsletters/{id}` | Get a single newsletter |
| PUT | `/newsletters/{id}` | Update a newsletter draft |
| POST | `/newsletters/{id}/send` | Send newsletter to subscribers |

### Categories (`/api/v1/categories`) — `routers/categories.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories/` | List all categories (public) |
| POST | `/categories/` | Create a category (Admin only) |

### AI Integration (`/api/v1/ai`) — `routers/ai.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/generate-draft` | Generate newsletter content via Gemini LLM |

### Email Metrics (`/api/v1/email`) — `routers/email.py`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/email/history` | Retrieve campaign sending history |
