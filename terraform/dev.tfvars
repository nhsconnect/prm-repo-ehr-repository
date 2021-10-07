environment          = "dev"
component_name       = "ehr-repo"
dns_name             = "ehr-repo"
repo_name            = "prm-deductions-ehr-repository"
allowed_cidr         = "10.20.0.0/16" // deductions_private_cidr

node_env             = "prod"
database_name        = "deductions_db"

s3_bucket_name       = "dev-ehr-repo-bucket"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "1"
alb_deregistration_delay = 15

grant_access_through_vpn = true
enable_rds_cluster_deletion_protection = false