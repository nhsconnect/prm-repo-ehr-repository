const use_ssl = process.env.USE_SSL_FOR_DB === 'true';

const sequelizeConfig = {
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  dialect: 'postgres',
  logging: false,
};

if (use_ssl) {
  sequelizeConfig.ssl = use_ssl;
  sequelizeConfig.native = use_ssl;
  sequelizeConfig.dialectOptions = { ssl: 'require' };
}

module.exports = sequelizeConfig;
