environment    = "prod"
component_name = "ehr-repo"
dns_name       = "ehr-repo"
repo_name      = "prm-deductions-ehr-repository"

node_env      = "prod"
database_name = "deductions_db" // TODO: PRMP-120 - REMOVE

s3_bucket_name      = "prod-ehr-repo-bucket"
s3_prev_bucket_name = "prod-ehr-repo"
s3_backup_enabled   = true

port = 3000

service_desired_count    = "3"
alb_deregistration_delay = 15
log_level                = "info"

grant_access_through_vpn               = true // TODO: PRMP-120 - REMOVE
enable_rds_cluster_deletion_protection = true // TODO: PRMP-120 - REMOVE

is_restricted_account = true

db_instance_number = 3 // TODO: PRMP-120 - REMOVE