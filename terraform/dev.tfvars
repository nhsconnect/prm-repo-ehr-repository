environment    = "dev"
component_name = "ehr-repo"
dns_name       = "ehr-repo"
repo_name      = "prm-deductions-ehr-repository"

node_env = "prod"

s3_bucket_name      = "dev-ehr-repo-bucket"
s3_prev_bucket_name = "dev-ehr-repo"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count    = "1"
alb_deregistration_delay = 15
