'use strict';

const tableName = 'health_record_manifests';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: 'e02f1106-e3b2-45e4-872c-aad03740a4b5',
        message_id: '03ba2531-42e3-4a70-82e6-df6fff52b226',
        health_record_id: '7d5712f2-d203-4f11-8527-1175db0d2a4a',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '03ba2531-42e3-4a70-82e6-df6fff52b226',
        message_id: 'ae078243-59d8-4d21-b587-daac5d126f68',
        health_record_id: '7d5712f2-d203-4f11-8527-1175db0d2a4a',
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
