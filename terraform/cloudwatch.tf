locals {
  error_logs_metric_name              = "ErrorCountInLogs"
  ehr_repo_service_metric_namespace = "EHRRepoService"
}

resource "aws_cloudwatch_log_group" "log-group" {
  name = local.task_log_group
  tags = {
    Environment = var.environment
    CreatedBy = var.repo_name
  }
}

resource "aws_cloudwatch_log_metric_filter" "log_metric_filter" {
  name           = "${var.environment}-${var.component_name}-error-logs"
  pattern        = "{ $.level = \"ERROR\" }"
  log_group_name = aws_cloudwatch_log_group.log-group.name

  metric_transformation {
    name          = local.error_logs_metric_name
    namespace     = local.ehr_repo_service_metric_namespace
    value         = 1
    default_value = 0
  }
}
