# Database Schema Documentation

The system uses a relational database schema (e.g., PostgreSQL or SQLite) managed through SQLAlchemy.

```mermaid
erDiagram
    USER ||--o{ NEWSLETTER : creates
    NEWSLETTER ||--o{ CAMPAIGN_HISTORY : logs
    NEWSLETTER }o--o{ CATEGORY : targets
    SUBSCRIBER }o--o{ CATEGORY : subscribes_to
    NEWSLETTER }o--o{ CATEGORY : targets
    SUBSCRIBER ||--o{ CAMPAIGN_HISTORY : receives

    USER {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string role "admin | curator"
        boolean is_active
    }

    SUBSCRIBER {
        int id PK
        string email UK
        string full_name
        boolean is_subscribed
        datetime created_at
    }

    CATEGORY {
        int id PK
        string name UK
        string description
    }

    NEWSLETTER {
        int id PK
        string title
        string content_html
        string content_text
        string status "draft | scheduled | sent"
        int curator_id FK
        datetime created_at
        datetime scheduled_for
        datetime sent_at
    }

    CAMPAIGN_HISTORY {
        int id PK
        int newsletter_id FK
        int subscriber_id FK
        string status "sent | delivered | bounced | opened"
        datetime updated_at
    }
```

## Schema Entities

### 1. User
Represents curators and administrators managing the system.

### 2. Subscriber
Employees or contacts who receive updates.
- Many-to-many relationship with `Category` via a join table `subscriber_category`.

### 3. Category
Different topics of newsletters (e.g., *Product Updates*, *HR Announcements*).

### 4. Newsletter
Contains the email content, scheduling, state, and references the curator who created it.

### 5. Campaign History
Audit logs showing which newsletters were delivered to which subscribers, including status tracking (sent, opened, bounced).
