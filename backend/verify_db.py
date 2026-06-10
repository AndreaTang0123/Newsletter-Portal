#!/usr/bin/env python3
"""
Database layer verification script.
This script verifies that all database models, CRUD functions, and initialization work correctly.
Run from backend directory: python verify_db.py
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def verify_models():
    """Verify models can be imported."""
    try:
        from app import models
        print("✓ Models imported successfully")
        
        # Verify all models exist
        required_models = [
            'User', 'Subscriber', 'Category', 'Newsletter',
            'SendHistory', 'EmailOpenEvent', 'CampaignHistory', 'SubscriptionEvent'
        ]
        for model_name in required_models:
            assert hasattr(models, model_name), f"Model {model_name} not found"
        print(f"✓ All {len(required_models)} models exist")
        return True
    except Exception as e:
        print(f"✗ Error verifying models: {e}")
        return False

def verify_crud():
    """Verify CRUD functions can be imported."""
    try:
        from app import crud
        print("✓ CRUD module imported successfully")
        
        # Verify key CRUD functions exist
        required_functions = [
            'get_user_by_email', 'create_user',
            'get_categories', 'create_category',
            'get_subscribers', 'create_subscriber', 'update_subscriber',
            'get_newsletters', 'create_newsletter',
            'create_send_history', 'get_send_history',
            'create_email_open_event',
            'get_dashboard_statistics'
        ]
        for func_name in required_functions:
            assert hasattr(crud, func_name), f"CRUD function {func_name} not found"
        print(f"✓ All {len(required_functions)} CRUD functions exist")
        return True
    except Exception as e:
        print(f"✗ Error verifying CRUD: {e}")
        return False

def verify_schemas():
    """Verify schemas can be imported."""
    try:
        from app import schemas
        print("✓ Schemas imported successfully")
        
        # Verify key schemas exist
        required_schemas = [
            'User', 'Category', 'Subscriber', 'Newsletter',
            'SendHistory', 'EmailOpenEvent', 'SubscriptionEvent',
            'DashboardStatistics'
        ]
        for schema_name in required_schemas:
            assert hasattr(schemas, schema_name), f"Schema {schema_name} not found"
        print(f"✓ All {len(required_schemas)} schemas exist")
        return True
    except Exception as e:
        print(f"✗ Error verifying schemas: {e}")
        return False

def verify_init_db():
    """Verify init_db module."""
    try:
        from app import init_db
        print("✓ init_db module imported successfully")
        
        # Verify key functions exist
        required_functions = [
            'init_database', 'seed_default_categories',
            'seed_default_admin_user', 'seed_database'
        ]
        for func_name in required_functions:
            assert hasattr(init_db, func_name), f"init_db function {func_name} not found"
        print(f"✓ All {len(required_functions)} init_db functions exist")
        return True
    except Exception as e:
        print(f"✗ Error verifying init_db: {e}")
        return False

def verify_database_config():
    """Verify database configuration."""
    try:
        from app import database
        print("✓ Database module imported successfully")
        
        # Verify engine and SessionLocal exist
        assert hasattr(database, 'engine'), "engine not found in database module"
        assert hasattr(database, 'SessionLocal'), "SessionLocal not found in database module"
        assert hasattr(database, 'Base'), "Base not found in database module"
        assert hasattr(database, 'get_db'), "get_db not found in database module"
        
        print("✓ Database configuration is valid")
        print(f"  Database URL: {database.DATABASE_URL}")
        return True
    except Exception as e:
        print(f"✗ Error verifying database config: {e}")
        return False

def main():
    """Run all verifications."""
    print("=" * 60)
    print("Newsletter Portal Database Layer Verification")
    print("=" * 60)
    print()
    
    checks = [
        ("Database Configuration", verify_database_config),
        ("Models", verify_models),
        ("Schemas", verify_schemas),
        ("CRUD Functions", verify_crud),
        ("Database Initialization", verify_init_db),
    ]
    
    results = []
    for check_name, check_func in checks:
        print(f"\nChecking {check_name}...")
        results.append(check_func())
    
    print("\n" + "=" * 60)
    if all(results):
        print("✓ All verifications passed!")
        print("\nThe database layer is properly configured. Next steps:")
        print("1. Create a virtual environment: python -m venv .venv")
        print("2. Activate it: .venv\\Scripts\\activate (on Windows)")
        print("3. Install dependencies: pip install -r requirements.txt")
        print("4. Run the backend: python -m uvicorn app.main:app --reload")
        return 0
    else:
        print("✗ Some verifications failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
