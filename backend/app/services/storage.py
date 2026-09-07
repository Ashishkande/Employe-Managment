import os
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException

from app.config import settings


class StorageService:
    def __init__(self):
        self.mode = settings.STORAGE_MODE.lower()
        self.upload_dir = Path(settings.UPLOAD_DIR)

        # Local storage setup
        if self.mode == "local":
            self.upload_dir.mkdir(parents=True, exist_ok=True)

        # S3 storage setup
        elif self.mode == "s3":
            import boto3

            session_kwargs = {
                "region_name": settings.AWS_REGION,
            }

            # Use explicit credentials only if they are configured
            # Otherwise boto3 automatically uses the EC2 IAM role.
            if (
                settings.AWS_ACCESS_KEY_ID
                and settings.AWS_ACCESS_KEY_ID != "mock_key"
                and settings.AWS_SECRET_ACCESS_KEY
            ):
                session_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                session_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

            s3_kwargs = {}

            # Optional custom endpoint.
            # For AWS S3 this should normally be:
            # https://s3.ap-south-1.amazonaws.com
            if settings.S3_ENDPOINT_URL:
                s3_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL

            self.s3_client = boto3.client(
                "s3",
                **session_kwargs,
                **s3_kwargs
            )

    async def upload_photo(self, file: UploadFile, employee_id: int) -> str:
        """
        Upload employee photo.

        Returns:
            - Local mode: /uploads/<filename>
            - S3 mode: S3 object key, e.g.
              employees/photos/emp_1_abc12345.jpg
        """

        # Validate content type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Uploaded file must be an image (JPEG, PNG, WebP)."
            )

        extension = Path(file.filename).suffix.lower() or ".jpg"

        unique_name = (
            f"emp_{employee_id}_{uuid.uuid4().hex[:8]}{extension}"
        )

        # ---------------------------------------------------------
        # LOCAL STORAGE
        # ---------------------------------------------------------
        if self.mode == "local" or settings.AWS_ACCESS_KEY_ID == "mock_key":
            local_path = self.upload_dir / unique_name

            content = await file.read()

            try:
                with open(local_path, "wb") as f:
                    f.write(content)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save photo locally: {str(e)}"
                )

            # URL accessible through FastAPI static files
            return f"/uploads/{unique_name}"

        # ---------------------------------------------------------
        # AWS S3 STORAGE
        # ---------------------------------------------------------
        content = await file.read()

        s3_key = f"employees/photos/{unique_name}"

        try:
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=s3_key,
                Body=content,
                ContentType=file.content_type
            )

            # IMPORTANT:
            # Do NOT return the S3 URL here.
            # Return only the object key.
            #
            # Example:
            # employees/photos/emp_1_cfc45974.jpg
            #
            # This key should be stored in the database.
            return s3_key

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload photo to S3: {str(e)}"
            )

    def generate_presigned_url(
        self,
        photo_key: str,
        expires_in: int = 3600
    ) -> str:
        """
        Generate a temporary URL for a private S3 object.

        Args:
            photo_key:
                S3 object key, e.g.
                employees/photos/emp_1_cfc45974.jpg

            expires_in:
                URL validity in seconds.
                Default = 1 hour.

        Returns:
            Presigned S3 URL.
        """

        if not photo_key:
            return None

        # ---------------------------------------------------------
        # LOCAL STORAGE
        # ---------------------------------------------------------
        if self.mode == "local" or settings.AWS_ACCESS_KEY_ID == "mock_key":
            return photo_key

        # ---------------------------------------------------------
        # S3 STORAGE
        # ---------------------------------------------------------
        try:
            presigned_url = self.s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": photo_key,
                },
                ExpiresIn=expires_in,
            )

            return presigned_url

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate photo URL: {str(e)}"
            )


storage_service = StorageService()
