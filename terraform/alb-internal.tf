locals {
  domain = trimsuffix("${var.dns_name}.${data.aws_route53_zone.environment_public_zone.name}", ".")
}

data "aws_ssm_parameter" "environment_public_zone_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/environment-public-zone-id"
}

data "aws_route53_zone" "environment_public_zone" {
  zone_id = data.aws_ssm_parameter.environment_public_zone_id.value
}

resource "aws_alb_target_group" "internal-alb-tg" {
  name        = "${var.environment}-${var.component_name}-int-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = data.aws_ssm_parameter.deductions_core_vpc_id.value
  target_type = "ip"
  deregistration_delay = var.alb_deregistration_delay
  health_check {
    healthy_threshold   = 3
    unhealthy_threshold = 5
    timeout             = 5
    interval            = 10
    path                = "/health"
    port                = 3000
  }

  tags = {
    Environment = var.environment
    CreatedBy = var.repo_name
  }
}

resource "aws_alb_listener_rule" "int-alb-http-listener-rule" {
  listener_arn = data.aws_ssm_parameter.deductions_core_int_alb_httpl_arn.value
  priority     = 100

  action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  condition {
    host_header {
      values = [local.domain]
    }
  }
}

resource "aws_alb_listener_rule" "int-alb-https-listener-rule" {
  listener_arn = data.aws_ssm_parameter.deductions_core_int_alb_httpsl_arn.value
  priority     = 101

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.internal-alb-tg.arn
  }

  condition {
    host_header {
      values = [local.domain]
    }
  }
}
