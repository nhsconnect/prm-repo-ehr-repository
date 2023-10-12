# EHR Repository

A store for the Electronic Health Records (EHRs) of patients that are no longer registered with a GP Practice.

The stored the EHR is composed of the messages sent from its previous holder in its transfer over the GP2GP protocol.

## Prerequisites

- [Node](https://nodejs.org/en/download/package-manager/#nvm) - version 14.x
- [Docker](https://docs.docker.com/install/)
- [kudulab/dojo](https://github.com/kudulab/dojo#installation)

In order to run npm install locally on your host (outside of dojo), you'll need to install postgresql:
```
brew install postgresql
```

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
- `DATABASE_USER` - username for the database
- `DATABASE_PASSWORD` - password to the database
- `DATABASE_NAME` - name of the database on server.
- `DATABASE_HOST` - database server hostname to connect with.
- `LOCALSTACK_URL` - (Test) the location of localstack, only used for tests
```

## Running the tests

Run the unit tests with

by entering the `dojo` container and running `./tasks _test_unit`
or on your machine with `npm run test:unit`

Run the integration tests within a Dojo container

1. Run `dojo -c Dojofile-itest` which will spin up the testing container
2. Run `./tasks _test_integration`

You can also run them with `npm run test:integration` but that will require some additional manual set-up:

```bash
# Brings up the local test environment
docker-compose up &

# Alternative with node-dojo (interactive)
# Requires changes to Environment Variables:
#   DATABASE_HOST=db
#   LOCALSTACK_URL=http://localstack:4572
dojo -c Dojofile-itest

npm run test-local

# This is equivalent of:
sequelize-cli db:migrate    # Runs the migration

npm test

sequelize-cli db:migrate:undo:all # Undoes the migration to leave clean env
```

## Run the coverage tests (unit and integration tests)

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