locals {
  ehr_repo_bucket_access_logs_prefix = "s3-access-log/"
}

//TODO: Rename to ehr_repo_health_record_data
resource "aws_s3_bucket" "ehr-repo-bucket" {
  bucket = var.s3_bucket_name

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_acl" "ehr-repo-bucket" {
  bucket = aws_s3_bucket.ehr-repo-bucket.id
  acl    = "private"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ehr-repo-bucket" {
  bucket = aws_s3_bucket.ehr-repo-bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_logging" "ehr-repo-bucket" {
  bucket = aws_s3_bucket.ehr-repo-bucket.id

  target_bucket = aws_s3_bucket.ehr_repo_access_logs.id
  target_prefix = local.ehr_repo_bucket_access_logs_prefix

  // TODO PRMP-120 add back in when moving to terraform AWS provider V5
  #   target_object_key_format {
  #     simple_prefix {}
  #   }
}

# resource "aws_s3_bucket_object_lock_configuration" "ehr_repo_bucket" {
#   count = var.s3_backup_enabled ? 1 : 0

#   bucket = aws_s3_bucket.ehr-repo-bucket.bucket

#   rule {
#     default_retention {
#       mode = "GOVERNANCE"
#       days = 36500 # 100 Years
#     }
#   }

#   depends_on = [aws_s3_bucket_versioning.ehr_repo_bucket]
# }

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
    "Version" : "2008-10-17",
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

resource "aws_s3_bucket" "ehr_repo_access_logs" {
  bucket = "${var.environment}-${var.component_name}-access-logs"

  force_destroy = true
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_acl" "ehr_repo_access_logs" {
  bucket = aws_s3_bucket.ehr_repo_access_logs.id
  acl    = "private"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ehr_repo_access_logs" {
  bucket = aws_s3_bucket.ehr_repo_access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "ehr_repo_access_logs" {
  count = var.s3_backup_enabled ? 1 : 0

  bucket = aws_s3_bucket.ehr_repo_access_logs.bucket

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "ehr_repo_access_logs_access_block" {
  bucket = aws_s3_bucket.ehr_repo_access_logs.bucket

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "ehr_repo_permit_developer_to_see_access_logs_policy" {
  count  = var.is_restricted_account ? 1 : 0
  bucket = aws_s3_bucket.ehr_repo_access_logs.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "S3ServerAccessLogsPolicy",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "logging.s3.amazonaws.com"
        },
        "Action" : "s3:PutObject",
        "Resource" : "${aws_s3_bucket.ehr_repo_access_logs.arn}/${local.ehr_repo_bucket_access_logs_prefix}*",
        Condition : {
          Bool : {
            "aws:SecureTransport" : "false"
          }
        }
      },
      {
        "Sid" : "S3PermitDeveloperAccessLogsPolicy",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/RepoDeveloper"
        },
        "Action" : [
          "s3:Get*",
          "s3:ListBucket"
        ],
        "Resource" : [
          "${aws_s3_bucket.ehr_repo_access_logs.arn}",
          "${aws_s3_bucket.ehr_repo_access_logs.arn}/*"
        ],
        Condition : {
          Bool : {
            "aws:SecureTransport" : "false"
          }
        }
      }
    ]
  })
}
