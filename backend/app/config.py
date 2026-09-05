import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Employee Management API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database Settings (PostgreSQL default)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/employeedb"
    )
    
    # AWS & Storage Settings
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "mock_key")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "mock_secret")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "employee-photos-bucket")
    S3_ENDPOINT_URL: str | None = os.getenv("S3_ENDPOINT_URL", None)  # For LocalStack testing
    
    # Storage Mode: 's3' or 'local'
    STORAGE_MODE: str = os.getenv("STORAGE_MODE", "local")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    
    # SQS Settings
    SQS_QUEUE_URL: str | None = os.getenv("SQS_QUEUE_URL", None)
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
