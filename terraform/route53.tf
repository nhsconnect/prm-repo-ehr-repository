locals {
  deductions_private_alb_dns = data.aws_ssm_parameter.deductions_core_alb_dns.value
  deductions_private_internal_alb_dns = data.aws_ssm_parameter.deductions_core_internal_alb_dns.value
}
resource "aws_route53_record" "ehr-r53-record" {
  zone_id = data.aws_ssm_parameter.root_zone_id.value
  name    = "${var.environment}.ehr-repo"
  type    = "CNAME"
  ttl     = "300"
  records = [local.deductions_private_alb_dns]
}

resource "aws_route53_record" "ehr-r53-private-record" {
  zone_id = data.aws_ssm_parameter.private_zone_id.value
  name    = "${var.environment}.ehr-repo"
  type    = "CNAME"
  ttl     = "300"
  records = [local.deductions_private_internal_alb_dns]
}
