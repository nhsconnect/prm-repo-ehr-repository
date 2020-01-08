import sequelizeConfig from './database';

const config = {
  awsS3BucketName: process.env.S3_BUCKET_NAME,
  isLocal: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'local',
  localstackUrl: process.env.LOCALSTACK_URL,
  sequelize: sequelizeConfig[process.env.NODE_ENV || 'local']
};

export default config;
