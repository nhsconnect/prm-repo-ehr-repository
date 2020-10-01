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

variable "service_desired_count" {}

variable "alb_deregistration_delay" {}

variable "database_name" {
  type = string
}
