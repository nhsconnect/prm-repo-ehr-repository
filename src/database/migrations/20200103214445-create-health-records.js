'use strict';

const HealthRecord = require("../models").HealthRecord;

const tableName = HealthRecord.getTableName();

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(tableName, HealthRecord.getModel(Sequelize));
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(tableName);
  }
};