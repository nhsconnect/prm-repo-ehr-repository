environment    = "test"
component_name = "ehr-repo"
dns_name       = "ehr-repo"
repo_name      = "prm-deductions-ehr-repository"

node_env      = "prod"
database_name = "deductions_db"

s3_bucket_name      = "test-ehr-repo-bucket"
s3_prev_bucket_name = "test-ehr-repo"

task_cpu    = 1024
task_memory = 2048
port        = 3000

service_desired_count    = "2"
alb_deregistration_delay = 15

grant_access_through_vpn               = true
enable_rds_cluster_deletion_protection = false