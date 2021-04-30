resource "aws_security_group" "db-sg" {
  name        = "ehr-db-sg"
  vpc_id      = data.aws_ssm_parameter.deductions_core_vpc_id.value

  ingress {
    description     = "Allow traffic from ehr-repo to the db"
    protocol        = "tcp"
    from_port       = "5432"
    to_port         = "5432"
    security_groups = [aws_security_group.ecs-tasks-sg.id]
  }

  tags = {
    Name = "db-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_rds_cluster" "db-cluster" {
  cluster_identifier      = "${var.environment}-ehr-db-cluster"
  engine                  = "aurora-postgresql"
  database_name           = "ehrdb"
  master_username         = data.aws_ssm_parameter.db-username.value
  master_password         = data.aws_ssm_parameter.db-password.value
  backup_retention_period = 5
  preferred_backup_window = "07:00-09:00"
  vpc_security_group_ids  = [aws_security_group.db-sg.id]
  apply_immediately       = true
  db_subnet_group_name    = aws_db_subnet_group.db-cluster-subnet-group.name
  skip_final_snapshot = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.ehr-repo-key.arn

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_kms_key" "ehr-repo-key" {
  description             = "EHR repository KMS key in ${var.environment} environment"
  tags = {
    Name = "${var.environment}-ehr-repo-db"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "rds_endpoint" {
  name = "/repo/${var.environment}/output/${var.repo_name}/core-rds-endpoint"
  type = "String"
  value = aws_rds_cluster.db-cluster.endpoint
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

data "aws_ssm_parameter" "database_subnets" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-core-database-subnets"
}

resource "aws_db_subnet_group" "db-cluster-subnet-group" {
  name       = "${var.environment}-ehr-db-subnet-group"
  subnet_ids = split(",", data.aws_ssm_parameter.database_subnets.value)

  tags = {
    Name = "${var.environment}-ehr-db-subnet-group"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_rds_cluster_instance" "ehr-db-instances" {
  count                 = 1
  identifier            = "${var.environment}-ehr-db-instance-${count.index}"
  cluster_identifier    = aws_rds_cluster.db-cluster.id
  instance_class        = "db.t3.medium"
  engine                = "aurora-postgresql"
  db_subnet_group_name  = aws_db_subnet_group.db-cluster-subnet-group.name
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}
