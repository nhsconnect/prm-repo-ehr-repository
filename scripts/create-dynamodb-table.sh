#!/bin/bash

export AWS_SECRET_ACCESS_KEY=test_key
export AWS_ACCESS_KEY_ID=test_id
export AWS_REGION=eu-west-2

set -e
echo Creating dynamodb table in localstack...
cd "$(dirname "$0")"
awslocal --region eu-west-2 dynamodb create-table --cli-input-json file://ehr-transfer-tracker-db.json
set +e