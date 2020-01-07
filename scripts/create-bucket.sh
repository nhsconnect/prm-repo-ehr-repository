#!/bin/bash
set -e
awslocal --endpoint-url=${LOCALSTACK_URL} s3 mb s3://${S3_BUCKET_NAME}
set +e
