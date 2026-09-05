import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_employees.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "version" in data

def test_crud_employee():
    # 1. Create Employee
    new_emp = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test.user@example.com",
        "department": "Engineering",
        "role": "QA Engineer",
        "salary": 90000.0,
        "status": "Active"
    }
    create_res = client.post("/employees", json=new_emp)
    assert create_res.status_code == 201
    created_data = create_res.json()
    emp_id = created_data["id"]
    assert created_data["first_name"] == "Test"
    assert created_data["email"] == "test.user@example.com"

    # 2. Get Employee
    get_res = client.get(f"/employees/{emp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == emp_id

    # 3. Update Employee
    update_res = client.put(f"/employees/{emp_id}", json={"salary": 95000.0, "status": "On Leave"})
    assert update_res.status_code == 200
    assert update_res.json()["salary"] == 95000.0
    assert update_res.json()["status"] == "On Leave"

    # 4. List Employees
    list_res = client.get("/employees")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 5. Delete Employee
    del_res = client.delete(f"/employees/{emp_id}")
    assert del_res.status_code == 204

    # 6. Verify Deleted
    get_deleted = client.get(f"/employees/{emp_id}")
    assert get_deleted.status_code == 404
