data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "deductions_core_vpc_id" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/deductions-core-vpc-id"
}

data "aws_ssm_parameter" "root_zone_id" {
  name = "/repo/prm-deductions-base-infra/output/root-zone-id"
}

data "aws_ssm_parameter" "private_zone_id" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/private-root-zone-id"
}

data "aws_ssm_parameter" "authorization_keys" {
  name = "/repo/${var.environment}/prm-deductions-component-template/user-input/ehr-repo-authorization-keys"
}

data "aws_ssm_parameter" "db-username" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/db-username"
}

data "aws_ssm_parameter" "db-password" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/db-password"
}

data "aws_ssm_parameter" "rds_endpoint" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/core-rds-endpoint"
}

data "aws_ssm_parameter" "deductions_core_ecs_cluster_id" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/deductions-core-ecs-cluster-id"
}

data "aws_ssm_parameter" "deductions_core_ecs_tasks_sg_id" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/deductions-core-ecs-tasks-sg-id"
}

data "aws_ssm_parameter" "deductions_core_private_subnets" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/deductions-core-private-subnets"
}

data "aws_ssm_parameter" "deductions_core_internal_alb_dns" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/deductions-core-internal-alb-dns"
}

data "aws_ssm_parameter" "deductions_core_int_alb_httpl_arn" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/deductions-core-int-alb-httpl-arn"
}

data "aws_ssm_parameter" "deductions_core_int_alb_httpsl_arn" {
  name = "/repo/${var.environment}/prm-deductions-infra/output/deductions-core-int-alb-httpsl-arn"
}
