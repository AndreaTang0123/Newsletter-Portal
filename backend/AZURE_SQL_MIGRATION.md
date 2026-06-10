# Azure SQL Migration Guide

This guide provides step-by-step instructions for migrating the Newsletter Portal from local SQLite to Azure SQL Server.

## Pre-Migration Checklist

- [ ] Azure subscription active
- [ ] Azure SQL Server created
- [ ] Database created in Azure SQL
- [ ] Firewall rules configured
- [ ] Connection string obtained
- [ ] Backup of SQLite database
- [ ] All tests passing on SQLite

## Step 1: Create Azure SQL Resources

### Option A: Using Azure Portal

1. Go to Azure Portal (portal.azure.com)
2. Create new Azure SQL Database
   - Server: Create new or use existing
   - Database name: `newsletter_portal`
   - Compute + storage: Standard tier (suitable for small deployments)
3. Configure firewall rules
   - Allow connections from your IP
   - Or use VNet integration for secure connection
4. Get connection string from connection strings panel

### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name newsletter-rg --location eastus

# Create SQL Server
az sql server create \
  --name newsletter-server \
  --resource-group newsletter-rg \
  --admin-user sqladmin \
  --admin-password YourSecurePassword123!

# Create database
az sql db create \
  --resource-group newsletter-rg \
  --server newsletter-server \
  --name newsletter_portal \
  --edition Standard

# Get connection string
az sql db show-connection-string \
  --server newsletter-server \
  --name newsletter_portal \
  --client pyodbc
```

## Step 2: Configure Local Environment

### Install ODBC Driver

**Windows:**
```bash
# Download and install ODBC Driver 17 for SQL Server
# https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
```

**macOS:**
```bash
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew install mssql-tools17
```

**Linux (Ubuntu):**
```bash
curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list > /etc/apt/sources.list.d/mssql-release.list
apt-get update
apt-get install mssql-tools17
```

### Update Backend Dependencies

```bash
cd backend

# Add pyodbc to requirements.txt
echo "pyodbc==4.0.39" >> requirements.txt

# Reinstall dependencies
pip install -r requirements.txt
```

## Step 3: Update Environment Configuration

### Update `.env` File

```bash
# Before (SQLite):
DATABASE_URL=sqlite:///./newsletter.db

# After (Azure SQL):
DATABASE_URL=mssql+pyodbc://sqladmin:password@servername.database.windows.net:1433/newsletter_portal?driver=ODBC+Driver+17+for+SQL+Server
```

### Connection String Format

```
mssql+pyodbc://username:password@server.database.windows.net:1433/database_name?driver=ODBC+Driver+17+for+SQL+Server
```

**Components:**
- `username`: Azure SQL admin user
- `password`: Admin password
- `server`: Your Azure SQL Server hostname (e.g., `newsletter-server.database.windows.net`)
- `database_name`: Database name (e.g., `newsletter_portal`)

## Step 4: Test Connection

### Test Connection String

```python
from sqlalchemy import create_engine
import os

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

# Test connection
with engine.connect() as conn:
    result = conn.execute("SELECT 1")
    print("✓ Connection successful")
```

### Run Connection Test Script

```bash
python -c "
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    result = conn.execute('SELECT 1')
    print('✓ Connection successful')
"
```

## Step 5: Migrate Database Schema

### Automatic Migration

The database schema will be created automatically on first start:

```bash
# Start backend with Azure SQL
python -m uvicorn app.main:app --reload

# The backend will:
# 1. Create all tables
# 2. Seed default categories (HAE, NS, CMD)
# 3. Create default admin user
```

### Manual Migration

```python
from app.init_db import init_database
from app.database import engine

init_database()
print("✓ Schema created in Azure SQL")
```

## Step 6: Migrate Data (if needed)

### Option A: Export from SQLite, Import to Azure SQL

```python
"""
Export data from SQLite and import to Azure SQL
"""
import sqlite3
from app.database import SessionLocal
from app.models import User, Subscriber, Category, Newsletter

# 1. Connect to SQLite
sqlite_conn = sqlite3.connect('./newsletter.db')
sqlite_cursor = sqlite_conn.cursor()

# 2. Query data from SQLite
categories = sqlite_cursor.execute("SELECT * FROM categories").fetchall()

# 3. Connect to Azure SQL
db = SessionLocal()

# 4. Insert data
for cat_data in categories:
    # Map and insert
    pass

db.close()
sqlite_conn.close()
```

### Option B: Backup and Restore

For production data, use Azure SQL backup and restore:

```bash
# Create backup of production SQLite
sqlite3 ./newsletter.db ".backup backup.db"

# Transfer to cloud storage
az storage blob upload --file backup.db

# For large migrations, contact Azure support
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
    \"email\": \"curator@company.com\",
    \"password\": \"securepassword123\"
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
  DATABASE_URL: ${{ secrets.AZURE_SQL_CONNECTION_STRING }}
```

### Secrets Management

```bash
# Store connection string in Key Vault
az keyvault secret set \
  --vault-name newsletter-vault \
  --name database-url \
  --value "mssql+pyodoc://..."

# Reference in App Service
az webapp config appsettings set \
  --resource-group newsletter-rg \
  --name newsletter-api \
  --settings DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://...)"
```

## Step 9: Performance Optimization

### Create Indexes (Optional)

Azure SQL will automatically create clustered indexes on primary keys. For best performance:

```sql
-- Already in models, but verify in Azure
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_subscriber_email ON subscribers(email);
CREATE INDEX idx_subscriber_token ON subscribers(subscription_token);
CREATE INDEX idx_newsletter_status ON newsletters(status);
CREATE INDEX idx_send_history_status ON send_history(status);
```

### Enable Query Insights

```bash
az sql server query-insights-help update \
  --resource-group newsletter-rg \
  --server newsletter-server
```

## Rollback Plan

### If Migration Fails

1. **Keep SQLite running** - Don't delete `newsletter.db`
2. **Revert environment** - Change `DATABASE_URL` back to SQLite
3. **Restart backend** - Backend will reconnect to SQLite
4. **Debug issue** - Check connection string, firewall rules, etc.
5. **Retry migration** - After fixes

### Keep Both Running (A/B Testing)

```bash
# Run with SQLite
DATABASE_URL=sqlite:///./newsletter.db python -m uvicorn app.main:app --port 8000

# In another terminal, run with Azure SQL
DATABASE_URL=mssql+pyodoc://... python -m uvicorn app.main:app --port 8001

# Compare behavior, then switch
```

## Common Issues and Solutions

### Connection Timeout

**Error**: "timeout: Can't connect to server"

**Solution**:
```bash
# Check firewall rules in Azure Portal
# Add your IP address to allowed IPs
# Or use VNet integration

# In .env, add timeout:
DATABASE_URL=mssql+pyodbc://...?timeout=30
```

### Authentication Failed

**Error**: "Login failed for user 'sqladmin'"

**Solution**:
```bash
# Verify credentials
# Check SQL Server has IP whitelisted
# Verify ODBC Driver installed: odbcinst -j
```

### Table Not Found

**Error**: "Invalid object name 'users'"

**Solution**:
```bash
# Run init_database manually
python -c "from app.init_db import init_database; init_database()"

# Or restart backend
```

### Driver Not Found

**Error**: "ODBC Driver 17 for SQL Server not found"

**Solution**:
```bash
# Reinstall ODBC driver
# Linux: apt-get remove mssql-tools17 && apt-get install mssql-tools17
# macOS: brew uninstall mssql-tools17 && brew install mssql-tools17
# Windows: Uninstall from Control Panel and reinstall

# Verify installation
odbcinst -j  # Should show driver path
```

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
- [ ] Backups configured
- [ ] Monitoring alerts enabled

## Azure SQL Best Practices

### 1. Scaling

```bash
# Monitor CPU/Memory usage in Azure Portal
# Scale up if needed (more compute)
az sql db update \
  --resource-group newsletter-rg \
  --server newsletter-server \
  --name newsletter_portal \
  --edition Premium \
  --capacity 4
```

### 2. Backup and Restore

```bash
# Automatic backups are enabled
# View backup retention
az sql db short-term-retention-policy show \
  --resource-group newsletter-rg \
  --server newsletter-server \
  --database newsletter_portal

# Create manual backup
az sql db copy \
  --resource-group newsletter-rg \
  --server newsletter-server \
  --name newsletter_portal \
  --dest-server newsletter-server-backup \
  --dest-name newsletter_portal_backup
```

### 3. Monitoring

```bash
# View query performance
az sql db query-insights \
  --resource-group newsletter-rg \
  --server newsletter-server \
  --name newsletter_portal
```

### 4. Security

```bash
# Enable Azure AD authentication
az sql server ad-admin create \
  --resource-group newsletter-rg \
  --server-name newsletter-server \
  --display-name "Admin Group"

# Enable threat detection
az sql server threat-detection update \
  --resource-group newsletter-rg \
  --name newsletter-server \
  --state On
```

## Cost Optimization

### Tier Recommendations

- **Development**: Basic tier (~$5/month)
- **Production Low Load**: Standard S0 (~$15/month)
- **Production High Load**: Standard S1+ or Premium (~$100+/month)

### Reduce Costs

```bash
# Pause database when not in use
az sql db pause \
  --resource-group newsletter-rg \
  --server newsletter-server \
  --name newsletter_portal

# Resume when needed
az sql db resume \
  --resource-group newsletter-rg \
  --server newsletter-server \
  --name newsletter_portal
```

## Support and Resources

- [Azure SQL Documentation](https://learn.microsoft.com/en-us/azure/azure-sql/)
- [SQLAlchemy Azure Support](https://github.com/mkleehammer/pyodbc)
- [ODBC Driver Documentation](https://learn.microsoft.com/en-us/sql/connect/odbc/)
- [Azure SQL Connection Strings](https://learn.microsoft.com/en-us/azure/azure-sql/database/connection-strings-auth)

## Summary

Migration to Azure SQL is straightforward:
1. ✓ Install ODBC driver
2. ✓ Create Azure SQL resources
3. ✓ Update `DATABASE_URL` in `.env`
4. ✓ Restart backend (schema created automatically)
5. ✓ No code changes required

The entire process takes approximately 30 minutes and requires no application code modifications.
