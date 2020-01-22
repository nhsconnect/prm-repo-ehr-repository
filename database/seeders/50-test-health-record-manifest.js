'use strict';

const tableName = 'health_record_manifests';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: 'f0a906ef-49b6-49a8-89f1-cb063d31c4dc',
        message_id: '93b699fc-03fb-438f-b5a1-ce936e0f9d4e',
        health_record_id: '7d5712f2-d203-4f11-8527-1175db0d2a4a',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'd65c74cb-5b74-4185-8404-f5284fd5ce89',
        message_id: 'ee6675b2-6957-46f5-8f17-363b6092092c',
        health_record_id: '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4',
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'fdc11256-f3d5-435f-a814-c2f1530566f4',
        message_id: '35f2e99d-f71e-4fca-bda1-c6f252b102e0',
        health_record_id: '1879b920-7174-4ef1-92f7-12383114b052',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: new Date()
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
