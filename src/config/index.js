import sequelizeConfig from './database';

export const portNumber = 3000;

export const initializeConfig = () => ({
  ehrServiceUrl: process.env.SERVICE_URL || `http://127.0.0.1:${portNumber}`,
  ehrRepoAuthKeys: process.env.AUTHORIZATION_KEYS,
  awsS3BucketName: process.env.S3_BUCKET_NAME,
  localstackUrl: process.env.LOCALSTACK_URL,
  sequelize: sequelizeConfig,
  nhsEnvironment: process.env.NHS_ENVIRONMENT || 'local',
  apiKeyForE2eTest: process.env.API_KEY_FOR_E2E_TEST || 'auth-key',
  consumerApiKeys: loadConsumerKeys(),
});

const loadConsumerKeys = () => {
  const consumerApiKeys = {};
  Object.keys(process.env).forEach((envVarName) => {
    if (envVarName.startsWith('API_KEY_FOR_')) {
      const consumerName = envVarName.split('API_KEY_FOR_')[1];
      consumerApiKeys[consumerName] = process.env[envVarName];
    }
  });
  return consumerApiKeys;
};
