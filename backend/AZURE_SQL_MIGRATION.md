# Azure PostgreSQL Migration Guide

This guide provides step-by-step instructions for migrating the Newsletter Portal from local SQLite to **Azure Database for PostgreSQL Flexible Server**.

Target resources (already provisioned in `rg-newsletter`, East US 2):
- `biocryst-newsletter-server` — Azure Database for PostgreSQL Flexible Server
- `Biocryst-NewsletterVnet` — Virtual network
- `privatelink.postgres.database.azure.com` — Private DNS zone (server uses **private access**, not a public endpoint)

## Pre-Migration Checklist

- [ ] Azure subscription active
- [ ] Postgres Flexible Server created (`biocryst-newsletter-server`)
- [ ] Database created on the server
- [ ] VNet integration / private access configured (server is on a private DNS zone, not public)
- [ ] Connection string obtained
- [ ] Backup of SQLite database
- [ ] All tests passing on SQLite

## Step 1: Create Azure PostgreSQL Resources

### Option A: Using Azure Portal

1. Go to Azure Portal (portal.azure.com)
2. Create new **Azure Database for PostgreSQL Flexible Server**
   - Server name: `biocryst-newsletter-server`
   - Database name: `newsletter_portal`
   - Compute + storage: Burstable B1ms is sufficient for small deployments
   - Networking: **Private access (VNet Integration)** — attach to `Biocryst-NewsletterVnet` so only resources inside the VNet (e.g. the App Service, once VNet-integrated) can reach it
3. Get the connection string from the Connection strings panel

### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group (already exists: rg-newsletter)
az group create --name rg-newsletter --location eastus2

# Create PostgreSQL Flexible Server with private (VNet) access
az postgres flexible-server create \
  --name biocryst-newsletter-server \
  --resource-group rg-newsletter \
  --location eastus2 \
  --admin-user pgadmin \
  --admin-password YourSecurePassword123! \
  --vnet Biocryst-NewsletterVnet \
  --sku-name Standard_B1ms \
  --tier Burstable

# Create database
az postgres flexible-server db create \
  --resource-group rg-newsletter \
  --server-name biocryst-newsletter-server \
  --database-name newsletter_portal
```

## Step 2: Configure Local Environment

### Install PostgreSQL client libraries (for local testing against the cloud DB)

**macOS:**
```bash
brew install postgresql
```

**Linux (Ubuntu):**
```bash
apt-get update
apt-get install libpq-dev
```

**Windows:** the `psycopg2-binary` wheel bundles its own libpq — no separate driver install needed.

### Update Backend Dependencies

```bash
cd backend

# Add psycopg2-binary to requirements.txt
echo "psycopg2-binary==2.9.9" >> requirements.txt

# Reinstall dependencies
pip install -r requirements.txt
```

## Step 3: Update Environment Configuration

### Update `.env` File

```bash
# Before (SQLite):
DATABASE_URL=sqlite:///./newsletter.db

# After (Azure PostgreSQL):
DATABASE_URL=postgresql+psycopg2://pgadmin:password@biocryst-newsletter-server.postgres.database.azure.com:5432/newsletter_portal?sslmode=require
```

### Connection String Format

```
postgresql+psycopg2://username:password@server.postgres.database.azure.com:5432/database_name?sslmode=require
```

**Components:**
- `username`: Postgres admin user (or a scoped app-specific role)
- `password`: Admin/role password
- `server`: Your Flexible Server hostname (e.g., `biocryst-newsletter-server.postgres.database.azure.com`)
- `database_name`: Database name (e.g., `newsletter_portal`)
- `sslmode=require`: Azure Postgres Flexible Server enforces TLS by default

> Because the server uses **private access**, this connection string only resolves/connects from inside the VNet (or a peered network) — e.g. from the App Service once it has outbound VNet integration configured. It will not work from an arbitrary laptop unless you're on a VPN/bastion into the VNet.

## Step 4: Test Connection

### Test Connection String

```python
from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Test connection
with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print("✓ Connection successful")
```

### Run Connection Test Script

```bash
python -c "
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('✓ Connection successful')
"
```

## Step 5: Migrate Database Schema

### Automatic Migration

The database schema will be created automatically on first start:

```bash
# Start backend with Azure PostgreSQL
python -m uvicorn app.main:app --reload

# The backend will:
# 1. Create all tables
# 2. Seed default categories (HAE, NS, CMD)
# 3. Create default admin user
```

All models in `app/models.py` use portable SQLAlchemy types (`Integer`, `String`, `Boolean`, `DateTime`, `Text`) — no SQLite-specific features, so no model changes are required for Postgres.

### Manual Migration

```python
from app.init_db import init_database
from app.database import engine

init_database()
print("✓ Schema created in Azure PostgreSQL")
```

## Step 6: Migrate Data (if needed)

### Option A: Export from SQLite, Import to PostgreSQL

```python
"""
Export data from SQLite and import to Azure PostgreSQL
"""
import sqlite3
from app.database import SessionLocal
from app.models import User, Subscriber, Category, Newsletter

# 1. Connect to SQLite
sqlite_conn = sqlite3.connect('./newsletter.db')
sqlite_cursor = sqlite_conn.cursor()

# 2. Query data from SQLite
categories = sqlite_cursor.execute("SELECT * FROM categories").fetchall()

# 3. Connect to Azure PostgreSQL
db = SessionLocal()

# 4. Insert data
for cat_data in categories:
    # Map and insert
    pass

db.close()
sqlite_conn.close()
```

### Option B: pg_dump / Restore

For production data, use standard PostgreSQL tooling:

```bash
# Create backup of production SQLite as CSV/SQL, then load via psql,
# or use a one-off ETL script per Option A above.

# For direct PostgreSQL-to-PostgreSQL migrations (e.g. staging -> prod):
pg_dump "postgresql://user:password@source-server.postgres.database.azure.com/newsletter_portal?sslmode=require" > backup.sql
psql "postgresql://user:password@biocryst-newsletter-server.postgres.database.azure.com/newsletter_portal?sslmode=require" < backup.sql
```

## Step 7: Verify Migration

### Run Verification Script

```bash
# Verify all tables created
python -c "
from app.database import engine
from sqlalchemy import inspect

inspector = inspect(engine)
tables = inspector.get_table_names()

print('Tables created:')
for table in tables:
    print(f'  ✓ {table}')
"
```

### Test Endpoints

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "curator@company.com",
    "password": "securepassword123"
  }'

# Get categories
curl http://localhost:8000/api/v1/categories

# Get subscribers
curl http://localhost:8000/api/v1/subscribers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 8: Update Application Configuration

### Update CI/CD Pipeline

If using CI/CD, update environment variables:

```yaml
# Example GitHub Actions
env:
  DATABASE_URL: ${{ secrets.AZURE_POSTGRES_CONNECTION_STRING }}
```

### Secrets Management

```bash
# Store connection string in Key Vault
az keyvault secret set \
  --vault-name newsletter-vault \
  --name database-url \
  --value "postgresql+psycopg2://..."

# Reference in App Service
az webapp config appsettings set \
  --resource-group rg-newsletter \
  --name Biocryst-Newsletter \
  --settings DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://...)"
```

## Step 9: Performance Optimization

### Create Indexes (Optional)

PostgreSQL will automatically create indexes on primary keys. For best performance, verify these exist (they're already declared in `app/models.py` via `unique=True`/`index=True`, but double-check on the live DB):

```sql
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriber_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscriber_token ON subscribers(subscription_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_send_history_status ON send_history(status);
```

### Enable Query Performance Insight

```bash
az postgres flexible-server parameter set \
  --resource-group rg-newsletter \
  --server-name biocryst-newsletter-server \
  --name pg_qs.query_capture_mode \
  --value TOP
```

## Rollback Plan

### If Migration Fails

1. **Keep SQLite running** - Don't delete `newsletter.db`
2. **Revert environment** - Change `DATABASE_URL` back to SQLite
3. **Restart backend** - Backend will reconnect to SQLite
4. **Debug issue** - Check connection string, VNet integration, private DNS resolution, etc.
5. **Retry migration** - After fixes

### Keep Both Running (A/B Testing)

```bash
# Run with SQLite
DATABASE_URL=sqlite:///./newsletter.db python -m uvicorn app.main:app --port 8000

# In another terminal, run with Azure PostgreSQL
DATABASE_URL=postgresql+psycopg2://... python -m uvicorn app.main:app --port 8001

# Compare behavior, then switch
```

## Common Issues and Solutions

### Connection Timeout / Could Not Translate Host Name

**Error**: "could not translate host name to address" or "timeout expired"

**Cause**: `biocryst-newsletter-server` uses **private access** via `privatelink.postgres.database.azure.com`. It won't resolve or be reachable from outside the VNet.

**Solution**:
```bash
# From the App Service: confirm outbound VNet integration is enabled and
# points at a subnet within Biocryst-NewsletterVnet.
az webapp vnet-integration list \
  --resource-group rg-newsletter \
  --name Biocryst-Newsletter

# From a local machine: you'll need a VPN/bastion into the VNet, or
# temporarily add a public-access firewall rule for testing only.
```

### Authentication Failed

**Error**: "password authentication failed for user"

**Solution**:
```bash
# Verify credentials
# Confirm the admin username matches exactly (Postgres Flexible Server
# does NOT require the server@ prefix that older Single Server did)
```

### Table Not Found

**Error**: `relation "users" does not exist`

**Solution**:
```bash
# Run init_database manually
python -c "from app.init_db import init_database; init_database()"

# Or restart backend — seed_database() runs on app import
```

### SSL Required

**Error**: `FATAL: SSL/TLS required`

**Solution**: ensure `?sslmode=require` is present in `DATABASE_URL` — Flexible Server enforces TLS by default and rejects unencrypted connections.

## Post-Migration Checklist

- [ ] All tables created successfully
- [ ] API endpoints responding correctly
- [ ] User login working
- [ ] Default admin user created
- [ ] Default categories seeded
- [ ] Send history tracking working
- [ ] Email open tracking working
- [ ] Dashboard statistics showing correct data
- [ ] Performance acceptable
- [ ] Backups configured (automatic backups are on by default for Flexible Server)
- [ ] Monitoring alerts enabled

## Azure PostgreSQL Best Practices

### 1. Scaling

```bash
# Monitor CPU/Memory usage in Azure Portal
# Scale up if needed (more compute)
az postgres flexible-server update \
  --resource-group rg-newsletter \
  --name biocryst-newsletter-server \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose
```

### 2. Backup and Restore

```bash
# Automatic backups are enabled by default (7-35 day retention)
az postgres flexible-server show \
  --resource-group rg-newsletter \
  --name biocryst-newsletter-server \
  --query backup

# Point-in-time restore to a new server
az postgres flexible-server restore \
  --resource-group rg-newsletter \
  --name biocryst-newsletter-server-restored \
  --source-server biocryst-newsletter-server \
  --restore-time "2026-07-18T00:00:00Z"
```

### 3. Monitoring

```bash
# View query performance (requires pg_stat_statements / Query Store)
az postgres flexible-server parameter show \
  --resource-group rg-newsletter \
  --server-name biocryst-newsletter-server \
  --name shared_preload_libraries
```

### 4. Security

```bash
# Confirm private access / no public endpoint
az postgres flexible-server show \
  --resource-group rg-newsletter \
  --name biocryst-newsletter-server \
  --query network

# Enable Microsoft Defender for Cloud threat detection at the subscription level
```

## Cost Optimization

### Tier Recommendations

- **Development**: Burstable B1ms (~$12-15/month)
- **Production Low Load**: Burstable B2s or General Purpose D2s_v3 (~$60-120/month)
- **Production High Load**: General Purpose D4s_v3+ or Memory Optimized (~$250+/month)

### Reduce Costs

```bash
# Stop the server when not in use (dev/test only — max 7 days, auto-resumes)
az postgres flexible-server stop \
  --resource-group rg-newsletter \
  --name biocryst-newsletter-server

# Resume when needed
az postgres flexible-server start \
  --resource-group rg-newsletter \
  --name biocryst-newsletter-server
```

## Support and Resources

- [Azure Database for PostgreSQL Documentation](https://learn.microsoft.com/en-us/azure/postgresql/)
- [SQLAlchemy PostgreSQL Dialect (psycopg2)](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#module-sqlalchemy.dialects.postgresql.psycopg2)
- [Azure Postgres Flexible Server Networking](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/concepts-networking)
- [Azure PostgreSQL Connection Strings](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-connect-tls-ssl)

## Summary

Migration to Azure PostgreSQL is straightforward:
1. ✓ Add `psycopg2-binary` to `requirements.txt`
2. ✓ Confirm VNet integration between App Service and the private Postgres server
3. ✓ Update `DATABASE_URL` in `.env` (postgresql+psycopg2 dialect, `sslmode=require`)
4. ✓ Restart backend (schema created automatically)
5. ✓ No model code changes required — existing types are already Postgres-compatible

The entire process takes approximately 30-45 minutes (the extra time vs. a public-endpoint DB is VNet integration setup) and requires no application code modifications beyond the dependency and connection string.
