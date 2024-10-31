variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "repo_name" {
  type    = string
  default = "prm-deductions-ehr-repository"
}

variable "db_port" { // TODO: PRMP-120 - REMOVE
  type    = string
  default = "5432"
}

variable "component_name" {
  type    = string
  default = "ehr-repo"
}

variable "environment" {}
variable "db_name" {}     // TODO: PRMP-120 - REMOVE
variable "db_host" {}     // TODO: PRMP-120 - REMOVE
variable "db_username" {} // TODO: PRMP-120 - REMOVE
variable "db_password" {} // TODO: PRMP-120 - REMOVE