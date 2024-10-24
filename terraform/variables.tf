variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "repo_name" {
  type    = string
  default = "prm-deductions-ehr-repository"
}

variable "node_env" {}
variable "environment" {}

variable "component_name" {}
variable "dns_name" {}

variable "s3_bucket_name" {}
variable "s3_prev_bucket_name" {}
variable "s3_backup_enabled" {
  type        = bool
  default     = false
  description = "Set to true if the environment needs backing up e.g. in production. This will result in versioning and object locking being enabled for select buckets containing critical live data."
}

variable "task_image_tag" {}
variable "task_cpu" {
  default = 512
}
variable "task_memory" {
  default = 1024
}
variable "port" {}

variable "service_desired_count" {}

variable "alb_deregistration_delay" {}

variable "gocd_cidr_block" {
  default = "10.1.0.0/16"
}

variable "log_level" {
  type    = string
  default = "debug"
}

variable "allow_vpn_to_ecs_tasks" { default = false }

variable "is_restricted_account" {
  default = false
}