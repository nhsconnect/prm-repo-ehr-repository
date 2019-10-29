# Deductions EHR Repository

## Prerequisites

* Node 12.x

## Set up

Run `npm install` to install all dependencies.

Add a .env file in the root of the repository with the following environment variables:

```
NODE_ENV=local
```

Setting the `NODE_ENV` variable to local will store any uploaded files in your local file system instead of S3.

## Running the tests

Run the tests with `npm test`.

## Start the app locally

Run a development server with `npm start`.
