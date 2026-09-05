# 1. ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "employee-api-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# 2. CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/employee-api"
  retention_in_days = 30
}

# 3. IAM Execution Role
resource "aws_iam_role" "ecs_execution_role" {
  name = "employee-api-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# 4. IAM Task Role (for S3 and SQS permissions)
resource "aws_iam_role" "ecs_task_role" {
  name = "employee-api-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# 5. Application Load Balancer (ALB)
resource "aws_lb" "main" {
  name               = "employee-api-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name = "employee-api-alb"
  }
}

# 6. Target Group with Health Check on GET /health
resource "aws_lb_target_group" "api" {
  name        = "employee-api-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    port                = "8000"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }
}

# 7. ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# 8. ECS Fargate Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "employee-api-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "fastapi-backend"
    image     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/employee-api:latest"
    essential = true
    portMappings = [{
      containerPort = 8000
      hostPort      = 8000
    }]
    environment = [
      { name = "ENVIRONMENT", value = "production" },
      { name = "STORAGE_MODE", value = "s3" },
      { name = "AWS_REGION", value = var.aws_region },
      { name = "S3_BUCKET_NAME", value = aws_s3_bucket.photos.id },
      { name = "SQS_QUEUE_URL", value = aws_sqs_queue.photo_tasks.url },
      { name = "DATABASE_URL", value = "postgresql://${aws_db_instance.postgres.username}:${aws_db_instance.postgres.password}@${aws_db_instance.endpoint}/${aws_db_instance.db_name}" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.ecs.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])
}

# 9. ECS Fargate Service
resource "aws_ecs_service" "app" {
  name            = "employee-api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.private_app_1.id, aws_subnet.private_app_2.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "fastapi-backend"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.http]
}
