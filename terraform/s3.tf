resource "aws_s3_bucket" "ehr-repo-bucket" {
  bucket        = var.s3_bucket_name
  acl           = "private"
  force_destroy = true

  versioning {
    enabled = false
  }

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}