locals {
  domain = trimsuffix("${var.dns_name}.${data.aws_route53_zone.environment_public_zone.name}", ".")
}

data "aws_ssm_parameter" "environment_public_zone_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/environment-public-zone-id"
}

data "aws_route53_zone" "environment_public_zone" {
  zone_id = data.aws_ssm_parameter.environment_public_zone_id.value
}

data "aws_ssm_parameter" "private_subnets" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-core-private-subnets"
}

resource "aws_alb" "alb-internal" {
  name            = "${var.environment}-${var.component_name}-alb-int"
  subnets         = split(",", data.aws_ssm_parameter.private_subnets.value)
  security_groups = [
    aws_security_group.service_to_ehr_repo.id,
    aws_security_group.vpn_to_ehr_repo.id,
    aws_security_group.gocd_to_ehr_repo.id
  ]
  internal        = true

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_alb_listener" "int-alb-listener-http" {
  load_balancer_arn = aws_alb.alb-internal.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Error"
      status_code  = "501"
    }
  }
}

resource "aws_alb_listener" "int-alb-listener-https" {
  load_balancer_arn = aws_alb.alb-internal.arn
  port              = "443"
  protocol          = "HTTPS"

  ssl_policy      = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn = aws_acm_certificate_validation.ehr-repo-cert-validation.certificate_arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Error"
      status_code  = "501"
    }
  }
}

resource "aws_alb_listener_rule" "alb-internal-check-listener-rule" {
  listener_arn = aws_alb_listener.int-alb-listener-http.arn
  priority     = 200

  action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "ALB Alive and reachable"
      status_code  = "200"
    }
  }

  condition {
    host_header {
      values = ["${var.environment}.alb.patient-deductions.nhs.uk"]
    }
  }

  depends_on = [aws_alb_listener.int-alb-listener-http]
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
  listener_arn = aws_alb_listener.int-alb-listener-http.arn
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
  listener_arn = aws_alb_listener.int-alb-listener-https.arn
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

resource "aws_security_group" "service_to_ehr_repo" {
  name        = "${var.environment}-service-to-${var.component_name}"
  description = "controls access from repo services to ehr-repo"
  vpc_id      = data.aws_ssm_parameter.deductions_core_vpc_id.value

  egress {
    description = "Allow All Outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-service-to-${var.component_name}-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "service_to_ehr_repo" {
  name = "/repo/${var.environment}/output/${var.repo_name}/service-to-ehr-repo-sg-id"
  type = "String"
  value = aws_security_group.service_to_ehr_repo.id
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_security_group" "vpn_to_ehr_repo" {
  name        = "${var.environment}-vpn-to-${var.component_name}"
  description = "controls access from vpn to ehr-repo"
  vpc_id      = data.aws_ssm_parameter.deductions_core_vpc_id.value

  ingress {
    description = "Allow vpn to access EHR Repo ALB"
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    security_groups = [data.aws_ssm_parameter.vpn_sg_id.value]
  }

  egress {
    description = "Allow All Outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-vpn-to-${var.component_name}-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_security_group" "gocd_to_ehr_repo" {
  name        = "${var.environment}-gocd-to-${var.component_name}"
  description = "controls access from gocd to ehr-repo"
  vpc_id      = data.aws_ssm_parameter.deductions_core_vpc_id.value

  ingress {
    description = "Allow gocd to access EHR Repo ALB"
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    security_groups = [data.aws_ssm_parameter.gocd_sg_id.value]
  }

  egress {
    description = "Allow All Outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-gocd-to-${var.component_name}-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

data "aws_ssm_parameter" "vpn_sg_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/vpn-sg-id"
}

data "aws_ssm_parameter" "gocd_sg_id" {
  name = "/repo/prod/user-input/external/gocd-agent-sg-id"
}


resource "aws_ssm_parameter" "deductions_core_internal_alb_dns" {
  name = "/repo/${var.environment}/output/${var.repo_name}/deductions-core-internal-alb-dns"
  type = "String"
  value = aws_alb.alb-internal.dns_name
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "deductions_core_int_alb_httpl_arn" {
  name = "/repo/${var.environment}/output/${var.repo_name}/deductions-core-int-alb-httpl-arn"
  type = "String"
  value = aws_alb_listener.int-alb-listener-http.arn
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "deductions_core_int_alb_httpsl_arn" {
  name = "/repo/${var.environment}/output/${var.repo_name}/deductions-core-int-alb-httpsl-arn"
  type = "String"
  value = aws_alb_listener.int-alb-listener-https.arn
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}