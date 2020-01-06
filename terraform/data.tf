data "aws_caller_identity" "current" {}

data "terraform_remote_state" "prm-deductions-infra" {
  backend = "s3"

  config = {
        bucket  = "prm-327778747031-terraform-states"
        key     = "gpportal/terraform.tfstate"
        region  = "eu-west-2"
        encrypt = true
  }
}

data "aws_ssm_parameter" "root_zone_id" {
  name = "/NHS/deductions-${data.aws_caller_identity.current.account_id}/root_zone_id"
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
