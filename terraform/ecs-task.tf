locals {
  task_role_arn       = aws_iam_role.ehr-repo.arn
  task_execution_role = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.environment}-${var.component_name}-EcsTaskRole"
  task_ecr_url        = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
  task_log_group      = "/nhs/deductions/${var.environment}-${data.aws_caller_identity.current.account_id}/${var.component_name}"
  environment_variables = [
    { name = "NODE_ENV", value = var.node_env },
    { name = "NHS_ENVIRONMENT", value = var.environment },
    { name = "DATABASE_NAME", value = var.database_name },
    { name = "DATABASE_HOST", value = aws_rds_cluster.db-cluster.endpoint },
    { name = "S3_BUCKET_NAME", value = var.s3_bucket_name },
  ]
  secret_environment_variables = [
    { name = "AUTHORIZATION_KEYS", valueFrom = data.aws_ssm_parameter.authorization_keys.arn },
    { name = "DATABASE_USER", valueFrom = data.aws_ssm_parameter.db-username.arn },
    { name = "DATABASE_PASSWORD", valueFrom = data.aws_ssm_parameter.db-password.arn }
  ]
}

resource "aws_ecs_task_definition" "task" {
  family                   = var.component_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = local.task_execution_role
  task_role_arn            = local.task_role_arn


  container_definitions = templatefile("${path.module}/templates/ecs-task-def.tmpl", {
    container_name        = "${var.component_name}-container",
    ecr_url               = local.task_ecr_url,
    image_name            = "deductions/${var.component_name}",
    image_tag             = var.task_image_tag,
    cpu                   = var.task_cpu,
    memory                = var.task_memory,
    container_port        = var.port,
    host_port             = var.port,
    log_region            = var.region,
    log_group             = local.task_log_group,
    environment_variables = jsonencode(local.environment_variables),
    secrets               = jsonencode(local.secret_environment_variables)
  })

  tags = {
    Environment = var.environment
    CreatedBy = var.repo_name
  }
}

resource "aws_security_group" "ecs-tasks-sg" {
  name        = "${var.environment}-${var.component_name}-ecs-tasks-sg"
  vpc_id      = data.aws_ssm_parameter.deductions_core_vpc_id.value

  ingress {
    description     = "Allow traffic from public and internal ALB to ehr-repo service"
    protocol        = "tcp"
    from_port       = "3000"
    to_port         = "3000"
    security_groups = [
      # aws_security_group.core-alb-sg.id,
      aws_security_group.core-alb-internal-sg.id
    ]
  }

  egress {
    description = "Allow All Outbound"
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.component_name}-ecs-tasks-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "deductions_core_ecs_tasks_sg_id" {
  name = "/repo/${var.environment}/output/${var.repo_name}/deductions-core-ecs-tasks-sg-id"
  type = "String"
  value = aws_security_group.ecs-tasks-sg.id
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}