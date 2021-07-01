resource "postgresql_role" "migration_role" {
  name     = "migration_role"
}

resource "postgresql_grant" "migration_role_schema_usage_grant" {
  database    = var.db_name
  role        = postgresql_role.migration_role.name
  schema      = "public"
  object_type = "schema"
  privileges  = ["USAGE", "CREATE"]
}

# Giving access to all tables instead of SequelizeMeta until this is implemented: https://github.com/cyrilgdn/terraform-provider-postgresql/pull/79
resource "postgresql_grant" "migration_role_table_read_write_grant" {
  database    = var.db_name
  role        = postgresql_role.migration_role.name
  schema      = "public"
  object_type = "table"
  privileges  = ["SELECT", "INSERT"]
}

resource "postgresql_role" "migration_user" {
  name     = "migration_user"
  login    = true
  valid_until = ""
  roles = ["rds_iam", postgresql_role.migration_role.name]
}

resource "aws_ssm_parameter" "migration_user" {
  name = "/repo/${var.environment}/output/${var.repo_name}/db-migration-user"
  type = "String"
  value = postgresql_role.migration_user.name
}

 data "aws_iam_policy_document" "migration-assume-role-policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      identifiers = [
        "ec2.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role" "db_migration_role" {
  name               = "${var.environment}-${var.component_name}-DbMigrationRole"
  assume_role_policy = data.aws_iam_policy_document.migration-assume-role-policy.json
  description        = "DbMigration role to migrate db in the pipeline"

  tags = {
    Environment = var.environment
    CreatedBy= var.repo_name
  }
}

resource "aws_iam_instance_profile" "db_migration_role_profile" {
  name = "${var.environment}-${var.component_name}-DbMigrationRole"
  role = aws_iam_role.db_migration_role.name
}

data "aws_iam_policy_document" "db_migration_user_policy_doc" {
  statement {
    actions = [
      "rds-db:connect"
    ]

    resources = [
      "arn:aws:rds-db:${var.region}:${data.aws_caller_identity.current.account_id}:dbuser:${data.aws_ssm_parameter.db_cluster_resource_id.value}/${postgresql_role.migration_user.name}"
    ]

    effect = "Allow"
  }
}

resource "aws_iam_policy" "db_migration_user_policy" {
  name   = "${var.environment}-${var.component_name}-db_migration_user"
  policy = data.aws_iam_policy_document.db_migration_user_policy_doc.json
}

resource "aws_iam_role_policy_attachment" "db_migration_user_policy_attach" {
  role       = aws_iam_role.db_migration_role.name
  policy_arn = aws_iam_policy.db_migration_user_policy.arn
}
