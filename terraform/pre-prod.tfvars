environment          = "pre-prod"
component_name       = "ehr-repo"
dns_name             = "ehr-repo"
repo_name            = "prm-deductions-ehr-repository"

node_env             = "prod"
database_name        = "deductions_db"

s3_bucket_name       = "pre-prod-ehr-repo-bucket"
s3_log_bucket_name   = "pre-prod-ehr-repo-log-bucket"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "3"
alb_deregistration_delay = 15
log_level = "info"

grant_access_through_vpn = true
enable_rds_cluster_deletion_protection = true

is_restricted_account= true

db_instance_number=3
