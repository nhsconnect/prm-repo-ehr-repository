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
