import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import settings

class StorageService:
    def __init__(self):
        self.mode = settings.STORAGE_MODE.lower()
        self.upload_dir = Path(settings.UPLOAD_DIR)
        
        if self.mode == "local":
            self.upload_dir.mkdir(parents=True, exist_ok=True)
        elif self.mode == "s3":
            import boto3
            session_kwargs = {
                "region_name": settings.AWS_REGION,
            }
            if settings.AWS_ACCESS_KEY_ID != "mock_key":
                session_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                session_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
            
            s3_kwargs = {}
            if settings.S3_ENDPOINT_URL:
                s3_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL

            self.s3_client = boto3.client("s3", **session_kwargs, **s3_kwargs)

    async def upload_photo(self, file: UploadFile, employee_id: int) -> str:
        # Validate content type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image (JPEG, PNG, WebP).")
        
        extension = Path(file.filename).suffix or ".jpg"
        unique_name = f"emp_{employee_id}_{uuid.uuid4().hex[:8]}{extension}"

        if self.mode == "local" or settings.AWS_ACCESS_KEY_ID == "mock_key":
            # Save to local file system
            local_path = self.upload_dir / unique_name
            content = await file.read()
            with open(local_path, "wb") as f:
                f.write(content)
            # URL accessible via FastAPI static files route /uploads/{filename}
            return f"/uploads/{unique_name}"
        else:
            # Upload to AWS S3 Bucket
            content = await file.read()
            s3_key = f"employees/photos/{unique_name}"
            try:
                self.s3_client.put_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=s3_key,
                    Body=content,
                    ContentType=file.content_type
                )
                if settings.S3_ENDPOINT_URL:
                    return f"{settings.S3_ENDPOINT_URL}/{settings.S3_BUCKET_NAME}/{s3_key}"
                return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
            except Exception as e:
                # Fall back to local if S3 fails in dev environment
                local_path = self.upload_dir / unique_name
                with open(local_path, "wb") as f:
                    f.write(content)
                return f"/uploads/{unique_name}"

storage_service = StorageService()
