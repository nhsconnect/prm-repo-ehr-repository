variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "repo_name" {
  type = string
  default = "prm-deductions-ehr-repository"
}

variable "db_port" {
  type = string
  default = "5432"
}

variable "component_name" {
  type = string
  default = "ehr-repo"
}

variable "environment" {}
variable "db_name" {}
variable "db_host" {}
variable "db_username" {}
variable "db_password" {}
