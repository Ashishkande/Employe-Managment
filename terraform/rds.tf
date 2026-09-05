# DB Subnet Group across 2 Private DB Subnets
resource "aws_db_subnet_group" "main" {
  name       = "employee-api-db-subnet-group"
  subnet_ids = [aws_subnet.private_db_1.id, aws_subnet.private_db_2.id]

  tags = {
    Name = "employee-api-db-subnet-group"
  }
}

# Generate secure random password for PostgreSQL DB
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()_=+[]{}|:?"
}

# AWS Secrets Manager Secret for DB Credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "employee-api/rds-credentials-prod"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "postgres_admin"
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.postgres.address
    port     = 5432
    dbname   = "employeedb"
  })
}

# Amazon RDS PostgreSQL Database Instance
resource "aws_db_instance" "postgres" {
  identifier             = "employee-api-postgres-db"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = "db.t4g.micro"
  db_name                = "employeedb"
  username               = "postgres_admin"
  password               = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  storage_encrypted      = true
  multi_az               = false # Set true for multi-AZ production high availability

  tags = {
    Name = "employee-api-postgres-db"
  }
}
