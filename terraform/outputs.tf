output "alb_dns_name" {
  description = "Public DNS address of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "Private Endpoint of the Amazon RDS PostgreSQL instance"
  value       = aws_db_instance.postgres.endpoint
}

output "s3_bucket_name" {
  description = "Name of the Amazon S3 Bucket for Employee Photos"
  value       = aws_s3_bucket.photos.id
}

output "sqs_queue_url" {
  description = "URL of the Amazon SQS Queue for Asynchronous Processing"
  value       = aws_sqs_queue.photo_tasks.url
}

output "secrets_manager_arn" {
  description = "ARN of the AWS Secrets Manager Secret containing DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}
