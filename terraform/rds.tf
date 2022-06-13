resource "aws_rds_cluster" "db-cluster" {
  cluster_identifier      = "${var.environment}-ehr-db-cluster"
  engine                  = "aurora-postgresql"
  database_name           = "ehrdb"
  master_username         = data.aws_ssm_parameter.db-username.value
  master_password         = data.aws_ssm_parameter.db-password.value
  backup_retention_period = 5
  preferred_backup_window = "07:00-09:00"
  engine_version          = "11"
  vpc_security_group_ids  = [
    aws_security_group.ehr_repo_to_db_sg.id,
    aws_security_group.gocd_to_db_sg.id,
    aws_security_group.vpn_to_db_sg.id
  ]
  apply_immediately       = true
  db_subnet_group_name    = aws_db_subnet_group.db-cluster-subnet-group.name
  skip_final_snapshot = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.ehr-repo-key.arn
  iam_database_authentication_enabled  = true
  deletion_protection = var.enable_rds_cluster_deletion_protection
  db_cluster_parameter_group_name = data.aws_ssm_parameter.repo_databases_parameter_group_name.value

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_kms_key" "ehr-repo-key" {
  description             = "EHR repository KMS key in ${var.environment} environment"
  enable_key_rotation = true
  tags = {
    Name = "${var.environment}-ehr-repo-db"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_kms_alias" "ehr_repo_encryption" {
  name          = "alias/ehr-repo-encryption-kms-key"
  target_key_id = aws_kms_key.ehr-repo-key.id
}

resource "aws_ssm_parameter" "db_host" {
  name = "/repo/${var.environment}/output/${var.repo_name}/db-host"
  type = "String"
  value = aws_rds_cluster.db-cluster.endpoint
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "db_resource_cluster_id" {
  name =  "/repo/${var.environment}/output/${var.repo_name}/db-resource-cluster-id"
  type  = "String"
  value = aws_rds_cluster.db-cluster.cluster_resource_id

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "db_name" {
  name =  "/repo/${var.environment}/output/${var.repo_name}/db-name"
  type  = "String"
  value = aws_rds_cluster.db-cluster.database_name
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
  count                 = var.db_instance_number
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

resource "aws_security_group" "ehr_repo_to_db_sg" {
  name        = "${var.environment}-ehr-repo-ecs-to-ehr-repo-db-sg"
  vpc_id      = data.aws_ssm_parameter.deductions_core_vpc_id.value

  ingress {
    description     = "Allow traffic from ehr-repo to the db"
    protocol        = "tcp"
    from_port       = "5432"
    to_port         = "5432"
    security_groups = [aws_security_group.ecs-tasks-sg.id]
  }

  tags = {
    Name = "${var.environment}-ehr-repo-ecs-to-ehr-repo-db-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_security_group" "gocd_to_db_sg" {
  name = "${var.environment}-gocd-to-ehr-repo-db-sg"
  vpc_id = data.aws_ssm_parameter.deductions_core_vpc_id.value

  ingress {
    description     = "Allow traffic from GoCD agent to the db"
    protocol        = "tcp"
    from_port       = "5432"
    to_port         = "5432"
    security_groups = [data.aws_ssm_parameter.gocd_sg_id.value]
  }

  tags = {
    Name = "${var.environment}-gocd-to-ehr-repo-db-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_security_group" "vpn_to_db_sg" {
  name = "${var.environment}-vpn-to-ehr-repo-db-sg"
  vpc_id = data.aws_ssm_parameter.deductions_core_vpc_id.value

  tags = {
    Name = "${var.environment}-vpn-to-ehr-repo-db-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_security_group_rule" "vpn_to_db_sg" {
  count       = var.grant_access_through_vpn ? 1 : 0
  type        = "ingress"
  description = "Allow traffic from VPN to the db"
  protocol    = "tcp"
  from_port   = 5432
  to_port     = 5432
  source_security_group_id = data.aws_ssm_parameter.vpn_sg_id.value
  security_group_id = aws_security_group.vpn_to_db_sg.id
}

data "aws_ssm_parameter" "repo_databases_parameter_group_name" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/repo-databases-parameter-group-name"
}

