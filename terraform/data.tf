data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "root_zone_id" {
  name = "/NHS/deductions-${data.aws_caller_identity.current.account_id}/root_zone_id"
}

data "aws_ssm_parameter" "private_zone_id" {
  name = "/NHS/deductions-${data.aws_caller_identity.current.account_id}/${var.environment}/private_root_zone_id"
}

data "aws_ssm_parameter" "authorization_keys" {
  name = "/NHS/${var.environment}-${data.aws_caller_identity.current.account_id}/ehr-repo/authorization_keys"
}

data "aws_ssm_parameter" "db-username" {
  name = "/nhs/${var.environment}/db/db-username"
}

data "aws_ssm_parameter" "db-password" {
  name = "/nhs/${var.environment}/db/db-password"
}

data "aws_ssm_parameter" "rds_endpoint" {
  name = "/NHS/${var.environment}-${data.aws_caller_identity.current.account_id}/core/rds_endpoint"
}

data "aws_ssm_parameter" "deductions_core_ecs_cluster_id" {
  name = "/nhs/${var.environment}/deductions_core_ecs_cluster_id"
}

data "aws_ssm_parameter" "deductions_core_ecs_tasks_sg_id" {
  name = "/nhs/${var.environment}/deductions_core_ecs_tasks_sg_id"
}

data "aws_ssm_parameter" "deductions_core_private_subnets" {
  name = "/nhs/${var.environment}/deductions_core_private_subnets"
}

data "aws_ssm_parameter" "deductions_core_ehr_repo_public_alb_tg_arn" {
  name = "/nhs/${var.environment}/deductions_core_ehr_repo_alb_tg_arn"
}

data "aws_ssm_parameter" "deductions_core_ehr_repo_internal_alb_tg_arn" {
  name = "/nhs/${var.environment}/deductions_core_ehr_repo_internal_alb_tg_arn"
}

# data "aws_ssm_parameter" "deductions_core_alb_dns" {
#   name = "/nhs/${var.environment}/deductions_core_alb_dns"
# }

data "aws_ssm_parameter" "deductions_core_internal_alb_dns" {
  name = "/nhs/${var.environment}/deductions_core_internal_alb_dns"
}
