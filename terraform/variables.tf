variable "region" {
  type        = string
  default     = "eu-west-2"
}

variable "repo_name" {
  type = string
  default = "prm-deductions-ehr-repository"
}

variable "node_env" {}
variable "environment" {}

variable "component_name" {}
variable "dns_name" {}
variable "s3_bucket_name" {}
variable "task_image_tag" {}
variable "task_cpu" {}
variable "task_memory" {}
variable "port" {}
variable "allowed_cidr" {}

variable "service_desired_count" {}

variable "alb_deregistration_delay" {}

variable "database_name" {
  type = string
}

variable "gocd_cidr_block" {
  default = "10.1.0.0/16"
}

variable "application_database_user" {
  default = "application_user"
  description = "Needs to match with the user created in db-roles tf plan"
}

variable "log_level" {
  type = string
  default = "debug"
}

variable "grant_access_through_vpn" {}