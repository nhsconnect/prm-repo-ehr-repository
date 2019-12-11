locals {
    task_execution_role          = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.task_execution_role}"
    task_role                    = aws_iam_role.ehr-repo.arn
    task_ecr_url                 = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
    task_log_group               = "/nhs/deductions/${var.environment}-${data.aws_caller_identity.current.account_id}/${var.task_family}"
    environment_variables        = [
      { name = "NODE_ENV", value = var.node_env },
      { name = "NHS_ENVIRONMENT", value = var.environment },
      { name = "DATABASE_NAME", value = var.database_name },
      { name = "DATABASE_HOST", value = data.aws_ssm_parameter.rds_endpoint.value },
      { name = "S3_BUCKET_NAME", value = var.s3_bucket_name },
    ]
    secrets                      = [
      { name = "DATABASE_USER", valueFrom = data.aws_secretsmanager_secret.db-username.arn },
      { name = "DATABASE_PASSWORD", valueFrom = data.aws_secretsmanager_secret.db-password.arn }
    ]
}

resource "aws_ecs_task_definition" "task" {
  family                    = var.task_family
  network_mode              = "awsvpc"
  requires_compatibilities  = ["FARGATE"]
  cpu                       = var.task_cpu
  memory                    = var.task_memory
  execution_role_arn        = local.task_execution_role
  task_role_arn             = local.task_role


  container_definitions  =  templatefile("${path.module}/templates/ecs-task-def.tmpl", {
        container_name        = var.task_container_name,
        ecr_url               = local.task_ecr_url,
        image_name            = var.task_image_name,
        image_tag             = var.task_image_tag,
        cpu                   = var.task_cpu,
        memory                = var.task_memory,
        container_port        = var.task_container_port,
        host_port             = var.task_host_port,
        log_region            = var.region,
        log_group             = local.task_log_group,
        environment_variables = jsonencode(local.environment_variables),
        secrets               = jsonencode(local.secrets)
    })
}
