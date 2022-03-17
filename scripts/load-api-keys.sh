#!/bin/bash
AWS_DEFAULT_REGION=eu-west-2
NHS_SERVICE=ehr-repo

# Iterates through all api keys in ssm for producer
for key in $(aws ssm get-parameters-by-path --region ${AWS_DEFAULT_REGION} --path "/repo/${NHS_ENVIRONMENT}/user-input/api-keys/ehr-repo/" --recursive --query 'Parameters[].Name' --output text)
do
  # Gets the value of each api key
  value=$(aws ssm get-parameter --region ${AWS_DEFAULT_REGION} --with-decryption --name "${key}" --query Parameter.Value --output text)
  # Splits ssm path to get consumer name
  IFS='/' read -ra ADDR <<< "${key}"

  # Checks for if for user or service and replaces with dashes from consumer name with underscores for env variable
  if [[ $key  =~ "api-key-user" ]]; then
   consumerName="${ADDR[7]//-/_}"
   consumerName="${consumerName//./_}"
  else
   consumerName="${ADDR[6]//-/_}"
  fi

  capitalizedConsumerName=$(echo ${consumerName} | tr [:lower:] [:upper:])
  export API_KEY_FOR_${capitalizedConsumerName}="${value}"
done
