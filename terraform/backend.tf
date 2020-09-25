terraform{
      backend "s3" {
        bucket  = "prm-deductions-terraform-state"
        key     = "ehr-repository/terraform.tfstate"
        region  = "eu-west-2"
        encrypt = true
    }
}
