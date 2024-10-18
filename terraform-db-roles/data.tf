data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "db_cluster_resource_id" { // TODO: PRMP-120 - May need removing
  name = "/repo/${var.environment}/output/${var.repo_name}/db-resource-cluster-id"
}
