# Security Group for Application Load Balancer
resource "aws_security_group" "alb" {
  name        = "employee-api-alb-sg"
  description = "Allows incoming HTTP/HTTPS traffic to ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP Public Access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Public Access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "employee-api-alb-sg"
  }
}

# Security Group for ECS Fargate Containers
resource "aws_security_group" "ecs_tasks" {
  name        = "employee-api-ecs-tasks-sg"
  description = "Allows inbound traffic to FastAPI container from ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "FastAPI HTTP from ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow outbound to internet and AWS services"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "employee-api-ecs-tasks-sg"
  }
}

# Security Group for Amazon RDS PostgreSQL
resource "aws_security_group" "rds" {
  name        = "employee-api-rds-sg"
  description = "Allows PostgreSQL access strictly from ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS Tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "Outbound rule for DB"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "employee-api-rds-sg"
  }
}
