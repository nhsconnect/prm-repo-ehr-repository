locals {
  ehr_repo_bucket_access_logs_prefix = "s3-access-log/"
}

//TODO: Rename to ehr_repo_health_record_data
// Upgrade terraform version to latest
resource "aws_s3_bucket" "ehr-repo-bucket" {
  bucket        = var.s3_bucket_name
  acl           = "private"
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
  logging {
    target_bucket = aws_s3_bucket.ehr_repo_access_logs.id
    target_prefix = local.ehr_repo_bucket_access_logs_prefix
  }
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "ehr_repo_bucket_versioning" {
  bucket = aws_s3_bucket.ehr-repo-bucket.bucket

  versioning_configuration {
    # To be re-enabled when introducing object lock
    status = "Suspended"
  }
}

resource "aws_s3_bucket_policy" "ehr-repo-bucket_policy" {
  bucket = aws_s3_bucket.ehr-repo-bucket.id
  policy = jsonencode({
    "Statement": [
      {
        Effect: "Deny",
        Principal: "*",
        Action: "s3:*",
        Resource: "${aws_s3_bucket.ehr-repo-bucket.arn}/*",
        Condition: {
          Bool: {
            "aws:SecureTransport": "false"
          }
        }
      },
      {
        Effect: "Deny",
        Principal:  {
          "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/NHSDAdminRole"
        },
        Action: "s3:*",
        Resource: [
          "${aws_s3_bucket.ehr-repo-bucket.arn}",
          "${aws_s3_bucket.ehr-repo-bucket.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket" "ehr_repo_access_logs" {
  bucket        = "${var.environment}-${var.component_name}-access-logs"
  acl           = "private"
  force_destroy = true
  versioning {
    enabled = false
  }
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_policy" "ehr_repo_permit_developer_to_see_access_logs_policy" {
  count = var.is_restricted_account ? 1 : 0
  bucket = aws_s3_bucket.ehr_repo_access_logs.id
  policy = jsonencode({
    "Statement": [
      {
        Effect: "Allow",
        Principal:  {
          "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/RepoDeveloper"
        },
        Action: ["s3:Get*","s3:ListBucket"],
        Resource: [
          "${aws_s3_bucket.ehr_repo_access_logs.arn}",
          "${aws_s3_bucket.ehr_repo_access_logs.arn}/*"
        ],
        Condition: {
          Bool: {
            "aws:SecureTransport": "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "ehr_repo_permit_s3_to_write_access_logs_policy" {
  bucket        = aws_s3_bucket.ehr_repo_access_logs.id
  policy = jsonencode({
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "S3ServerAccessLogsPolicy",
        "Effect": "Allow",
        "Principal": {
          "Service": "logging.s3.amazonaws.com"
        },
        "Action": "s3:PutObject",
        "Resource": "${aws_s3_bucket.ehr_repo_access_logs.arn}/${local.ehr_repo_bucket_access_logs_prefix}*",
        Condition: {
          Bool: {
            "aws:SecureTransport": "false"
          }
        }
      },
      {
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::652711504416:root"
        },
        "Action": "s3:PutObject",
        "Resource": "${aws_s3_bucket.ehr_repo_access_logs.arn}/${local.ehr_repo_bucket_access_logs_prefix}AWSLogs/${local.account_id}/*",
        Condition: {
          Bool: {
            "aws:SecureTransport": "false"
          }
        }
      }
    ]
  })
}