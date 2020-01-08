require('dotenv').config();

const base_config = {
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  dialect: 'postgres',
  logging: false
};

module.exports = {
  local: base_config,
  dev: base_config,
  test: base_config,
  prod: base_config
};
