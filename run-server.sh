#!/bin/bash

# This script executes on docker container start.
# It runs the DB migration and then starts node.js server

DB_CONNECTION_TIMEOUT=30

if [ ! -d "${PWD}/node_modules/.bin/" ]; then
  echo "${PWD}/node_modules/.bin/ not does not exist. It is required to run DB migrations."
  exit 3
fi

export PATH="${PATH}:${PWD}/node_modules/.bin/"

if [ -z "${NHS_ENVIRONMENT}" ]; then
  echo "NHS_ENVIRONMENT must be set."
  exit 4
fi

if [ "${EHR_REPO_SKIP_MIGRATION}" == "true" ]; then
  echo "EHR_REPO_SKIP_MIGRATION is set to true. Skipping DB migration"
else
  echo "Waiting for DB port to become open 5432"
  count=0
  while ! nc -z ${DATABASE_HOST} 5432; do
    echo "Waiting for ${DATABASE_HOST}:5432"
    sleep 1
    ((count++))
    if [ "${DB_CONNECTION_TIMEOUT}" -le $count ]; then
      echo "Timed-out waiting for DB connection at ${DATABASE_HOST}:5432"
      exit 5
    fi
  done
  echo "DB connection at ${DATABASE_HOST}:5432 is available"
  echo "Trying to create a database, if not exists. 'Already exists' errors are safe to ignore"
  PGPASSWORD="${DATABASE_PASSWORD}" createdb --host="${DATABASE_HOST}" --username="${DATABASE_USER}" $DATABASE_NAME || true
  set -e
  db-migrate up -e ${NHS_ENVIRONMENT} --config database.json
  echo "DB migration completed."
fi

echo "Starting node.js server"
set -e
exec node server.js
