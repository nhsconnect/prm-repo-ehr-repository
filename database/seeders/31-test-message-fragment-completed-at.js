'use strict';

const tableName = 'message_fragments';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: '1856e953-b336-4385-81c6-fc6d7bc6b846',
        message_id: '4b677d19-f13f-488a-84ac-57f6948b34fe',
        health_record_id: '7d5712f2-d203-4f11-8527-1175db0d2a4a',
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '4dd0193f-6ab9-47f5-8cce-e5506d466702',
        message_id: 'b829bc94-58d5-4481-99e1-8cc1afacae06',
        health_record_id: '7d5712f2-d203-4f11-8527-1175db0d2a4a',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
