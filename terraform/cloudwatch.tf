locals {
  error_logs_metric_name            = "ErrorCountInLogs"
  ehr_repo_service_metric_namespace = "EhrRepo"
}

resource "aws_cloudwatch_log_group" "log-group" {
  name = local.task_log_group
  tags = {
    Environment = var.environment
    CreatedBy   = var.repo_name
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

resource "aws_cloudwatch_metric_alarm" "error_log_alarm" {
  alarm_name          = "${var.environment}-${var.component_name}-error-logs"
  comparison_operator = "GreaterThanThreshold"
  threshold           = "0"
  evaluation_periods  = "1"
  period              = "60"
  metric_name         = local.error_logs_metric_name
  namespace           = local.ehr_repo_service_metric_namespace
  statistic           = "Sum"
  alarm_description   = "This alarm monitors errors logs in ${var.component_name}"
  treat_missing_data  = "notBreaching"
  actions_enabled     = "true"
  alarm_actions       = [data.aws_sns_topic.alarm_notifications.arn]
  ok_actions          = [data.aws_sns_topic.alarm_notifications.arn]
}

resource "aws_cloudwatch_metric_alarm" "healthy_host_count" {
  alarm_name          = "${var.repo_name} service down"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors the health of ${var.repo_name}"
  treat_missing_data  = "breaching"
  datapoints_to_alarm = "1"
  dimensions = {
    TargetGroup  = aws_alb_target_group.internal-alb-tg.arn_suffix
    LoadBalancer = aws_alb.alb-internal.arn_suffix
  }
  alarm_actions = [data.aws_sns_topic.alarm_notifications.arn]
  ok_actions    = [data.aws_sns_topic.alarm_notifications.arn]
}

data "aws_sns_topic" "alarm_notifications" {
  name = "${var.environment}-alarm-notifications-sns-topic"
}