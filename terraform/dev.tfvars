environment          = "dev"
component_name       = "ehr-repo"
dns_name             = "ehr-repo"

node_env             = "prod"
database_name        = "deductions_db"

s3_bucket_name       = "dev-ehr-repo-bucket"

task_cpu    = 256
task_memory = 512
port        = 3000

service_desired_count = "1"

alb_deregistration_delay = 15
