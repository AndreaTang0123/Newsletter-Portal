"""
Database initialization and seeding module for Newsletter Portal.
This module provides functions to initialize the database schema and seed
initial data (categories and default admin user).

Designed for Azure SQL compatibility - uses only standard SQLAlchemy ORM.
"""

from sqlalchemy.orm import Session
from . import models, schemas, crud, auth
from .database import engine, Base, SessionLocal


def init_database():
    """
    Initialize database tables.
    Creates all tables defined in SQLAlchemy models if they don't exist.
    Safe to call multiple times - idempotent.
    """
    Base.metadata.create_all(bind=engine)


def seed_default_categories(db: Session):
    """
    Seed default categories if they don't exist.
    Idempotent - safe to call multiple times.
    
    Default categories:
    - HAE: Hardware & Architecture Engineering
    - NS: Network & Systems
    - CMD: Communications & Marketing Digest
    """
    default_categories = [
        {"name": "HAE", "description": "Hardware & Architecture Engineering"},
        {"name": "NS", "description": "Network & Systems"},
        {"name": "CMD", "description": "Communications & Marketing Digest"},
    ]
    
    for cat_data in default_categories:
        existing = db.query(models.Category).filter(
            models.Category.name == cat_data["name"]
        ).first()
        
        if not existing:
            category = models.Category(
                name=cat_data["name"],
                description=cat_data["description"]
            )
            db.add(category)
    
    db.commit()


def seed_default_admin_user(db: Session):
    """
    Seed default admin user for local development if not exists.
    Idempotent - safe to call multiple times.
    
    Default credentials:
    - Email: curator@company.com
    - Password: securepassword123
    - Role: admin
    """
    admin_email = "curator@company.com"
    
    existing_user = db.query(models.User).filter(
        models.User.email == admin_email
    ).first()
    
    if not existing_user:
        admin_user = models.User(
            email=admin_email,
            full_name="Andrea Tang",
            hashed_password=auth.get_password_hash("securepassword123"),
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        return admin_user
    
    return existing_user


def seed_database():
    """
    Initialize and seed the database with all default data.
    Idempotent - safe to call multiple times.
    
    This function:
    1. Creates all tables
    2. Seeds default categories (HAE, NS, CMD)
    3. Seeds default admin user
    """
    init_database()
    
    db = SessionLocal()
    try:
        seed_default_categories(db)
        seed_default_admin_user(db)
    finally:
        db.close()
