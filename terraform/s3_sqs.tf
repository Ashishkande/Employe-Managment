# 1. Amazon S3 Bucket for Employee Photos
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "photos" {
  bucket        = "employee-photos-${random_id.bucket_suffix.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "photos" {
  bucket = aws_s3_bucket.photos.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_cors_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "PUT"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# 2. Amazon SQS Dead Letter Queue (DLQ)
resource "aws_sqs_queue" "dlq" {
  name                      = "employee-photo-tasks-dlq"
  message_retention_seconds = 1209600 # 14 days
}

# 3. Amazon SQS Main Queue
resource "aws_sqs_queue" "photo_tasks" {
  name                      = "employee-photo-tasks"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 345600 # 4 days
  receive_wait_time_seconds = 10     # Long polling enabled

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}

# 4. IAM Policy for ECS Tasks to Access S3 and SQS
resource "aws_iam_policy" "ecs_s3_sqs_policy" {
  name        = "employee-api-s3-sqs-policy"
  description = "Grants ECS tasks permission to upload photos to S3 and dispatch events to SQS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.photos.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.photo_tasks.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_s3_sqs_attach" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_s3_sqs_policy.arn
}
