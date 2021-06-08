environment          = "dev"
component_name       = "ehr-repo"
dns_name             = "ehr-repo"
repo_name            = "prm-deductions-ehr-repository"
allowed_cidr         = "10.20.0.0/16" // deductions_private_cidr

node_env             = "prod"
database_name        = "deductions_db"

//PRMT-2130 temp should be removed when all infrastructure is destroyed in ci account
s3_bucket_name       = "dev-ehr-repo-bucket-temp"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "1"

alb_deregistration_delay = 15
