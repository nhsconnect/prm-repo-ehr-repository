locals {
  ecs_cluster_id    = data.terraform_remote_state.prm-deductions-infra.outputs.deductions_core_ecs_cluster_id
  ecs_tasks_sg_id   = data.terraform_remote_state.prm-deductions-infra.outputs.deductions_core_ecs_tasks_sg_id
  private_subnets   = data.terraform_remote_state.prm-deductions-infra.outputs.deductions_core_private_subnets
  # alb_tg_arn        = data.terraform_remote_state.prm-deductions-infra.outputs.deductions_core_ehr_repo_alb_tg_arn
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
  #   target_group_arn = local.alb_tg_arn
  #   container_name   = var.service_container_name
  #   container_port   = var.service_container_port
  # }
}