# Deductions EHR Repository

## Prerequisites

* Node 12.x

## Set up

Run `npm install` to install all node dependencies and `npm install -g sequelize-cli` if you want
to speed up the migrations.

Add a .env file in the root of the repository with the following environment variables:

```
NODE_ENV=local
DATABASE_NAME=deductions_test
DATABASE_USER=deductions_user
DATABASE_PASSWORD=secret
DATABASE_HOST=127.0.0.1
S3_ BUCKET_NAME=test-bucket
LOCALSTACK_URL=http://localhost:4572
```

## Running the tests

To run the tests locally, you can use the following.
```bash
# Brings up the local test environment
docker-compose up &

# Alternative with node-dojo (interactive)
dojo -c Dojofile-itest`

npm run test-local

# This is equivilent of:
npx sequelize-cli db:migrate # Runs the migration
npx sequelize-cli db:seed:all # Seeds test data

npm test

npx sequelize-cli db:migrate:undo:all # Undoes the migration to leave clean env
```

To run them before commit in dojo.
```bash
./tasks test
```

## Start the app locally

Run a development server with `npm run start-local`.

## Start the app in production mode

```bash
# Dojo - same as what is run in pipeline

# Builds the docker container with the app in
./tasks build_docker_local

# Runs the tests against the app in the docker container
./tasks test_docker_local

# Runs the ehr with db and localstack locally in interactive mode
dojo -c Dojofile-dtest
```

# Docker

Docker image can be build locally with

```
./tasks build_docker_local
```

## Environment variables

Image is configurable by environment variables:
 - `EHR_REPO_SKIP_MIGRATION` - allows to skip database migration when container starts.
 - `NHS_ENVIRONMENT` - should be set to current environment in which the container is deployed. The name must also exist in the `database.json` file.
 - `S3_BUCKET_NAME` - the name of S3 bucket to store the EHR fragments in.
 - `DATABASE_USER` - username for the database
 - `DATABASE_PASSWORD` - password to the database
 - `DATABASE_NAME` - name of the database on server.
 - `DATABASE_HOST` - database server hostname to connect with.
 - `LOCALSTACK_URL` - (Test) the location of localstack, only used for tests
