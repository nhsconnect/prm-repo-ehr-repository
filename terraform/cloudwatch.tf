
resource "aws_cloudwatch_log_group" "log-group" {
  name = local.task_log_group
  tags = {
    Environment = var.environment
    CreatedBy = var.repo_name
  }
}
