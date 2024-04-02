data "aws_iam_policy_document" "ehr_transfer_tracker_db_access" {
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query"
    ]
    resources = [
      "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/${var.environment}-ehr-transfer-tracker"
    ]
  }
}

resource "aws_iam_policy" "ehr_transfer_tracker_db_access" {
  name   = "${var.environment}-${var.component_name}-transfer-tracker-db-access"
  policy = data.aws_iam_policy_document.ehr_transfer_tracker_db_access.json
}

# Grant ECS Task permissions to access the transfer tracker db
resource "aws_iam_role_policy_attachment" "dynamodb_application_user_policy_attach" {
  role       = "${var.environment}-${var.component_name}-EcsTaskRole"
  policy_arn = aws_iam_policy.ehr_transfer_tracker_db_access.arn
}

data "aws_iam_policy_document" "transfer_tracker_indexes_access" {
  statement {
    actions = [
      "dynamodb:Query"
    ]
    resources = [
      "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/${var.environment}-ehr-transfer-tracker/index/*"
    ]
  }
}

resource "aws_iam_policy" "transfer_tracker_indexes_access" {
  name   = "${var.environment}-${var.component_name}-transfer-tracker-indexes-access"
  policy = data.aws_iam_policy_document.transfer_tracker_indexes_access.json
}

resource "aws_iam_role_policy_attachment" "ecs_dynamo_indexes" {
  role       = "${var.environment}-${var.component_name}-EcsTaskRole"
  policy_arn = aws_iam_policy.transfer_tracker_indexes_access.arn
}
