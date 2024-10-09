#!/bin/bash

NHS_SERVICE=ehr-repo

timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}
function jsonPrettify {
  echo "{message: $1, level: $2, timestamp: `timestamp`, service: ${NHS_SERVICE}, environment: ${NHS_ENVIRONMENT} } "
}

jsonPrettify "Skipping DB migrations, expecting them to have been run prior to app startup" INFO

jsonPrettify "Loading API Keys" INFO
source ./scripts/load-api-keys.sh

jsonPrettify "Starting node.js server" INFO
set -e
exec node build/server.js
# TODO: PRMP-123 - IS THIS FILE NEEDED? IF SO, DOES IT NEED RENAMING TO "run-server.sh"