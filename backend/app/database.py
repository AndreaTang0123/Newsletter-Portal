import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# DATABASE_URL Configuration
# For local SQLite development:
#   DATABASE_URL=sqlite:///./newsletter.db
#
# For Azure SQL production (future migration):
#   DATABASE_URL=mssql+pyodbc://user:password@server.database.windows.net:1433/database_name?driver=ODBC+Driver+17+for+SQL+Server
#
# No code changes required for migration - just update this environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./newsletter.db")

# SQLAlchemy Engine Configuration
# Handles both SQLite and Azure SQL connection strings automatically
# SQLite requires special connection settings for compatibility
if DATABASE_URL.startswith("sqlite"):
    # SQLite-specific settings (thread safety)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # SQL Server / Azure SQL uses standard pooling
    # Future: Add connection pooling settings if needed
    engine = create_engine(DATABASE_URL)

# Session Factory
# Creates ORM sessions for database operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base
# All models inherit from this to enable ORM functionality
Base = declarative_base()


def get_db():
    """
    Database session dependency for FastAPI.
    Provides a session for each request and ensures proper cleanup.
    
    Usage:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return crud.get_items(db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

