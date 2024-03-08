import Sequelize from 'sequelize';
import { initializeConfig } from '../config';
import * as models from './models';
import { Signer } from 'aws-sdk/clients/rds';
import AWS from 'aws-sdk';
import { logError, logInfo } from '../middleware/logging';

class ModelFactory {
  /**
   * @deprecated
   * Postgres DB related stubs
   * To be deleted PRMT-4568
   */
  constructor() {
    this.db = {};
    this.sequelize = {};
    this.config = initializeConfig().sequelize;
    this._resetConfig();
  }

  _overrideConfig(key, value) {
    this.base_config[key] = value;
    this.configure();
  }

  _resetConfig() {
    this.base_config = this.config;
    this.configure();
  }

  configure() {
    if (this.sequelize instanceof Sequelize) {
      this.sequelize.close();
    }

    let signer, getAuthTokenAsync;
    if (this.base_config.use_rds_credentials) {
      signer = new Signer({
        credentials: new AWS.RemoteCredentials({
          httpOptions: { timeout: 5000 }, // 5 second timeout
          maxRetries: 10, // retry 10 times
          retryDelayOptions: { base: 200 }, // see AWS.Config for information
        }),
        region: 'eu-west-2',
        username: this.base_config.username,
        hostname: this.base_config.host,
        port: 5432,
      });

      getAuthTokenAsync = () =>
        new Promise((resolve, reject) => {
          signer.getAuthToken((err, token) => {
            if (err) {
              reject(err);
            } else {
              resolve(token);
            }
          });
        });
    }

    this.sequelize = new Sequelize(
      this.base_config.database,
      this.base_config.username,
      this.base_config.password,
      this.base_config
    );

    if (this.base_config.use_rds_credentials) {
      this.sequelize.beforeConnect(async (config) => {
        logInfo('Obtaining new RDS DB Auth token');
        try {
          config.password = await getAuthTokenAsync();
        } catch (err) {
          logError('Error while retrieving auth token for RDS ', err);
        }
      });
    }

    this.sequelize
      .authenticate()
      .then(() => logInfo('DB Connection has been established successfully.'))
      .catch((e) => logError('Unable to connect to the database:', e));

    this.reload_models();
  }

  reload_models() {
    this.db = {};

    for (const m in models) {
      const model = models[m](this.sequelize, Sequelize.DataTypes);
      this.db[model.name] = model;
    }

    Object.keys(this.db).forEach((modelName) => {
      if (this.db[modelName].associate) {
        this.db[modelName].associate(this.db);
      }
    });

    this.db.sequelize = this.sequelize;
    this.db.Sequelize = Sequelize;
  }

  getByName(moduleName) {
    return this.db[moduleName];
  }
}

export default new ModelFactory();
