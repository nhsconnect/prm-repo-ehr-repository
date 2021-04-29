environment          = "test"
component_name       = "ehr-repo"
dns_name             = "ehr-repo"
repo_name            = "prm-deductions-ehr-repository"
allowed_cidr         = "10.21.0.0/16" // deductions_private_cidr
database_subnets     = ["10.26.111.0/24", "10.26.112.0/24"]

node_env             = "prod"
database_name        = "deductions_db"

s3_bucket_name       = "test-ehr-repo-bucket"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "2"

alb_deregistration_delay = 15
