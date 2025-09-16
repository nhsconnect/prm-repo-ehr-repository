test-local-all:
	ACTIVATE_PRO=0 localstack start -d
	venv/bin/awslocal dynamodb create-table --region eu-west-2 --cli-input-json file://scripts/local-test-db-scheme.json --no-cli-page
	venv/bin/awslocal s3 mb s3://test-bucket
	npm run test:coverage
	docker kill localstack-main