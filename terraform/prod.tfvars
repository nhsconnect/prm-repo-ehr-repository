environment          = "prod"
component_name       = "ehr-repo"
dns_name             = "ehr-repo"
repo_name            = "prm-deductions-ehr-repository"
allowed_cidr         = "10.23.0.0/16" // deductions_private_cidr

node_env             = "prod"
database_name        = "deductions_db"

s3_bucket_name       = "prod-ehr-repo-bucket"
s3_log_bucket_name   = "prod-ehr-repo-log-bucket"
is_restricted_account= true

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "2"
alb_deregistration_delay = 15
log_level = "info"

grant_access_through_vpn = true
enable_rds_cluster_deletion_protection = true