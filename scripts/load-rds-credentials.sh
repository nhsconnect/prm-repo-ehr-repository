#!/bin/bash

NHS_SERVICE=ehr-repo

timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

function jsonPrettify {
  echo "{message: $1, level: $2, timestamp: `timestamp`, service: ${NHS_SERVICE}, environment: ${NHS_ENVIRONMENT} } "
}

if [ "${USE_AWS_RDS_CREDENTIALS}" == "true" ]; then
  jsonPrettify "USE_AWS_RDS_CREDENTIALS is set to true. Getting postgres password from AWS" INFO
  export DATABASE_PASSWORD="$(aws rds generate-db-auth-token --hostname $DATABASE_HOST --port 5432 --region $AWS_REGION --username $DATABASE_USER)"
else
  jsonPrettify "USE_AWS_RDS_CREDENTIALS is not set. Using postgres password from DATABASE_PASSWORD" INFO
fi
