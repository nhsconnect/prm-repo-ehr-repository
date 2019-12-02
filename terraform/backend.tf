terraform{
      backend "s3" {
        bucket = "prm-327778747031-terraform-states"
        key = "ehr-repo/terraform.tfstate"
        region = "eu-west-2"
        encrypt = true
    }
}