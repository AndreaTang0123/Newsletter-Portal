"""
Database initialization and seeding module for Newsletter Portal.
This module provides functions to initialize the database schema and seed
initial data (distribution lists and default admin user).

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


def seed_default_lists(db: Session):
    """
    Seed default lists if they don't exist.
    Idempotent - safe to call multiple times.
    
    Default lists matching the Pilot PRD:
    - Weekly Newsletter (Weekly CI Newsletter)
    - HAE (Hardware & Architecture Engineering curated alerts)
    - CMD (Communications & Marketing Digest curated alerts)
    - NS (Network & Systems curated alerts)
    """
    default_lists = [
        {
            "name": "Weekly Newsletter", 
            "description": "Weekly CI Newsletter distribution list", 
            "owner": "Alex Sherman", 
            "category": "Weekly"
        },
        {
            "name": "HAE", 
            "description": "HAE curated alerts distribution list", 
            "owner": "Alex Sherman", 
            "category": "HAE"
        },
        {
            "name": "CMD", 
            "description": "CMD curated alerts distribution list", 
            "owner": "Warren", 
            "category": "CMD"
        },
        {
            "name": "NS", 
            "description": "NS curated alerts distribution list", 
            "owner": "Warren", 
            "category": "NS"
        },
    ]
    
    for lst_data in default_lists:
        existing = db.query(models.List).filter(
            models.List.name == lst_data["name"]
        ).first()
        
        if not existing:
            lst = models.List(
                name=lst_data["name"],
                description=lst_data["description"],
                owner=lst_data["owner"],
                category=lst_data["category"]
            )
            db.add(lst)
    
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
    2. Seeds default lists (Weekly, HAE, CMD, NS)
    3. Seeds default admin user
    """
    init_database()
    
    db = SessionLocal()
    try:
        seed_default_lists(db)
        seed_default_admin_user(db)
    finally:
        db.close()
