provider "aws" {
  profile = "default"
  region  = var.region
}

provider "postgresql" { // TODO: PRMP-120 - REMOVE
  host            = var.db_host
  port            = var.db_port
  database        = var.db_name
  username        = var.db_username
  password        = var.db_password
  connect_timeout = 15
  superuser       = false
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.44.0"
    }
    postgresql = { // TODO: PRMP-120 - REMOVE
      source  = "cyrilgdn/postgresql"
      version = "1.13.0"
    }
  }
}
