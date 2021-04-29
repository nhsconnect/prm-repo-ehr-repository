locals {
  deductions_private_internal_alb_dns = data.aws_ssm_parameter.deductions_core_internal_alb_dns.value
}

data "aws_ssm_parameter" "environment_private_zone_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/environment-private-zone-id"
}

resource "aws_route53_record" "ehr-repo" {
  zone_id = data.aws_ssm_parameter.environment_private_zone_id.value
  name    = var.dns_name
  type    = "CNAME"
  ttl     = "300"
  records = [local.deductions_private_internal_alb_dns]
}