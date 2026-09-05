# Enterprise Employee Management System & AWS Cloud Architecture

Production-grade **Employee Management System** built with a **FastAPI** backend, **React + Tailwind CSS** frontend, **Amazon S3** object storage for photo uploads, **Amazon SQS** asynchronous event queues, **Amazon RDS PostgreSQL** database tier, and complete **Terraform Infrastructure as Code (IaC)**.

---

## 1. AWS Architecture & Traffic/Data Flow

```
[ Client Browser ]
        │
        ▼
[ Application Load Balancer (ALB) ] (Port 80/443, Public Subnets across 2 AZs)
        │
        ▼ (Target Group Health Check: GET /health)
┌─────────────────────────────────────────────────────────┐
│ Private App Subnets (10.0.10.0/24 & 10.0.11.0/24)       │
│ AWS ECS Fargate Tasks (FastAPI Backend, Port 8000)       │
└───────┬─────────────────┬──────────────────────┬────────┘
        │                 │                      │
   (SQL Queries)     (Photo Stream)       (Async Event Payload)
   Port 5432              │                      │
        ▼                 ▼                      ▼
┌────────────────┐ ┌──────────────┐    ┌─────────────────────┐
│ Private DB     │ │ Amazon S3    │    │ Amazon SQS Queue    │
│ Subnets        │ │ Bucket       │    │ (Async Background   │
│ Amazon RDS     │ │ (Photo       │    │ Task Processor)     │
│ PostgreSQL     │ │ Storage)     │    └─────────────────────┘
└────────────────┘ └──────────────┘
```

### AWS Service Justification Breakdown

| AWS Service | Category | Why It Is Required | Traffic & Data Flow |
| :--- | :--- | :--- | :--- |
| **Amazon VPC** | Networking | Isolates cloud resources into public and private subnets across 2 Availability Zones for high availability and zero-trust security. | Enforces strict subnet routing. Prevents public internet access to database and backend app containers. |
| **Application Load Balancer (ALB)** | Traffic Distribution | Distributes incoming HTTP/HTTPS traffic across ECS Fargate tasks in private subnets. Executes continuous health checks (`GET /health`). | Receives public user requests on port 80/443, evaluates target group rules, and forwards to healthy container IPs on port 8000. |
| **AWS ECS Fargate** | Serverless Compute | Runs containerized FastAPI backend applications without managing EC2 server instances. Auto-scales based on CPU/Memory metrics. | Receives requests from ALB, executes CRUD logic against RDS PostgreSQL, uploads photos to S3, and dispatches tasks to SQS. |
| **Amazon RDS PostgreSQL** | Relational DB | Managed PostgreSQL database in private DB subnets. Provides ACID transactions, automatic snapshots, and storage encryption. | Listens on port 5432. Strictly accepts connections originating from ECS Task Security Groups only. |
| **Amazon S3** | Object Storage | Scalable, highly durable storage for employee profile photos. Keeps app containers stateless. | Backend receives image files via multipart upload and streams to S3 bucket or presigned S3 URLs. |
| **Amazon SQS** | Async Queueing | Decouples heavy photo thumbnailing, audit logging, and email notification tasks from synchronous HTTP request loops. | FastAPI sends JSON messages (`PROCESS_EMPLOYEE_PHOTO`) to SQS upon photo upload; background tasks consume messages asynchronously. |
| **AWS Secrets Manager** | Security | Secures database passwords, TLS certificates, and API keys. Eliminates hardcoded credentials. | ECS containers fetch database credentials securely at launch via IAM Task Execution Role. |
| **Amazon CloudWatch** | Monitoring | Centralizes container metrics, database telemetry, ALB health logs, and application trace logs. | Collects stdout/stderr streams from ECS Fargate containers (`/ecs/employee-api`). |

---

## 2. API Operation Specification

The API implements all required corporate management endpoints:

| Method | Endpoint | Description | Query / Body Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Application health check endpoint | None | `{ "status": "healthy", "database": "healthy", ... }` |
| `GET` | `/employees` | List employees with filtering & search | `search`, `department`, `status`, `skip`, `limit` | `[ { "id": 1, "first_name": "Sarah", ... } ]` |
| `POST` | `/employees` | Create a new employee | `{ "first_name": "...", "email": "...", ... }` | `201 Created` with created employee record |
| `GET` | `/employees/{id}` | Retrieve single employee record | `id` (path) | Employee object or `404 Not Found` |
| `PUT` | `/employees/{id}` | Update existing employee record | `id` (path), `{ "salary": 120000, ... }` | Updated employee object |
| `DELETE` | `/employees/{id}` | Delete employee record | `id` (path) | `204 No Content` |
| `POST` | `/employees/{id}/photo` | Upload employee image/file to S3 | `file` (Multipart image form data) | `{ "message": "...", "photo_url": "...", "task_id": "..." }` |

---

## 3. Local Development Guide

You can run both backend and frontend locally in seconds!

### Step 1: Start FastAPI Backend
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Swagger Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Step 2: Start React + Tailwind Frontend
```bash
cd frontend
npm install
npm run dev
```
- Open browser at `http://localhost:3000`

### Step 3: Run Unit & Integration Test Suite
```bash
cd backend
python -m pytest
```

---

## 4. AWS Deployment via Terraform

Deploy the full AWS infrastructure (VPC, ALB, ECS Fargate, RDS PostgreSQL, S3, SQS):

```bash
cd terraform

# 1. Initialize Terraform provider modules
terraform init

# 2. Review execution plan
terraform plan

# 3. Apply infrastructure deployment
terraform apply -auto-approve
```

---

## 5. Troubleshooting Intentional Failures Guide

During deployment or operational testing, intentional failures can be introduced to verify system resiliency:

### Scenario A: S3 Photo Upload Returns 403 Forbidden / Access Denied
- **Root Cause**: ECS Task IAM Role is missing `s3:PutObject` permission or S3 Bucket Policy blocks unauthenticated uploads.
- **Diagnostic Command**:
  ```bash
  aws ecs describe-task-definition --task-definition employee-api-task
  ```
- **Fix**: Verify `terraform/s3_sqs.tf` has attached `aws_iam_policy.ecs_s3_sqs_policy` to `aws_iam_role.ecs_task_role`.

### Scenario B: Database Connection Timeout on `POST /employees`
- **Root Cause**: RDS PostgreSQL Security Group does not allow inbound traffic on port 5432 from ECS Tasks Security Group.
- **Diagnostic Tool**: Check `/ecs/employee-api` CloudWatch Logs for `OperationalError: could not connect to server: Connection timed out`.
- **Fix**: Verify `terraform/security.tf` has ingress rule on `aws_security_group.rds` with `security_groups = [aws_security_group.ecs_tasks.id]`.

### Scenario C: ALB Marks ECS Target Group Unhealthy
- **Root Cause**: Health check path misconfigured (e.g., set to `/` instead of `/health`) or container crashing on boot due to missing environment variables.
- **Diagnostic Tool**:
  ```bash
  aws elbv2 describe-target-health --target-group-arn <TARGET_GROUP_ARN>
  ```
- **Fix**: Ensure Target Group health check path is `/health` and returns HTTP status 200.
