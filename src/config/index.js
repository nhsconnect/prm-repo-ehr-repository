import sequelizeConfig from './database';

export const initializeConfig = () => ({
  awsS3BucketName: process.env.S3_BUCKET_NAME,
  localstackUrl: process.env.LOCALSTACK_URL,
  sequelize: sequelizeConfig,
  nhsEnvironment: process.env.NHS_ENVIRONMENT || 'local'
});
