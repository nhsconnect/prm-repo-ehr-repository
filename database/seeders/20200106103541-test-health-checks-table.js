'use strict';

const tableName = 'health_checks';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: '547d3008-8d03-428b-9fa1-be82f948a5ef',
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
