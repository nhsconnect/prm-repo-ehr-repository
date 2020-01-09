const sequelizeConfig = require('./database');

const config = {
  awsS3BucketName: process.env.S3_BUCKET_NAME,
  databaseUser: process.env.DATABASE_USER,
  databasePassword: process.env.DATABASE_PASSWORD,
  isLocal: process.env.NODE_ENV === 'local',
  databaseName: process.env.DATABASE_NAME,
  databaseHost: process.env.DATABASE_HOST,
  sequelize: sequelizeConfig[process.env.NODE_ENV || 'local']
};

export default config;
