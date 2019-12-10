environment          = "dev"
component_name       = "ehr-repo"

node_env             = "prod"
database_name        = "deductions_db"

s3_bucket_name       = "dev-ehr-repo-bucket"

task_family          = "ehr-repo"

task_container_name  = "ehr-repo-container"
task_image_name      = "deductions/ehr-repo"
task_cpu             = 256
task_memory          = 512
task_container_port  = 3000
task_host_port       = 3000

service_container_port  = "3000"
service_container_name  = "ehr-repo-container"
service_desired_count   = "2"
