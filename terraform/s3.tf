resource "aws_s3_bucket" "ehr-repo-bucket" {
  bucket        = var.s3_bucket_name
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

  logging {
    target_bucket = aws_s3_bucket.ehr_repo_log_bucket.id
    target_prefix = "log/"
  }

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
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

resource "aws_s3_bucket" "ehr_repo_log_bucket" {
  bucket        = var.s3_log_bucket_name
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

resource "aws_s3_bucket_policy" "ehr_repo_log_bucket_policy" {
  count = var.is_restricted_account ? 1 : 0
  bucket = aws_s3_bucket.ehr_repo_log_bucket.id
  policy = jsonencode({
    "Statement": [
      {
        Effect: "Allow",
        Principal:  {
          "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/RepoDeveloper"
        },
        Action: ["s3:Get*","s3:ListBucket"],
        Resource: [
          "${aws_s3_bucket.ehr_repo_log_bucket.arn}",
          "${aws_s3_bucket.ehr_repo_log_bucket.arn}/*"
        ]
      }
    ]
  })
}


