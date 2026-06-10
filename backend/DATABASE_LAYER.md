# SQLite Database Layer - Implementation Guide

This document describes the complete SQLite database layer implementation for the Newsletter Portal, designed for smooth local development and future migration to Azure SQL.

## Overview

The database layer is built on:
- **SQLAlchemy ORM** - Database abstraction and model definition
- **SQLite** - Local development database (default)
- **Pydantic** - Schema validation
- **FastAPI** - API framework

The implementation is **Azure SQL compatible**, meaning all code uses standard SQLAlchemy patterns and will work seamlessly when migrating to Azure SQL Server.

## Database Architecture

### Entities

#### Users
- **id**: Primary key
- **email**: Unique, indexed (String 255)
- **hashed_password**: Password hash
- **full_name**: User's name (String 255)
- **role**: "admin" or "curator"
- **is_active**: Account status
- **created_at**, **updated_at**: Timestamps
- **Relationships**: Newsletter (one-to-many)

#### Categories
- **id**: Primary key
- **name**: Unique, indexed (String 255)
- **description**: Category description (Text)
- **created_at**: Timestamp
- **Relationships**: Subscriber (many-to-many), Newsletter (many-to-many)

#### Subscribers
- **id**: Primary key
- **email**: Unique, indexed (String 255)
- **full_name**: Name (String 255)
- **company**: Optional (String 255)
- **department**: Optional (String 255)
- **is_subscribed**: Subscription status (Boolean, indexed)
- **is_active**: Account status
- **subscription_token**: Unique token for public unsubscribe (String 255, indexed)
- **created_at**, **updated_at**: Timestamps
- **Relationships**: Category (many-to-many), CampaignHistory (one-to-many)

#### Newsletters
- **id**: Primary key
- **title**: Newsletter title (String 500)
- **content_html**: HTML content (Text)
- **content_text**: Plain text alternative (Text)
- **status**: "draft", "scheduled", or "sent" (String 50, indexed)
- **curator_id**: Foreign key to Users
- **scheduled_for**: Scheduled send time (DateTime, optional)
- **sent_at**: Actual send time (DateTime, optional)
- **created_at**, **updated_at**: Timestamps
- **Relationships**: User (many-to-one), Category (many-to-many), SendHistory (one-to-many)

#### SendHistory
- **id**: Primary key
- **newsletter_id**: Foreign key to Newsletter (indexed)
- **subscriber_id**: Foreign key to Subscriber (indexed, optional)
- **recipient_email**: Email address (String 255, indexed)
- **category**: Category name (String 255)
- **status**: "pending", "success", or "failed" (String 50, indexed)
- **error_message**: Error details (Text, optional)
- **sent_at**: When sent
- **Relationships**: Newsletter (many-to-one), EmailOpenEvent (one-to-many)

#### EmailOpenEvent
- **id**: Primary key
- **send_history_id**: Foreign key to SendHistory (indexed)
- **opened_at**: When opened
- **user_agent**: Email client info (String 500, optional)
- **ip_address**: Opens from IP (String 50, optional)
- **Relationships**: SendHistory (many-to-one)

#### SubscriptionEvent
- **id**: Primary key
- **subscriber_id**: Foreign key to Subscriber (indexed)
- **category_id**: Foreign key to Category (indexed, optional)
- **user_id**: Foreign key to User (optional)
- **action**: "subscribe", "unsubscribe", or "prefer"
- **created_at**: Timestamp
- **Relationships**: Subscriber (many-to-one), Category (many-to-one)

#### CampaignHistory
- **id**: Primary key
- **newsletter_id**: Foreign key to Newsletter (indexed)
- **subscriber_id**: Foreign key to Subscriber (indexed)
- **status**: Delivery status
- **updated_at**: Last update

### Indexes

For performance, indexes are created on:
- `users.email` - Fast user lookups
- `subscribers.email` - Fast subscriber lookups
- `subscribers.subscription_token` - Fast public unsubscribe
- `subscribers.is_subscribed` - Query active subscribers
- `newsletters.status` - Filter by status
- `send_history.status` - Analytics queries
- `send_history.newsletter_id` - Find sends for newsletter
- `email_open_events.send_history_id` - Tracking events
- `subscription_events.subscriber_id` - Event history

## Local Development Setup

### 1. Initial Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### 2. Verify Setup

```bash
# Run verification script
python verify_db.py
```

Expected output:
```
✓ Database Configuration
✓ Models
✓ Schemas
✓ CRUD Functions
✓ Database Initialization
```

### 3. Run Backend

```bash
# Start the development server
python -m uvicorn app.main:app --reload

# Server runs at http://localhost:8000
# API docs available at http://localhost:8000/docs
```

### 4. Default Admin User

On first startup, a default admin user is automatically created:
- **Email**: `curator@company.com`
- **Password**: `securepassword123`
- **Role**: admin

### 5. Default Categories

The following categories are automatically seeded:
- **HAE** - Hardware & Architecture Engineering
- **NS** - Network & Systems
- **CMD** - Communications & Marketing Digest

## Database Initialization

### Automatic Initialization

The database is automatically initialized when the backend starts:

```python
# In app/main.py
from .init_db import seed_database
seed_database()  # Creates tables and seeds default data
```

### Manual Initialization

To initialize the database manually:

```python
from app.init_db import seed_database
seed_database()
```

Or from the command line:

```bash
python -c "from app.init_db import seed_database; seed_database()"
```

### Idempotent Seeding

All seeding functions are idempotent - they can be called multiple times without creating duplicates:

```python
from app.init_db import seed_default_categories, seed_default_admin_user
from app.database import SessionLocal

db = SessionLocal()
seed_default_categories(db)      # Safe to call multiple times
seed_default_admin_user(db)      # Safe to call multiple times
db.close()
```

## CRUD Operations

### User Operations

```python
from app import crud
from app.database import SessionLocal

db = SessionLocal()

# Get user by email
user = crud.get_user_by_email(db, "curator@company.com")

# Get user by ID
user = crud.get_user_by_id(db, user_id=1)

# Create user
user = crud.create_user(db, UserCreate(email="...", password="..."))

# Update user
updated = crud.update_user(db, user_id=1, {"full_name": "New Name"})

# Delete user
success = crud.delete_user(db, user_id=1)

db.close()
```

### Category Operations

```python
# Get all categories
categories = crud.get_categories(db)

# Get category by ID
category = crud.get_category_by_id(db, category_id=1)

# Get category by name
category = crud.get_category_by_name(db, "HAE")

# Create category
category = crud.create_category(db, CategoryCreate(name="New", description="..."))

# Update category
updated = crud.update_category(db, category_id=1, {"description": "..."})

# Delete category
success = crud.delete_category(db, category_id=1)
```

### Subscriber Operations

```python
# Get all subscribers (with pagination)
subscribers = crud.get_subscribers(db, skip=0, limit=100)

# Get subscriber by email
subscriber = crud.get_subscriber_by_email(db, "user@example.com")

# Get subscriber by token (for public unsubscribe)
subscriber = crud.get_subscriber_by_token(db, token)

# Create subscriber with categories
subscriber = crud.create_subscriber(db, SubscriberCreate(
    email="...",
    full_name="...",
    category_ids=[1, 2, 3]
))

# Update subscriber
updated = crud.update_subscriber(db, subscriber_id=1, SubscriberUpdate(
    full_name="New Name",
    category_ids=[1, 2]
))

# Update only categories
updated = crud.update_subscriber_categories(db, subscriber_id=1, [1, 2, 3])

# Delete subscriber
success = crud.delete_subscriber(db, subscriber_id=1)

# Unsubscribe (public endpoint)
subscriber = crud.unsubscribe_public(db, SubscriberUnsubscribePublic(
    email="user@example.com",
    category_ids=[1, 2]  # Categories to keep
))
```

### Newsletter Operations

```python
# Get all newsletters (with optional status filter)
newsletters = crud.get_newsletters(db, status="sent")

# Get newsletter by ID
newsletter = crud.get_newsletter(db, newsletter_id=1)

# Create newsletter
newsletter = crud.create_newsletter(db, NewsletterCreate(
    title="...",
    content_html="...",
    category_ids=[1, 2]
), curator_id=1)

# Update newsletter
updated = crud.update_newsletter(db, newsletter, NewsletterUpdate(
    status="sent",
    sent_at=datetime.utcnow()
))

# Delete newsletter
success = crud.delete_newsletter(db, newsletter_id=1)
```

### Send History Operations

```python
# Create send record
send = crud.create_send_history(
    db,
    newsletter_id=1,
    recipient_email="user@example.com",
    subscriber_id=1,
    status="success"
)

# Get send by ID
send = crud.get_send_history(db, send_history_id=1)

# Get sends for newsletter
sends = crud.get_send_history_by_newsletter(db, newsletter_id=1)

# Get sends by status
failed_sends = crud.get_send_history_by_status(db, "failed")

# Update send status
updated = crud.update_send_history_status(
    db,
    send_history_id=1,
    status="success",
    error_message=None
)
```

### Email Open Tracking

```python
# Record email open
event = crud.create_email_open_event(
    db,
    send_history_id=1,
    user_agent="Mozilla/5.0...",
    ip_address="192.168.1.1"
)

# Get opens for send
opens = crud.get_open_events_by_send_history(db, send_history_id=1)

# Get opens for newsletter
opens = crud.get_open_events_by_newsletter(db, newsletter_id=1)
```

### Dashboard Statistics

```python
# Get dashboard stats
stats = crud.get_dashboard_statistics(db)
# Returns:
# {
#   "total_newsletters": 42,
#   "success_rate": 98.5,
#   "open_rate": 35.2
# }

# Get subscriber count
active_count = crud.get_subscriber_count(db, is_active=True)

# Get newsletter count
sent_count = crud.get_newsletter_count(db, status="sent")
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with email/password

### Categories
- `GET /api/v1/categories` - List all categories
- `POST /api/v1/categories` - Create category (admin)

### Subscribers
- `GET /api/v1/subscribers` - List subscribers (admin)
- `POST /api/v1/subscribers` - Create subscriber
- `POST /api/v1/subscribers/import` - Import from CSV (admin)
- `POST /api/v1/subscribers/unsubscribe` - Public unsubscribe

### Newsletters
- `GET /api/v1/newsletters` - List newsletters
- `POST /api/v1/newsletters` - Create newsletter
- `GET /api/v1/newsletters/{id}` - Get newsletter
- `PUT /api/v1/newsletters/{id}` - Update newsletter
- `POST /api/v1/newsletters/{id}/send` - Send newsletter

### Statistics
- `GET /api/v1/statistics/dashboard` - Dashboard stats
- `GET /api/v1/track/open/{send_history_id}` - Track email open

### Email
- `GET /api/v1/email/history` - Campaign history

## Migration to Azure SQL

### Connection String

To migrate from SQLite to Azure SQL, update the `DATABASE_URL` in `.env`:

```bash
# Current (SQLite):
DATABASE_URL=sqlite:///./newsletter.db

# Azure SQL (Future):
DATABASE_URL=mssql+pyodbc://user:password@server.database.windows.net:1433/dbname?driver=ODBC+Driver+17+for+SQL+Server
```

### Required Changes

**Minimal changes needed:**
1. Update `DATABASE_URL` in `.env`
2. Install additional driver: `pip install pyodbc`
3. Restart backend

**No code changes required** because:
- All models use standard SQLAlchemy types
- No SQLite-specific SQL is used
- All queries are ORM-based
- String lengths are explicitly defined
- DateTime handling is standardized

### Testing Azure SQL Connection

```bash
# Install ODBC driver (Windows)
# Download from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

# Update requirements.txt to include:
# pyodbc==4.0.39

# Update DATABASE_URL in .env with Azure SQL connection string

# Restart backend - tables will be created automatically
```

## Database Schema Export

To see the generated SQL schema:

```python
from app.database import engine
from app import models

# Print SQL for all models
for model in [models.User, models.Subscriber, models.Category, 
              models.Newsletter, models.SendHistory, models.EmailOpenEvent]:
    print(f"\n{model.__tablename__}:")
    for column in model.__table__.columns:
        print(f"  {column.name}: {column.type}")
```

## Best Practices

### 1. Always Use Sessions
```python
from app.database import SessionLocal

db = SessionLocal()
try:
    # Use db
finally:
    db.close()
```

### 2. Pagination for Large Datasets
```python
subscribers = crud.get_subscribers(db, skip=0, limit=100)
```

### 3. Use Indexes Efficiently
The system automatically indexes common lookup fields. For additional queries, consider adding indexes in models.

### 4. Transaction Management
```python
try:
    result = crud.create_subscriber(db, ...)
    db.commit()
except Exception as e:
    db.rollback()
    raise
```

### 5. Idempotent Operations
Always check existence before creating:
```python
existing = crud.get_subscriber_by_email(db, email)
if not existing:
    crud.create_subscriber(db, ...)
```

## Troubleshooting

### Database File Not Created
**Symptom**: `newsletter.db` not created
**Solution**: Run `python -c "from app.init_db import seed_database; seed_database()"`

### Foreign Key Constraints Error
**Symptom**: "FOREIGN KEY constraint failed"
**Solution**: Ensure referenced records exist before creating dependent records

### Index Already Exists
**Symptom**: "IndexError: index already exists"
**Solution**: This is safe to ignore - check idempotency is working

### Connection String Error
**Symptom**: "Could not connect to database"
**Solution**: Verify `DATABASE_URL` in `.env` is correct format

## File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, starts seeding
│   ├── database.py          # SQLAlchemy setup
│   ├── init_db.py           # Database initialization & seeding
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # CRUD operations
│   ├── auth.py              # Authentication
│   └── routers/
│       ├── auth.py
│       ├── categories.py
│       ├── subscribers.py
│       ├── newsletters.py
│       ├── statistics.py
│       ├── email.py
│       └── ai.py
├── .env.example             # Environment template
├── requirements.txt         # Python dependencies
├── verify_db.py            # Database verification script
└── README.md               # Original setup guide
```

## Summary

The database layer is:
- ✓ Fully functional for local SQLite development
- ✓ Completely Azure SQL compatible
- ✓ Properly indexed for performance
- ✓ Idempotently seeded
- ✓ Well-documented for maintenance
- ✓ Ready for production deployment

No additional work is required. The system is ready to be deployed locally or migrated to Azure SQL at any time.
