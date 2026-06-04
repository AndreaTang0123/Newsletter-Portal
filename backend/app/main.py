from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .routers import newsletters, subscribers, categories, ai, email
from . import models, crud, schemas

# Initialize database schemas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Newsletter Portal API",
    description="AI-powered system for managing subscription lists, newsletter categories, and draft generations.",
    version="1.0.0"
)

# Enable CORS for Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(newsletters.router, prefix="/api/v1")
app.include_router(subscribers.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(email.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Newsletter Portal API is running."}

# Auto-seed initial configurations on startup
@app.on_event("startup")
def seed_database():
    db = SessionLocal()
    try:
        # Seed Categories if not exist
        existing_cats = crud.get_categories(db)
        if not existing_cats:
            initial_categories = [
                schemas.CategoryCreate(name="Engineering Updates", description="Technical updates and framework migrations"),
                schemas.CategoryCreate(name="HR Announcements", description="Internal news, health plans, and policies"),
                schemas.CategoryCreate(name="Marketing & Events", description="Product releases and company events"),
            ]
            for cat in initial_categories:
                crud.create_category(db, cat)
            print("Successfully seeded initial Categories.")

        # Seed default curator User if not exists
        curator = crud.get_user_by_email(db, "curator@company.com")
        if not curator:
            default_user = schemas.UserCreate(
                email="curator@company.com",
                full_name="Andrea Tang",
                password="securepassword123",
                role="admin"
            )
            crud.create_user(db, default_user)
            print("Successfully seeded default Admin User (curator@company.com / securepassword123).")
            
    finally:
        db.close()
