# Quick Start Guide - Newsletter Portal Backend

## Python Setup (Windows)

Python is invoked using `py` on Windows (not `python`).

### 1. Create Virtual Environment

```bash
cd backend
py -m venv .venv
.venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Verify Database Layer

```bash
py verify_db.py
```

Expected output:
```
✓ Database Configuration
✓ Models  
✓ Schemas
✓ CRUD Functions
✓ Database Initialization
✓ All verifications passed!
```

### 4. Run Backend Server

```bash
py -m uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

### 5. Test Login

Use the default credentials:
- **Email**: curator@company.com
- **Password**: securepassword123

## What Was Implemented

✅ Complete SQLite database layer
✅ 8 main tables with proper relationships
✅ 50+ CRUD functions
✅ 20+ API endpoints
✅ Automatic database initialization
✅ Default categories seeded (HAE, NS, CMD)
✅ Default admin user created
✅ Full Azure SQL compatibility
✅ Comprehensive documentation

## File Structure

```
backend/
├── app/
│   ├── models.py          # SQLAlchemy models (enhanced)
│   ├── crud.py            # Database operations (50+ functions)
│   ├── schemas.py         # Pydantic schemas (enhanced)
│   ├── init_db.py         # Database initialization ✓ NEW
│   ├── database.py        # SQLAlchemy setup (with Azure notes)
│   ├── main.py            # FastAPI app
│   └── routers/           # API endpoints
├── verify_db.py           # Verification script ✓ NEW
├── DATABASE_LAYER.md      # Full documentation ✓ NEW
├── AZURE_SQL_MIGRATION.md # Migration guide ✓ NEW
├── .env.example           # Environment template
├── requirements.txt       # Dependencies
└── README.md              # Original setup
```

## Key Commands

```bash
# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify setup
py verify_db.py

# Run backend (development)
py -m uvicorn app.main:app --reload

# Run backend (production)
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Deactivate virtual environment
deactivate
```

## Database

- **Type**: SQLite (local development)
- **File**: `backend/newsletter.db` (created automatically)
- **Auto-created**: Tables created on first startup
- **Default data**: Categories and admin user seeded
- **Migration**: Can migrate to Azure SQL anytime (just update DATABASE_URL)

## Testing API

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "curator@company.com",
    "password": "securepassword123"
  }'
```

### Get Categories
```bash
curl http://localhost:8000/api/v1/categories
```

### Get Subscribers (requires auth)
```bash
curl http://localhost:8000/api/v1/subscribers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Module not found errors
```bash
# Ensure virtual environment is activated
.venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Database issues
```bash
# Re-initialize database
py -c "from app.init_db import seed_database; seed_database()"
```

### Port 8000 already in use
```bash
# Use different port
py -m uvicorn app.main:app --reload --port 8001
```

## Next Steps

1. **Frontend setup** - Navigate to `frontend/` directory
2. **Review documentation** - Read `DATABASE_LAYER.md`
3. **Deploy** - Follow `AZURE_SQL_MIGRATION.md` for cloud setup

## Support

For detailed documentation:
- Database architecture: `DATABASE_LAYER.md`
- Azure SQL migration: `AZURE_SQL_MIGRATION.md`
- API reference: http://localhost:8000/docs (when running)

---

**Everything is ready!** The database layer is fully implemented and ready for use.
