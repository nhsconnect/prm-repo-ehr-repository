variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "repo_name" {
  type    = string
  default = "prm-deductions-ehr-repository"
}

variable "component_name" {
  type    = string
  default = "ehr-repo"
}

variable "environment" {}

## RDS
variable "db_name" {}
variable "db_host" {}
variable "db_username" {}
variable "db_password" {}
variable "db_port" {
  type    = string
  default = "5432"
}
