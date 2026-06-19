from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .init_db import seed_database
from .routers import auth, lists, subscriptions, imports, subscribers, audit_logs, statistics, self_service

# Initialize database schemas and seed default data
seed_database()

app = FastAPI(
    title="Subscriber Management Portal API",
    description="Centralized subscriber & list management platform for SDIO.",
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
app.include_router(auth.router, prefix="/api/v1")
app.include_router(lists.router, prefix="/api/v1")
app.include_router(subscriptions.router, prefix="/api/v1")
app.include_router(imports.router, prefix="/api/v1")
@app.get("/")
def read_root():
    return {"message": "Subscriber Management Portal API is running."}

app.include_router(subscribers.router, prefix="/api/v1")
app.include_router(audit_logs.router, prefix="/api/v1")
app.include_router(statistics.router, prefix="/api/v1")
app.include_router(self_service.router, prefix="/api/v1")
