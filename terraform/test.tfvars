environment          = "test"
component_name       = "ehr-repo"
dns_name             = "ehr-repo"
repo_name            = "prm-deductions-ehr-repository"

node_env             = "prod"
database_name        = "deductions_db"

s3_bucket_name       = "test-ehr-repo-bucket"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "2"

alb_deregistration_delay = 15
