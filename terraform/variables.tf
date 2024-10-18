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

variable "database_name" { // TODO: PRMP-120 - REMOVE
  type = string
}

variable "gocd_cidr_block" {
  default = "10.1.0.0/16"
}

variable "application_database_user" { // TODO: PRMP-120 - Does this need removing?
  default     = "application_user"
  description = "Needs to match with the user created in db-roles tf plan"
}

variable "log_level" {
  type    = string
  default = "debug"
}

variable "grant_access_through_vpn" {} // TODO: PRMP-120 - REMOVE
variable "allow_vpn_to_ecs_tasks" { default = false }
variable "enable_rds_cluster_deletion_protection" {} // TODO: PRMP-120 - REMOVE

variable "is_restricted_account" {
  default = false
}

variable "db_instance_number" { // TODO: PRMP-120 - REMOVE
  default = 1
}