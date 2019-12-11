data "aws_iam_policy_document" "ecs-assume-role-policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = [
        "ecs-tasks.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role" "ehr-repo" {
  name               = "${var.environment}-ehr-repo-EcsTaskRole"
  assume_role_policy = "${data.aws_iam_policy_document.ecs-assume-role-policy.json}"
  description        = "Role assumed by ehr-repo ECS task"
}

data "aws_iam_policy_document" "ehr-repo-s3" {
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject"
    ]

    resources = [
      "arn:aws:s3:::${var.s3_bucket_name}/*"
    ]
  }
}

resource "aws_iam_policy" "ehr-repo-s3" {
  name   = "${var.environment}-ehr-repo-s3"
  policy = "${data.aws_iam_policy_document.ehr-repo-s3.json}"
}

resource "aws_iam_role_policy_attachment" "ehr-repo-s3-attach" {
  role       = "${aws_iam_role.ehr-repo.name}"
  policy_arn = aws_iam_policy.ehr-repo-s3.arn
}
