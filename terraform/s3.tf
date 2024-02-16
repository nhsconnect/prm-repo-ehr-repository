locals {
  ehr_repo_bucket_access_logs_prefix = "ehr_repo/"
}

//TODO: Rename to ehr_repo_health_record_data
// Upgrade terraform version to latest
resource "aws_s3_bucket" "ehr-repo-bucket" {
  bucket = var.s3_bucket_name
  acl    = "private"
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
#  logging {
#    target_bucket = aws_s3_bucket.ehr_repo_access_logs.id
#    target_prefix = local.ehr_repo_bucket_access_logs_prefix
#  }

    logging {
      target_bucket = data.aws_ssm_parameter.access_logs_s3_bucket_id
      target_prefix = local.ehr_repo_bucket_access_logs_prefix
    }

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_object_lock_configuration" "ehr_repo_bucket" {
  count = var.s3_backup_enabled ? 1 : 0

  bucket = aws_s3_bucket.ehr-repo-bucket.bucket

  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = 36500 # 100 Years
    }
  }

  depends_on = [aws_s3_bucket_versioning.ehr_repo_bucket]
}

resource "aws_s3_bucket_versioning" "ehr_repo_bucket" {
  count = var.s3_backup_enabled ? 1 : 0

  bucket = aws_s3_bucket.ehr-repo-bucket.bucket

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "ehr_repo_access_block" {
  bucket = aws_s3_bucket.ehr-repo-bucket.bucket

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "ehr-repo-bucket_policy" {
  bucket = aws_s3_bucket.ehr-repo-bucket.id
  policy = jsonencode({
    "Statement" : [
      {
        Effect : "Deny",
        Principal : "*",
        Action : "s3:*",
        Resource : "${aws_s3_bucket.ehr-repo-bucket.arn}/*",
        Condition : {
          Bool : {
            "aws:SecureTransport" : "false"
          }
        }
      },
      {
        Effect : "Deny",
        Principal : {
          "AWS" : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/NHSDAdminRole"
        },
        Action : "s3:*",
        Resource : [
          "${aws_s3_bucket.ehr-repo-bucket.arn}",
          "${aws_s3_bucket.ehr-repo-bucket.arn}/*"
        ]
      }
    ]
  })
}

#resource "aws_s3_bucket" "ehr_repo_access_logs" {
#  bucket        = "${var.environment}-${var.component_name}-access-logs"
#  acl           = "private"
#  force_destroy = true
#  server_side_encryption_configuration {
#    rule {
#      apply_server_side_encryption_by_default {
#        sse_algorithm = "AES256"
#      }
#    }
#  }
#  tags = {
#    CreatedBy   = var.repo_name
#    Environment = var.environment
#  }
#}

#resource "aws_s3_bucket_versioning" "ehr_repo_access_logs" {
#  count = var.s3_backup_enabled ? 1 : 0
#
#  bucket = aws_s3_bucket.ehr_repo_access_logs.bucket
#
#  versioning_configuration {
#    status = "Enabled"
#  }
#}

#resource "aws_s3_bucket_public_access_block" "ehr_repo_access_logs_access_block" {
#  bucket = aws_s3_bucket.ehr_repo_access_logs.bucket
#
#  block_public_acls       = true
#  block_public_policy     = true
#  ignore_public_acls      = true
#  restrict_public_buckets = true
#}

#resource "aws_s3_bucket_policy" "ehr_repo_permit_developer_to_see_access_logs_policy" {
#  count  = var.is_restricted_account ? 1 : 0
#  bucket = aws_s3_bucket.ehr_repo_access_logs.id
#  policy = jsonencode({
#    "Statement" : [
#      {
#        Effect : "Allow",
#        Principal : {
#          "AWS" : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/RepoDeveloper"
#        },
#        Action : ["s3:Get*", "s3:ListBucket"],
#        Resource : [
#          "${aws_s3_bucket.ehr_repo_access_logs.arn}",
#          "${aws_s3_bucket.ehr_repo_access_logs.arn}/*"
#        ],
#        Condition : {
#          Bool : {
#            "aws:SecureTransport" : "false"
#          }
#        }
#      }
#    ]
#  })
#}

#resource "aws_s3_bucket_policy" "ehr_repo_permit_s3_to_write_access_logs_policy" {
#  bucket = aws_s3_bucket.ehr_repo_access_logs.id
#  policy = jsonencode({
#    "Version" : "2012-10-17",
#    "Statement" : [
#      {
#        "Sid" : "S3ServerAccessLogsPolicy",
#        "Effect" : "Allow",
#        "Principal" : {
#          "Service" : "logging.s3.amazonaws.com"
#        },
#        "Action" : "s3:PutObject",
#        "Resource" : "${aws_s3_bucket.ehr_repo_access_logs.arn}/${local.ehr_repo_bucket_access_logs_prefix}*",
#        Condition : {
#          Bool : {
#            "aws:SecureTransport" : "false"
#          }
#        }
#      }
#    ]
#  })
#}