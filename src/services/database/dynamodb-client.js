import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const getDynamodbClient = () => {
  const clientConfig = {
    region: process.env.AWS_DEFAULT_REGION ?? 'eu-west-2',
  };

  const isInLocal = process.env.NHS_ENVIRONMENT === 'local' || !process.env.NHS_ENVIRONMENT;
  const isInDojo = process.env.DOJO_VERSION !== undefined;

  if (isInLocal) {
    // for running whole integration test suite in dojo
    clientConfig.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT;
  }
  if (isInLocal && !isInDojo) {
    // for running individual test with IDE
    clientConfig.endpoint = 'http://localhost:4573';
  }

  const baseClient = new DynamoDBClient(clientConfig);
  return DynamoDBDocumentClient.from(baseClient);
};
