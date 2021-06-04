data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "deductions_core_vpc_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-core-vpc-id"
}

data "aws_ssm_parameter" "private_zone_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/private-root-zone-id"
}

data "aws_ssm_parameter" "e2e_test_authorization_keys_for_ehr_repo" {
  name = "/repo/${var.environment}/user-input/api-keys/ehr-repo/e2e-test"
}

data "aws_ssm_parameter" "db-username" {
  name = "/repo/${var.environment}/user-input/ehr-repo-db-username"
}

data "aws_ssm_parameter" "db-password" {
  name = "/repo/${var.environment}/user-input/ehr-repo-db-password"
}