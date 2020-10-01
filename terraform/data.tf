data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "deductions_core_vpc_id" {
  name = "/repo/${var.environment}/output/prm-deductions/deductions-core-vpc-id"
}

data "aws_ssm_parameter" "root_zone_id" {
  name = "/repo/output/prm-deductions-base-infra/root-zone-id"
}

data "aws_ssm_parameter" "private_zone_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/private-root-zone-id"
}

data "aws_ssm_parameter" "authorization_keys" {
  name = "/repo/${var.environment}/user-input/ehr-repo-authorization-keys"
}

data "aws_ssm_parameter" "db-username" {
  name = "/repo/${var.environment}/user-input/db-username"
}

data "aws_ssm_parameter" "db-password" {
  name = "/repo/${var.environment}/user-input/db-password"
}

data "aws_ssm_parameter" "rds_endpoint" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/core-rds-endpoint"
}

data "aws_ssm_parameter" "deductions_core_ecs_cluster_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-core-ecs-cluster-id"
}

data "aws_ssm_parameter" "deductions_core_ecs_tasks_sg_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-core-ecs-tasks-sg-id"
}

data "aws_ssm_parameter" "deductions_core_private_subnets" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-core-private-subnets"
}

data "aws_ssm_parameter" "deductions_core_internal_alb_dns" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-core-internal-alb-dns"
}

data "aws_ssm_parameter" "deductions_core_int_alb_httpl_arn" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-core-int-alb-httpl-arn"
}

data "aws_ssm_parameter" "deductions_core_int_alb_httpsl_arn" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-core-int-alb-httpsl-arn"
}
