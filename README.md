# Deductions EHR Repository

## Prerequisites

* Node 12.x

## Set up

Create the development and test databases. This script will use your default postgreSQL login credentials. You will
need to provide a password for the deductions database user.

```
./db-setup.sh your-password-here
```

Run `npm install` to install all node dependencies.

Add a .env file in the root of the repository with the following environment variables:

```
NODE_ENV=local
DATABASE_NAME=deductions_db
DATABASE_USER=deductions_user
DATABASE_PASSWORD=your-password-here
DATABASE_HOST=localhost
```

Set the `DATABASE_PASSWORD` to the value provided when running the db setup script. Setting the `NODE_ENV` variable to
local will store any uploaded files in your local file system instead of S3.

Migrate the development and test databases:

```
npm run migrate
npm run migrate-test
```

## Running the tests

Run the tests with `npm test`.

## Start the app locally

Run a development server with `npm run start-local`.

## Start the app in production mode

Compile the code with `npm run build`, and then start the server with `npm start`.
