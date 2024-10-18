environment    = "perf"
component_name = "ehr-repo"
dns_name       = "ehr-repo"
repo_name      = "prm-deductions-ehr-repository"

node_env      = "prod"
database_name = "deductions_db" // TODO: PRMP-120 - REMOVE

s3_bucket_name      = "perf-ehr-repo-bucket"
s3_prev_bucket_name = "perf-ehr-repo"

port = 3000

service_desired_count    = "2"
alb_deregistration_delay = 15

grant_access_through_vpn               = true // TODO: PRMP-120 - REMOVE
enable_rds_cluster_deletion_protection = false // TODO: PRMP-120 - REMOVE