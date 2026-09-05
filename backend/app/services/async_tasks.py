import json
import logging
import uuid
from datetime import datetime, timezone
from app.config import settings

logger = logging.getLogger("async_tasks")

# In-memory log of recent background events for UI tracking
ASYNC_TASK_LOGS = []

def record_task_log(event_type: str, details: dict):
    entry = {
        "task_id": f"task-{uuid.uuid4().hex[:8]}",
        "event_type": event_type,
        "details": details,
        "status": "COMPLETED",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    ASYNC_TASK_LOGS.insert(0, entry)
    if len(ASYNC_TASK_LOGS) > 50:
        ASYNC_TASK_LOGS.pop()
    return entry["task_id"]

class AsyncTaskService:
    def __init__(self):
        self.sqs_url = settings.SQS_QUEUE_URL
        self.sqs_client = None
        if self.sqs_url and settings.AWS_ACCESS_KEY_ID != "mock_key":
            import boto3
            session_kwargs = {"region_name": settings.AWS_REGION}
            if settings.AWS_ACCESS_KEY_ID:
                session_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                session_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
            self.sqs_client = boto3.client("sqs", **session_kwargs)

    def dispatch_photo_processing(self, employee_id: int, photo_url: str) -> str:
        payload = {
            "action": "PROCESS_EMPLOYEE_PHOTO",
            "employee_id": employee_id,
            "photo_url": photo_url,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        task_id = record_task_log("PHOTO_OPTIMIZATION", payload)
        
        if self.sqs_client and self.sqs_url:
            try:
                self.sqs_client.send_message(
                    QueueUrl=self.sqs_url,
                    MessageBody=json.dumps(payload)
                )
                logger.info(f"Dispatched message to SQS for employee {employee_id}")
            except Exception as e:
                logger.warning(f"Failed to dispatch to AWS SQS, processed locally: {e}")
        
        return task_id

    def dispatch_employee_audit(self, action: str, employee_id: int, email: str) -> str:
        payload = {
            "action": action,
            "employee_id": employee_id,
            "email": email,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return record_task_log(f"AUDIT_{action}", payload)

async_task_service = AsyncTaskService()
