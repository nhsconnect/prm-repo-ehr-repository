const use_ssl = process.env.USE_SSL_FOR_DB === 'true';
const use_rds_credentials = process.env.USE_AWS_RDS_CREDENTIALS === 'true';

const sequelizeConfig = {
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  dialect: 'postgres',
  logging: false,
  use_rds_credentials,
};

if (use_ssl) {
  sequelizeConfig.ssl = use_ssl;
  sequelizeConfig.dialectOptions = {
    // see https://node-postgres.com/features/ssl
    ssl: {
      rejectUnauthorized: false,
    },
  };
}

module.exports = sequelizeConfig;
