'use strict';
const Patient = require("../models").Patient;

const tableName = Patient.getTableName();

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(tableName, Patient.getModel(Sequelize));
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(tableName);
  }
};