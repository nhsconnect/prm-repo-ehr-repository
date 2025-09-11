deploy-local:
	ACTIVATE_PRO=0 localstack start -d
	venv/bin/awslocal s3 mb s3://test-bucket
	venv/bin/awslocal dynamodb create-table --region eu-west-2 --cli-input-json file://scripts/local-test-db-scheme.json
	export S3_BUCKET_NAME="test-bucket"
	export LOCALSTACK_URL="http://localhost:4566"
	export DYNAMODB_NAME="local-test-db"
	export DYNAMODB_LOCAL_ENDPOINT="http://localhost:4566"
	export AWS_ACCESS_KEY_ID="LSIA5678901234567890"
	export AWS_SECRET_ACCESS_KEY="LSIA5678901234567890"
	export SERVICE_URL="http://localhost:3000"
	export NHS_ENVIRONMENT="dev"
	NHS_ENVIRONMENT=NHS_ENVIRONMENT S3_BUCKET_NAME=S3_BUCKET_NAME \
 	LOCALSTACK_URL=LOCALSTACK_URL DYNAMODB_LOCAL_ENDPOINT=DYNAMODB_LOCAL_ENDPOINT \
 	SERVICE_URL=SERVICE_URL DYNAMODB_NAME=DYNAMODB_NAME \
 	 	docker compose -f docker-compose-test.yml up -d

	npm run test:coverage
