locals {
  ecs_cluster_id    = data.aws_ssm_parameter.deductions_core_ecs_cluster_id.value
  ecs_tasks_sg_id   = data.aws_ssm_parameter.deductions_core_ecs_tasks_sg_id.value
  private_subnets   = split(",", data.aws_ssm_parameter.deductions_core_private_subnets.value)
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
    security_groups = [local.ecs_tasks_sg_id]
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

  tags = {
    Environment = var.environment
    CreatedBy = var.repo_name
  }
}
