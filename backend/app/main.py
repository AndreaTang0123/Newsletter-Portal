from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .init_db import seed_database
from .routers import newsletters, subscribers, categories, ai, email, auth, statistics
from . import models, crud, schemas

# Initialize database schemas and seed default data
seed_database()

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
app.include_router(auth.router, prefix="/api/v1")
app.include_router(statistics.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Newsletter Portal API is running."}
