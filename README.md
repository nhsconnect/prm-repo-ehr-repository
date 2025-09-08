# EHR Repository

A store for the Electronic Health Records (EHRs) of patients that are no longer registered with a GP Practice.

The stored the EHR is composed of the messages sent from its previous holder in its transfer over the GP2GP protocol.

## Prerequisites

- [Node](https://nodejs.org/en/download/package-manager/#nvm) - version 22.x
- [Docker](https://docs.docker.com/install/)
- [kudulab/dojo](https://github.com/kudulab/dojo#installation)

### AWS helpers

This repository imports shared AWS helpers from [prm-deductions-support-infra](https://github.com/nhsconnect/prm-deductions-support-infra/).
They can be found `utils` directory after running any task from `tasks` file.

## Set up

To replicate the ci environment, we use `dojo` that allows us to work with the codebase without installing any dependencies locally.
Please see the `./tasks` file that includes all the tasks you can use to configure and run the app and the tests.

If you would like to run the app locally outside `dojo`, you need to:
1. Run `npm install` to install all node dependencies as per `package.json`.
2. Set up the env variables and/or copy them into your IDE configurations (`Run -> Edit Configurations ->Environment Variables` in IntelliJ):
```
- `NHS_ENVIRONMENT` - should be set to current environment in which the container is deployed. The name must also exist in the `database.json` file.
- `S3_BUCKET_NAME` - the name of S3 bucket to store the EHR fragments in.
- `LOCALSTACK_URL` - (Test) the location of localstack, only used for s3 related tests
- `DYNAMODB_NAME` - The table name of the dynamodb table (ehr-transfer-tracker) used
```

## Running the tests

Run the unit tests by entering the `dojo` container and running `./tasks _test_unit`
or on your machine with `npm run test:unit`

Run the integration tests within a Dojo container

1. Run `./tasks test_integration_shell` which will spin up the testing container
2. Run `./tasks _test_integration`

You can also run them with `./tasks test_integration` from out of dojo.

You can also run each individual integration test separately in an IDE (assuming IntelliJ),
but that will require some additional manual set-up:

```bash
# Config env var, spin up docker containers and enter interactive dojo environment
./tasks test_integration_shell

# If things work as expected your prompts should looks like `dojo@xxxx(node-dojo):/dojo/work$`
# inside dojo, run the below script to create a dynamodb table for integration test
scripts/create-dynamodb-table.sh

# The above script will create a test table in dynamodb-local docker image. 
# The dynamodb-local is accessible at endpoint http://dynamodb-local:8000 within docker, 
# or at endpoint http://localhost:4573 from out of docker.
# This should allow you to run or debug db-related integration tests from Intellij's play button. 
```

## Run the coverage tests (unit test and integration test)

By entering the `dojo` container and running `./tasks _test_coverage`

or run `npm run test:coverage` on your machine

You don't have to enter the dojo container every time, you can also just run any task in your terminal:
For example:

`./tasks test_coverage`

`./tasks test_unit`

`./tasks dep` - to run audit


## Start the app locally

Run `docker-compose up -d` to spin up all the dependencies.

Run a development server with `npm run start:local`.

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

## Docker

Docker image can be build locally with

```
./tasks build_docker_local
```

### Swagger

The swagger documentation for the app can be found at `http://localhost:3000/swagger`. To update it, change the
`src/swagger.json` file. You can use the editor `https://editor.swagger.io/` which will validate your changes.

## Access to AWS from CLI

In order to get sufficient access to work with terraform or AWS CLI, please follow the instructions on this [confluence pages](https://gpitbjss.atlassian.net/wiki/spaces/TW/pages/11384160276/AWS+Accounts+and+Roles)
and [this how to?](https://gpitbjss.atlassian.net/wiki/spaces/TW/pages/11286020174/How+to+set+up+access+to+AWS+from+CLI)

As a note, this set-up is based on the README of assume-role [tool](https://github.com/remind101/assume-role)

## Assume role with elevated permissions

### Install `assume-role` locally:
`brew install remind101/formulae/assume-role`

Run the following command with the profile configured in your `~/.aws/config`:

`assume-role admin`

### Run `assume-role` with dojo:
Run the following command with the profile configured in your `~/.aws/config`:

`eval $(dojo "echo <mfa-code> | assume-role dev"`
or
`assume-role dev [here choose one of the options from your config: ci/dev/test]`

Run the following command to confirm the role was assumed correctly:

`aws sts get-caller-identity`

Work with terraform as per usual:

```
terraform init
terraform apply
```

If your session expires, exit the container to drop the temporary credentials and run dojo again.