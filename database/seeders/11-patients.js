'use strict';

const tableName = 'patients';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: '3779fb0c-4142-43a4-a9b8-c5f5f3f632cc',
        nhs_number: 8888888888,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
