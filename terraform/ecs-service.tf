locals {
  ecs_cluster_id   = aws_ecs_cluster.ecs-cluster.id
  ecs_tasks_sg_ids = var.allow_vpn_to_ecs_tasks ? [aws_security_group.ecs-tasks-sg.id, aws_security_group.vpn_to_ehr_repo_ecs[0].id] : [aws_security_group.ecs-tasks-sg.id]
  private_subnets  = split(",", data.aws_ssm_parameter.private_subnets.value)
  # public_alb_tg_arn = data.aws_ssm_parameter.deductions_core_ehr_repo_public_alb_tg_arn.value
  internal_alb_tg_arn = aws_alb_target_group.internal-alb-tg.arn
}

resource "aws_ecs_service" "ecs-service" {
  name            = "${var.environment}-${var.component_name}-service"
  cluster         = local.ecs_cluster_id
  task_definition = aws_ecs_task_definition.task.arn
  desired_count   = var.service_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups = local.ecs_tasks_sg_ids
    subnets         = local.private_subnets
  }

  # load_balancer {
  #   target_group_arn = local.public_alb_tg_arn
  #   container_name   = var.service_container_name
  #   container_port   = var.service_container_port
  # }

  load_balancer {
    target_group_arn = local.internal_alb_tg_arn
    container_name   = "${var.component_name}-container"
    container_port   = var.port
  }

  depends_on = [
    # aws_alb_target_group.alb-tg,
    aws_alb_target_group.internal-alb-tg,
    # aws_alb_listener_rule.alb-http-listener-rule,
    aws_alb_listener_rule.int-alb-http-listener-rule,
    # aws_alb_listener_rule.alb-https-listener-rule,
    aws_alb_listener_rule.int-alb-https-listener-rule
  ]

}

resource "aws_ecs_cluster" "ecs-cluster" {
  name = "${var.environment}-${var.component_name}-ecs-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "deductions_core_ecs_cluster_id" {
  name  = "/repo/${var.environment}/output/${var.repo_name}/deductions-core-ecs-cluster-id"
  type  = "String"
  value = aws_ecs_cluster.ecs-cluster.id
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}