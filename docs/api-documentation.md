# API Documentation

The backend exposes a REST API built with FastAPI. All endpoints, except public subscription management and login, require a valid JWT bearer token.

## Auth Routes
- `POST /api/v1/auth/login` - Obtain JWT access token.

### Login Payload
```json
{
  "email": "curator@company.com",
  "password": "securepassword123"
}
```

### Mock Login Notes
A default admin user is seeded on backend startup if one does not already exist.
- Email: `curator@company.com`
- Password: `securepassword123`

All protected routes require a valid JWT bearer token in the `Authorization` header.

## Newsletter Routes
- `GET /api/v1/newsletters/` - List all newsletters (drafts & sent).
- `POST /api/v1/newsletters/` - Create a new newsletter draft.
- `GET /api/v1/newsletters/{id}` - Get details of a single newsletter.
- `PUT /api/v1/newsletters/{id}` - Update a newsletter draft.
- `DELETE /api/v1/newsletters/{id}` - Delete a draft.
- `POST /api/v1/newsletters/{id}/send` - Trigger email dispatch to subscribers in targeted categories.

## Subscriber Routes
- `GET /api/v1/subscribers/` - List all subscribers (Admin only).
- `POST /api/v1/subscribers/` - Create/register a subscriber.
- `POST /api/v1/subscribers/import` - Bulk upload subscribers via CSV.
- `POST /api/v1/subscribers/unsubscribe` - Public endpoint to unsubscribe a subscriber from specific categories.

## Category Routes
- `GET /api/v1/categories/` - Retrieve all newsletter categories.
- `POST /api/v1/categories/` - Create a new category.
- `PUT /api/v1/categories/{id}` - Update category info.
- `DELETE /api/v1/categories/{id}` - Delete category.

## AI Draft Routes
- `POST /api/v1/ai/generate-draft` - Request LLM to produce a newsletter draft based on a prompt and category.
