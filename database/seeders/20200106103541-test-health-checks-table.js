"use strict";

const uuid = require("uuid");

const tableName = "health_checks";

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert(tableName,
      [{
        slug: uuid(),
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
