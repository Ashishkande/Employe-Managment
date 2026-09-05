from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee
from app.schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse, PhotoUploadResponse
from app.services.storage import storage_service
from app.services.async_tasks import async_task_service, ASYNC_TASK_LOGS

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("", response_model=List[EmployeeResponse])
def list_employees(
    search: Optional[str] = Query(None, description="Search by name or email"),
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by employment status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Employee)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Employee.first_name.ilike(search_pattern)) |
            (Employee.last_name.ilike(search_pattern)) |
            (Employee.email.ilike(search_pattern))
        )
    
    if department:
        query = query.filter(Employee.department == department)
        
    if status:
        query = query.filter(Employee.status == status)

    return query.order_by(Employee.id.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_in: EmployeeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    existing = db.query(Employee).filter(Employee.email == employee_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An employee with email '{employee_in.email}' already exists."
        )

    db_employee = Employee(**employee_in.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)

    # Queue background audit log event
    background_tasks.add_task(
        async_task_service.dispatch_employee_audit,
        action="CREATE",
        employee_id=db_employee.id,
        email=db_employee.email
    )

    return db_employee

@router.get("/{id}", response_model=EmployeeResponse)
def get_employee(id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found."
        )
    return employee

@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(
    id: int,
    employee_in: EmployeeUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found."
        )

    update_data = employee_in.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] != employee.email:
        existing = db.query(Employee).filter(Employee.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{update_data['email']}' is already used by another employee."
            )

    for field, value in update_data.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)

    background_tasks.add_task(
        async_task_service.dispatch_employee_audit,
        action="UPDATE",
        employee_id=employee.id,
        email=employee.email
    )

    return employee

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found."
        )

    emp_id = employee.id
    emp_email = employee.email

    db.delete(employee)
    db.commit()

    background_tasks.add_task(
        async_task_service.dispatch_employee_audit,
        action="DELETE",
        employee_id=emp_id,
        email=emp_email
    )
    return None

@router.post("/{id}/photo", response_model=PhotoUploadResponse)
async def upload_employee_photo(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found."
        )

    # Save to S3 or local storage
    photo_url = await storage_service.upload_photo(file, employee_id=id)

    # Update employee record
    employee.photo_url = photo_url
    db.commit()

    # Trigger asynchronous processing (e.g. SQS queue or background worker)
    task_id = async_task_service.dispatch_photo_processing(
        employee_id=id,
        photo_url=photo_url
    )

    return PhotoUploadResponse(
        message="Employee photo uploaded and dispatched for asynchronous thumbnail processing.",
        photo_url=photo_url,
        employee_id=id,
        task_id=task_id
    )

@router.get("/async-tasks/logs")
def get_async_task_logs():
    return {"tasks": ASYNC_TASK_LOGS}
