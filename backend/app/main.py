import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import Employee
from app.schemas import HealthResponse
from app.routers.employees import router as employees_router

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(Employee).count() == 0:
            demo_employees = [
                Employee(
                    first_name="Sarah",
                    last_name="Connor",
                    email="sarah.connor@cyberdyne.io",
                    department="Engineering",
                    role="Principal Cloud Architect",
                    salary=165000.0,
                    status="Active",
                    photo_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=faces"
                ),
                Employee(
                    first_name="Marcus",
                    last_name="Vance",
                    email="marcus.vance@techcorp.com",
                    department="DevOps",
                    role="Senior Infrastructure Engineer",
                    salary=145000.0,
                    status="Active",
                    photo_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces"
                ),
                Employee(
                    first_name="Elena",
                    last_name="Rostova",
                    email="elena.rostova@designlab.org",
                    department="Product & Design",
                    role="Lead UX Designer",
                    salary=135000.0,
                    status="Active",
                    photo_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=faces"
                ),
                Employee(
                    first_name="David",
                    last_name="Kim",
                    email="david.kim@financehub.com",
                    department="Finance",
                    role="Financial Controller",
                    salary=128000.0,
                    status="On Leave",
                    photo_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces"
                ),
                Employee(
                    first_name="Aisha",
                    last_name="Patel",
                    email="aisha.patel@security.net",
                    department="Security & Compliance",
                    role="Application Security Lead",
                    salary=155000.0,
                    status="Active",
                    photo_url="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop&crop=faces"
                )
            ]
            db.add_all(demo_employees)
            db.commit()
    except Exception as e:
        print(f"Error seeding initial data: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_initial_data()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Production-Grade Employee Management REST API with S3 Photo Storage and SQS Async Queuing",
    lifespan=lifespan
)

# Configure CORS for Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount static files route
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# Include Router
app.include_router(employees_router)

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Application health check endpoint per business requirements."""
    db_status = "healthy"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    sqs_status = "disabled"
    if settings.SQS_QUEUE_URL:
        sqs_status = "connected"

    return HealthResponse(
        status="healthy" if db_status == "healthy" else "degraded",
        version="1.0.0",
        database=db_status,
        storage_mode=settings.STORAGE_MODE,
        sqs_status=sqs_status
    )
