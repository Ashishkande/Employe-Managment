from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, example="Jane")
    last_name: str = Field(..., min_length=1, max_length=100, example="Doe")
    email: EmailStr = Field(..., example="jane.doe@company.com")
    department: str = Field(..., example="Engineering")
    role: str = Field(..., example="Senior Software Engineer")
    salary: float = Field(..., ge=0.0, example=125000.0)
    status: str = Field(default="Active", example="Active")

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    department: str | None = None
    role: str | None = None
    salary: float | None = Field(None, ge=0.0)
    status: str | None = None

class EmployeeResponse(EmployeeBase):
    id: int
    photo_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    storage_mode: str
    sqs_status: str

class PhotoUploadResponse(BaseModel):
    message: str
    photo_url: str
    employee_id: int
    task_id: str | None = None
