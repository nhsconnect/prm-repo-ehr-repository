const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

class ModelFactory {
  constructor() {
    this.db = {};
    this.sequelize = {};
    this._resetConfig();
  }

  _overrideConfig(key, value) {
    this.base_config[key] = value;
    this.configure();
  }

  _resetConfig() {
    this.base_config = require(__dirname + '/../../../database/config/config.js')[
      process.env.NODE_ENV || 'development'
    ];
    this.configure();
  }

  configure() {
    this.sequelize = new Sequelize(
      this.base_config.database,
      this.base_config.username,
      this.base_config.password,
      this.base_config
    );

    this.reload_models();
  }

  reload_models() {
    this.db = {};

    fs.readdirSync(__dirname)
      .filter(file => {
        return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
      })
      .forEach(file => {
        const model = this.sequelize['import'](path.join(__dirname, file));
        this.db[model.name] = model;
      });

    Object.keys(this.db).forEach(modelName => {
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
